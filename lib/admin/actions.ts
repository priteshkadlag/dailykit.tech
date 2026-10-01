"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { activateSubscription, cancelSubscriptions } from "@/lib/billing/subscriptions";

export interface AdminResult {
  ok: boolean;
  message: string;
}

/** Every admin action re-checks the role from the database-backed session — never trusts the UI. */
async function adminOrThrow() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") throw new Error("Not allowed.");
  return user;
}

const userId = z.string().min(1).max(64);

export async function grantProAction(targetId: string, interval: "monthly" | "yearly"): Promise<AdminResult> {
  await adminOrThrow();
  const id = userId.parse(targetId);
  const period = z.enum(["monthly", "yearly"]).parse(interval);
  if (!(await prisma.user.findUnique({ where: { id }, select: { id: true } }))) return { ok: false, message: "User not found." };
  const sub = await activateSubscription({ userId: id, interval: period, provider: "manual" });
  revalidatePath("/admin", "layout");
  return { ok: true, message: `Pro active until ${sub.currentPeriodEnd.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.` };
}

export async function endProAction(targetId: string): Promise<AdminResult> {
  await adminOrThrow();
  await cancelSubscriptions(userId.parse(targetId));
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Pro ended. The user is back on Free." };
}

export async function setRoleAction(targetId: string, role: "USER" | "ADMIN"): Promise<AdminResult> {
  const admin = await adminOrThrow();
  const id = userId.parse(targetId);
  const next = z.enum(["USER", "ADMIN"]).parse(role);
  if (id === admin.id && next !== "ADMIN") return { ok: false, message: "You can't remove your own admin access." };
  await prisma.user.update({ where: { id }, data: { role: next } });
  revalidatePath("/admin", "layout");
  return { ok: true, message: next === "ADMIN" ? "User is now an admin." : "Admin access removed." };
}
