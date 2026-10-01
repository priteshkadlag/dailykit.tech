import "server-only";
import { subDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { PRICES } from "@/lib/billing/plans";
import { APP_TIME_ZONE, todayInAppZone } from "./dashboard";

/** Start of "today" in IST as a UTC instant — for "active today" counts. */
function startOfAppDay(now = new Date()) {
  return new Date(`${todayInAppZone(now)}T00:00:00+05:30`);
}

export interface DailyPoint {
  day: string;
  visitors: number;
  opens: number;
  signups: number;
}

export async function getAdminOverview() {
  const now = new Date();
  const since30 = subDays(startOfAppDay(now), 29);
  const today = startOfAppDay(now);

  const [
    totalUsers,
    newUsers30,
    proUsers,
    toolOpensAll,
    toolOpens30,
    visitorsToday,
    visitors30,
    activeUsersToday,
    activeUsers30,
    revenueAll,
    revenue30,
    visitorsByDay,
    signupsByDay,
    topTools,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: since30 } } }),
    prisma.subscription.findMany({ where: { status: "ACTIVE", currentPeriodEnd: { gt: now } }, distinct: ["userId"], select: { userId: true } }).then((r) => r.length),
    prisma.analyticsEvent.count({ where: { name: "tool_opened" } }),
    prisma.analyticsEvent.count({ where: { name: "tool_opened", createdAt: { gte: since30 } } }),
    prisma.analyticsEvent.findMany({ where: { createdAt: { gte: today } }, distinct: ["visitorId"], select: { visitorId: true } }).then((r) => r.length),
    prisma.analyticsEvent.findMany({ where: { createdAt: { gte: since30 } }, distinct: ["visitorId"], select: { visitorId: true } }).then((r) => r.length),
    prisma.userActivity.count({ where: { day: { gte: new Date(todayInAppZone(now)) } } }),
    prisma.userActivity.findMany({ where: { day: { gte: new Date(todayInAppZone(subDays(now, 29))) } }, distinct: ["userId"], select: { userId: true } }).then((r) => r.length),
    prisma.payment.aggregate({ where: { status: "captured" }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: "captured", createdAt: { gte: since30 } }, _sum: { amount: true } }),
    prisma.$queryRaw<{ day: string; visitors: bigint; opens: bigint }[]>`
      SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${APP_TIME_ZONE}, 'YYYY-MM-DD') AS day,
             COUNT(DISTINCT "visitorId") AS visitors,
             COUNT(*) FILTER (WHERE "name" = 'tool_opened') AS opens
      FROM "AnalyticsEvent" WHERE "createdAt" >= ${since30}
      GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw<{ day: string; signups: bigint }[]>`
      SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${APP_TIME_ZONE}, 'YYYY-MM-DD') AS day, COUNT(*) AS signups
      FROM "User" WHERE "createdAt" >= ${since30}
      GROUP BY 1 ORDER BY 1`,
    prisma.analyticsEvent.groupBy({
      by: ["toolSlug"],
      where: { name: "tool_opened", createdAt: { gte: since30 }, toolSlug: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { toolSlug: "desc" } },
      take: 10,
    }),
  ]);

  // Fill every day of the window so gaps show as zero instead of disappearing.
  const byDay = new Map(visitorsByDay.map((r) => [r.day, r]));
  const signups = new Map(signupsByDay.map((r) => [r.day, Number(r.signups)]));
  const daily: DailyPoint[] = Array.from({ length: 30 }, (_, i) => {
    const day = todayInAppZone(subDays(now, 29 - i));
    const row = byDay.get(day);
    return { day, visitors: Number(row?.visitors ?? 0), opens: Number(row?.opens ?? 0), signups: signups.get(day) ?? 0 };
  });

  return {
    totalUsers,
    newUsers30,
    proUsers,
    toolOpensAll,
    toolOpens30,
    visitorsToday,
    visitors30,
    activeUsersToday,
    activeUsers30,
    revenueAllPaise: revenueAll._sum.amount ?? 0,
    revenue30Paise: revenue30._sum.amount ?? 0,
    daily,
    topTools: topTools.map((t) => ({ slug: t.toolSlug!, opens: t._count._all })),
  };
}

/** Per-tool usage for the Tools page and the CSV report. */
export async function getToolUsage() {
  const now = new Date();
  const since7 = subDays(now, 7);
  const since30 = subDays(now, 30);
  const rows = await prisma.$queryRaw<{ tool: string; name: string; d7: bigint; d30: bigint; total: bigint }[]>`
    SELECT "toolSlug" AS tool, "name",
           COUNT(*) FILTER (WHERE "createdAt" >= ${since7}) AS d7,
           COUNT(*) FILTER (WHERE "createdAt" >= ${since30}) AS d30,
           COUNT(*) AS total
    FROM "AnalyticsEvent" WHERE "toolSlug" IS NOT NULL
    GROUP BY 1, 2`;
  return rows.map((r) => ({ tool: r.tool, event: r.name, d7: Number(r.d7), d30: Number(r.d30), total: Number(r.total) }));
}

export async function getEventTotals() {
  const since30 = subDays(new Date(), 30);
  const rows = await prisma.analyticsEvent.groupBy({ by: ["name"], where: { createdAt: { gte: since30 } }, _count: { _all: true } });
  return Object.fromEntries(rows.map((r) => [r.name, r._count._all]));
}

export const USERS_PAGE_SIZE = 25;

export async function getUsers({ query, page }: { query: string; page: number }) {
  const where = query
    ? { OR: [{ email: { contains: query, mode: "insensitive" as const } }, { name: { contains: query, mode: "insensitive" as const } }] }
    : {};
  const now = new Date();
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * USERS_PAGE_SIZE,
      take: USERS_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        lastActiveAt: true,
        passwordHash: true,
        accounts: { select: { provider: true } },
        subscriptions: { where: { status: "ACTIVE", currentPeriodEnd: { gt: now } }, orderBy: { currentPeriodEnd: "desc" }, take: 1, select: { currentPeriodEnd: true } },
        _count: { select: { invoices: true, quotations: true, expenses: true, tasks: true } },
      },
    }),
  ]);
  return {
    total,
    users: users.map(({ passwordHash, accounts, subscriptions, ...u }) => ({
      ...u,
      signIn: [passwordHash ? "Email" : null, ...accounts.map((a) => (a.provider === "google" ? "Google" : a.provider))].filter(Boolean).join(" + ") || "—",
      proUntil: subscriptions[0]?.currentPeriodEnd ?? null,
    })),
  };
}

export async function getSubscriptions() {
  const now = new Date();
  const [subscriptions, payments, active] = await Promise.all([
    prisma.subscription.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { user: { select: { email: true, name: true } } } }),
    prisma.payment.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { user: { select: { email: true } } } }),
    prisma.subscription.findMany({ where: { status: "ACTIVE", currentPeriodEnd: { gt: now } }, select: { userId: true, interval: true, provider: true } }),
  ]);
  // Monthly recurring revenue from paid (non-manual) subscriptions, yearly spread over 12 months.
  const paid = active.filter((s) => s.provider !== "manual");
  const mrr = paid.reduce((sum, s) => sum + (s.interval === "yearly" ? PRICES.yearly.amount / 12 : PRICES.monthly.amount), 0);
  return { subscriptions, payments, activeCount: new Set(active.map((s) => s.userId)).size, manualCount: active.length - paid.length, mrr: Math.round(mrr) };
}
