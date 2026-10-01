"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signOut } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { changePasswordSchema, fieldErrors, nameSchema } from "@/lib/auth/schemas";
import { getSessionUser } from "@/lib/auth/session";
import { rateLimit, retryMessage } from "@/lib/security/rate-limit";
import type { FormState } from "@/lib/auth/actions";

async function currentUserOrThrow() {
  const user = await getSessionUser();
  if (!user) throw new Error("Please log in again.");
  return user;
}

const text = (form: FormData, key: string) => {
  const v = form.get(key);
  return typeof v === "string" ? v : "";
};

export async function deleteSavedCalculation(id: string) {
  const user = await currentUserOrThrow();
  await prisma.savedCalculation.deleteMany({ where: { userId: user.id, clientId: String(id) } });
  revalidatePath("/dashboard");
}

export async function updateNameAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await currentUserOrThrow();
  const parsed = nameSchema.safeParse(text(form, "name"));
  if (!parsed.success) return { errors: { name: parsed.error.issues[0].message } };
  await prisma.user.update({ where: { id: user.id }, data: { name: parsed.data } });
  revalidatePath("/dashboard", "layout");
  return { success: "Name updated." };
}

/**
 * Change (or, for Google-only accounts, set) the password. Every session — including this one —
 * is ended, so a stolen session can't outlive a password change.
 */
export async function changePasswordAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await currentUserOrThrow();
  const limit = await rateLimit("account", user.id);
  if (!limit.ok) return { message: retryMessage(limit.retryAfterSeconds) };

  const parsed = changePasswordSchema.safeParse({ current: text(form, "current"), password: text(form, "password"), confirm: text(form, "confirm") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const record = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (record?.passwordHash && !(await verifyPassword(parsed.data.current, record.passwordHash))) {
    return { errors: { current: "That's not your current password." } };
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.password), sessionVersion: { increment: 1 } },
  });
  await signOut({ redirect: false });
  // Redirect from here: signing out re-renders the current (now protected) page otherwise.
  redirect("/login?changed=1");
}

export async function setAnalyticsOptOutAction(optOut: boolean) {
  const user = await currentUserOrThrow();
  await prisma.userSettings.upsert({
    where: { userId: user.id },
    create: { userId: user.id, analyticsOptOut: z.boolean().parse(optOut) },
    update: { analyticsOptOut: z.boolean().parse(optOut) },
  });
}

/** End every session on every device (e.g. after using a shared computer). */
export async function signOutEverywhereAction() {
  const user = await currentUserOrThrow();
  await prisma.user.update({ where: { id: user.id }, data: { sessionVersion: { increment: 1 } } });
  await signOut({ redirect: false });
}

/** Permanently delete the account and everything in it (cascades through every relation). */
export async function deleteAccountAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await currentUserOrThrow();
  if (text(form, "confirm").trim().toLowerCase() !== user.email.toLowerCase()) {
    return { errors: { confirm: "Type your email exactly to confirm." } };
  }
  await prisma.user.delete({ where: { id: user.id } });
  await signOut({ redirect: false });
  redirect("/?deleted=1");
}
