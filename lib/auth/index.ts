import "server-only";
import NextAuth, { CredentialsSignin, type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { hashIdentifier, ipFromHeaders } from "@/lib/security/request";
import { rateLimit } from "@/lib/security/rate-limit";
import { verifyPassword } from "./password";
import { loginSchema } from "./schemas";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: "USER" | "ADMIN" } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    uid?: string;
    /** User.sessionVersion when the token was issued; a mismatch means the session was revoked. */
    sv?: number;
    role?: "USER" | "ADMIN";
  }
}

export class RateLimitedSignin extends CredentialsSignin {
  code = "rate_limited";
}

export const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

const adminEmails = () =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

/** Promote configured admin emails on sign-in, so the first admin needs no database access. */
async function applyAdminList(user: { id: string; email: string; role: string }) {
  if (user.role !== "ADMIN" && adminEmails().includes(user.email)) {
    await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
  }
}

/**
 * Find or create the user for a Google sign-in and link the Google identity.
 * If an email/password account with the same address was never verified, whoever created it may not
 * own the inbox — so linking Google (which proves ownership) removes that password and ends its sessions.
 */
async function userFromGoogle(profile: { sub?: string | null; email?: string | null; name?: string | null; picture?: string | null }) {
  const providerAccountId = String(profile.sub ?? "");
  const email = String(profile.email ?? "").toLowerCase();
  if (!providerAccountId || !email) return null;

  const linked = await prisma.account.findUnique({
    where: { provider_providerAccountId: { provider: "google", providerAccountId } },
    select: { user: { select: { id: true, email: true, role: true, sessionVersion: true } } },
  });
  if (linked) return linked.user;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        accounts: { create: { provider: "google", providerAccountId } },
        image: existing.image ?? profile.picture ?? null,
        name: existing.name ?? profile.name ?? null,
        ...(existing.emailVerified ? {} : { emailVerified: new Date(), passwordHash: null, sessionVersion: { increment: 1 } }),
      },
      select: { id: true, email: true, role: true, sessionVersion: true },
    });
  }

  return prisma.user.create({
    data: {
      email,
      name: profile.name ?? null,
      image: profile.picture ?? null,
      emailVerified: new Date(),
      accounts: { create: { provider: "google", providerAccountId } },
      settings: { create: {} },
    },
    select: { id: true, email: true, role: true, sessionVersion: true },
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const [perEmail, perIp] = await Promise.all([
          rateLimit("login", hashIdentifier(email)),
          rateLimit("loginPerIp", hashIdentifier(ipFromHeaders(request.headers))),
        ]);
        if (!perEmail.ok || !perIp.ok) throw new RateLimitedSignin();

        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, name: true, image: true, role: true, passwordHash: true, sessionVersion: true },
        });
        if (!(await verifyPassword(password, user?.passwordHash)) || !user) return null;
        await applyAdminList(user);
        return { id: user.id, email: user.email, name: user.name, image: user.image, sessionVersion: user.sessionVersion };
      },
    }),
    ...(googleEnabled ? [Google] : []),
  ],
  callbacks: {
    signIn({ account, profile }) {
      // Only accept Google accounts whose email Google has verified.
      if (account?.provider === "google") return profile?.email_verified === true;
      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (account?.provider === "google" && profile) {
        const dbUser = await userFromGoogle(profile);
        if (!dbUser) return null;
        await applyAdminList(dbUser);
        token.uid = dbUser.id;
        token.sv = dbUser.sessionVersion;
      } else if (user) {
        token.uid = user.id;
        token.sv = (user as { sessionVersion?: number }).sessionVersion ?? 0;
      }
      if (!token.uid) return null;

      // Re-read the user on every request: deleted accounts, password resets and role changes
      // take effect immediately instead of when the token expires.
      const current = await prisma.user.findUnique({
        where: { id: token.uid },
        select: { name: true, email: true, image: true, role: true, sessionVersion: true },
      });
      if (!current || current.sessionVersion !== token.sv) return null;
      token.role = current.role;
      token.name = current.name;
      token.email = current.email;
      token.picture = current.image;
      return token;
    },
    session({ session, token }) {
      session.user.id = token.uid!;
      session.user.role = token.role ?? "USER";
      return session;
    },
  },
});
