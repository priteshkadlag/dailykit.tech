import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "./index";

export interface SessionUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: "USER" | "ADMIN";
}

/** The signed-in user for this request (memoised per request), or null. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.email) return null;
  return { id: user.id, name: user.name ?? null, email: user.email, image: user.image ?? null, role: user.role };
});

/** For pages: send guests to the login page and bring them back afterwards. */
export async function requireUser(returnTo: string) {
  const user = await getSessionUser();
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(returnTo)}`);
  return user;
}

/** For admin pages and actions. Non-admins get a 404 so the admin area isn't advertised. */
export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) redirect("/login?callbackUrl=%2Fadmin");
  if (user.role !== "ADMIN") notFound();
  return user;
}
