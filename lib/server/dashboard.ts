import "server-only";
import { startOfMonth } from "date-fns";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "@/lib/billing/plans";
import { currentPlan } from "@/lib/billing/subscriptions";
import { REPOS } from "./sync/repos";

/** Users are in India: "today" and "this month" follow IST even when the server runs in UTC. */
export const APP_TIME_ZONE = "Asia/Kolkata";

export function todayInAppZone(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

const docSelect = { clientId: true, number: true, customerName: true, date: true, dueDate: true, grandTotal: true, status: true } as const;

/** Everything the dashboard overview shows — all of it scoped to one user. */
export async function getDashboardData(userId: string) {
  const today = todayInAppZone();
  const monthStart = `${today.slice(0, 7)}-01`;
  const quotaSince = startOfMonth(new Date());

  const [plan, profile, recentInvoices, recentQuotations, invoiceTotals, unpaid, quotationCount, invoicesThisMonth, quotationsThisMonth, monthExpenses, recentExpenses, tasks, calculations, favorites] =
    await Promise.all([
      currentPlan(userId),
      prisma.businessProfile.findUnique({ where: { userId }, select: { businessName: true, gstin: true, upiId: true, logo: true } }),
      prisma.invoice.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 5, select: docSelect }),
      prisma.quotation.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 5, select: docSelect }),
      prisma.invoice.aggregate({ where: { userId, date: { gte: monthStart } }, _sum: { grandTotal: true }, _count: true }),
      prisma.invoice.aggregate({ where: { userId, status: { not: "paid" } }, _sum: { grandTotal: true }, _count: true }),
      prisma.quotation.count({ where: { userId } }),
      prisma.invoice.count({ where: { userId, createdAt: { gte: quotaSince } } }),
      prisma.quotation.count({ where: { userId, createdAt: { gte: quotaSince } } }),
      prisma.expense.aggregate({ where: { userId, date: { gte: monthStart } }, _sum: { amount: true }, _count: true }),
      prisma.expense.findMany({ where: { userId }, orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 5 }),
      REPOS.tasks.list(userId),
      prisma.savedCalculation.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 6 }),
      prisma.favoriteTool.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, select: { toolSlug: true } }),
    ]);

  const toDoc = (d: (typeof recentInvoices)[number]) => ({ ...d, grandTotal: d.grandTotal.toNumber() });

  return {
    today,
    plan: plan.plan,
    planPeriodEnd: plan.periodEnd,
    limits: PLAN_LIMITS[plan.plan],
    usage: { invoices: invoicesThisMonth, quotations: quotationsThisMonth },
    profile,
    invoices: {
      recent: recentInvoices.map(toDoc),
      monthTotal: invoiceTotals._sum.grandTotal?.toNumber() ?? 0,
      monthCount: invoiceTotals._count,
      unpaidTotal: unpaid._sum.grandTotal?.toNumber() ?? 0,
      unpaidCount: unpaid._count,
    },
    quotations: { recent: recentQuotations.map(toDoc), count: quotationCount },
    expenses: {
      monthTotal: monthExpenses._sum.amount?.toNumber() ?? 0,
      monthCount: monthExpenses._count,
      recent: recentExpenses.map((e) => ({ id: e.clientId, amount: e.amount.toNumber(), category: e.category, date: e.date, note: e.note, method: e.method })),
    },
    tasks: tasks.filter((t) => !t.completed),
    calculations: calculations.map((c) => ({ id: c.clientId, toolSlug: c.toolSlug, title: c.title, summary: c.summary, url: c.url, createdAt: c.createdAt.toISOString() })),
    favorites: favorites.map((f) => f.toolSlug),
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
