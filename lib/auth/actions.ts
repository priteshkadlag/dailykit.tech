"use server";

import { createHash, randomBytes } from "node:crypto";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { AuthError, CredentialsSignin } from "next-auth";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/site";
import { passwordResetEmail, sendEmail } from "@/lib/email";
import { currentIpKey, hashIdentifier } from "@/lib/security/request";
import { rateLimit, retryMessage } from "@/lib/security/rate-limit";
import { googleEnabled, signIn, signOut } from "./index";
import { hashPassword } from "./password";
import { fieldErrors, forgotPasswordSchema, registerSchema, resetPasswordSchema, safeCallbackUrl, type FieldErrors } from "./schemas";

export interface FormState {
  errors?: FieldErrors;
  /** Form-level error shown above the submit button. */
  message?: string;
  /** Success message (forgot-password). */
  success?: string;
  /** Echo non-secret fields back so the form keeps them after a failed submit. */
  values?: Record<string, string>;
  /** Signed in: the client does a full page load here so every part of the app sees the new session. */
  redirectTo?: string;
}

const text = (form: FormData, key: string) => {
  const v = form.get(key);
  return typeof v === "string" ? v : "";
};

async function signInWithPassword(email: string, password: string, redirectTo: string): Promise<FormState> {
  try {
    await signIn("credentials", { email, password, redirect: false });
    return { redirectTo };
  } catch (error) {
    if (error instanceof CredentialsSignin) {
      return {
        message: error.code === "rate_limited" ? "Too many login attempts. Please wait 15 minutes and try again." : "Incorrect email or password.",
        values: { email },
      };
    }
    if (error instanceof AuthError) return { message: "Couldn't log you in. Please try again.", values: { email } };
    throw error;
  }
}

export async function loginAction(_: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email").trim();
  const password = text(form, "password");
  if (!email || !password) {
    return { errors: { ...(email ? {} : { email: "Enter your email" }), ...(password ? {} : { password: "Enter your password" }) }, values: { email } };
  }
  return signInWithPassword(email, password, safeCallbackUrl(text(form, "callbackUrl")));
}

export async function registerAction(_: FormState, form: FormData): Promise<FormState> {
  const raw = { name: text(form, "name"), email: text(form, "email"), password: text(form, "password") };
  const values = { name: raw.name, email: raw.email };
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const limit = await rateLimit("register", await currentIpKey());
  if (!limit.ok) return { message: retryMessage(limit.retryAfterSeconds), values };

  const { name, email, password } = parsed.data;
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return { errors: { email: "An account with this email already exists. Log in instead." }, values };
  }
  try {
    await prisma.user.create({
      data: { name, email, passwordHash: await hashPassword(password), settings: { create: {} } },
    });
  } catch {
    // Unique violation from a simultaneous sign-up with the same email.
    return { errors: { email: "An account with this email already exists. Log in instead." }, values };
  }
  return signInWithPassword(email, password, safeCallbackUrl(text(form, "callbackUrl")));
}

export async function googleSignInAction(form: FormData) {
  if (!googleEnabled) redirect("/login");
  await signIn("google", { redirectTo: safeCallbackUrl(text(form, "callbackUrl")) });
}

/** Clears the session cookie; the caller reloads the page so no signed-in state lingers in memory. */
export async function signOutAction() {
  await signOut({ redirect: false });
}

const RESET_TTL_MINUTES = 60;
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export async function forgotPasswordAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse({ email: text(form, "email") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: { email: text(form, "email") } };
  const { email } = parsed.data;

  const [perIp, perEmail] = await Promise.all([rateLimit("passwordReset", await currentIpKey()), rateLimit("passwordReset", hashIdentifier(email))]);
  if (!perIp.ok || !perEmail.ok) return { message: retryMessage(Math.max(perIp.retryAfterSeconds, perEmail.retryAfterSeconds)), values: { email } };

  // The same reply whether or not the account exists, and the email goes out after the response,
  // so neither the message nor the timing reveals which emails are registered.
  after(async () => {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true } });
    if (!user) return;
    const token = randomBytes(32).toString("base64url");
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
      prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + RESET_TTL_MINUTES * 60_000) },
      }),
    ]);
    try {
      await sendEmail(passwordResetEmail(email, absoluteUrl(`/reset-password?token=${token}`), user.name));
    } catch (error) {
      console.error("Password reset email failed:", error instanceof Error ? error.message : error);
    }
  });

  return { success: `If an account exists for ${email}, we've sent a link to reset the password. Check your inbox and spam folder.` };
}

export async function resetPasswordAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({ token: text(form, "token"), password: text(form, "password"), confirm: text(form, "confirm") });
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    return errors.token ? { message: "This reset link is invalid. Request a new one." } : { errors };
  }
  const { token, password } = parsed.data;

  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: sha256(token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { message: "This reset link has expired or was already used. Request a new one." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      // Ends every existing session; clicking the emailed link also proves the address.
      data: { passwordHash: await hashPassword(password), sessionVersion: { increment: 1 }, emailVerified: new Date() },
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
  ]);
  redirect("/login?reset=1");
}
