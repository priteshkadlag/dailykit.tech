import { getSessionUser } from "@/lib/auth/session";
import { currentPlan } from "@/lib/billing/subscriptions";
import { prisma } from "@/lib/prisma";
import { json } from "@/lib/server/api";
import { todayInAppZone } from "@/lib/server/dashboard";
import type { AccountInfo } from "@/lib/account/types";

/**
 * Who is signed in, for client components (header menu, storage mode). Pages stay static and
 * cacheable because they fetch this instead of reading the session while rendering.
 * Also records the user as active today (for daily/monthly active-user stats).
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return json({ user: null } satisfies AccountInfo);

  // A DATE column: store the IST calendar day (as UTC midnight) so it never shifts by a day.
  const today = new Date(todayInAppZone());
  const [plan, settings] = await Promise.all([
    currentPlan(user.id),
    prisma.userSettings.findUnique({ where: { userId: user.id }, select: { analyticsOptOut: true } }),
    prisma.userActivity.upsert({ where: { userId_day: { userId: user.id, day: today } }, create: { userId: user.id, day: today }, update: {} }),
    prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() }, select: { id: true } }),
  ]);

  return json({
    user: { id: user.id, name: user.name, email: user.email, image: user.image, role: user.role, plan: plan.plan },
    analyticsOptOut: settings?.analyticsOptOut ?? false,
  } satisfies AccountInfo);
}
