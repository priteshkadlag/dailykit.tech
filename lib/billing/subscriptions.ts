import "server-only";
import { addMonths, addYears } from "date-fns";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type BillingInterval, type PlanId } from "./plans";

export interface PlanStatus {
  plan: PlanId;
  periodEnd: Date | null;
  interval: string | null;
}

const activeWhere = (userId: string) => ({ userId, status: "ACTIVE" as const, currentPeriodEnd: { gt: new Date() } });

/** The user's plan right now: Pro while any active subscription period hasn't ended. */
export async function currentPlan(userId: string): Promise<PlanStatus> {
  const sub = await prisma.subscription.findFirst({
    where: activeWhere(userId),
    orderBy: { currentPeriodEnd: "desc" },
    select: { plan: true, currentPeriodEnd: true, interval: true },
  });
  return sub ? { plan: sub.plan, periodEnd: sub.currentPeriodEnd, interval: sub.interval } : { plan: "FREE", periodEnd: null, interval: null };
}

export async function limitsFor(userId: string) {
  return PLAN_LIMITS[(await currentPlan(userId)).plan];
}

export function addInterval(from: Date, interval: BillingInterval) {
  return interval === "yearly" ? addYears(from, 1) : addMonths(from, 1);
}

/**
 * Start or extend Pro. Used by admins today (provider "manual") and by payment webhooks later.
 * A new period starts where any remaining paid time ends, so extending never loses days.
 */
export async function activateSubscription(input: {
  userId: string;
  interval: BillingInterval;
  provider: string;
  providerRef?: string;
  payment?: { amountPaise: number; providerRef: string };
}) {
  return prisma.$transaction(async (tx) => {
    const latest = await tx.subscription.findFirst({
      where: activeWhere(input.userId),
      orderBy: { currentPeriodEnd: "desc" },
      select: { currentPeriodEnd: true },
    });
    const subscription = await tx.subscription.create({
      data: {
        userId: input.userId,
        plan: "PRO",
        interval: input.interval,
        provider: input.provider,
        providerRef: input.providerRef,
        currentPeriodEnd: addInterval(latest?.currentPeriodEnd ?? new Date(), input.interval),
      },
    });
    if (input.payment) {
      await tx.payment.create({
        data: {
          userId: input.userId,
          subscriptionId: subscription.id,
          amount: input.payment.amountPaise,
          status: "captured",
          provider: input.provider,
          providerRef: input.payment.providerRef,
        },
      });
    }
    return subscription;
  });
}

/** End Pro now — the user drops back to Free. */
export async function cancelSubscriptions(userId: string) {
  const now = new Date();
  await prisma.subscription.updateMany({
    where: { userId, status: "ACTIVE" },
    data: { status: "CANCELLED", cancelledAt: now, currentPeriodEnd: now },
  });
}
