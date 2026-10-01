import { format } from "date-fns";
import { getSessionUser } from "@/lib/auth/session";
import { toCsv } from "@/lib/files/csv";
import { prisma } from "@/lib/prisma";
import { getToolUsage } from "@/lib/server/admin";
import { getToolOrNull } from "@/lib/tools";

const REPORTS = {
  async users() {
    const now = new Date();
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        name: true,
        email: true,
        role: true,
        createdAt: true,
        lastActiveAt: true,
        subscriptions: { where: { status: "ACTIVE", currentPeriodEnd: { gt: now } }, orderBy: { currentPeriodEnd: "desc" }, take: 1, select: { currentPeriodEnd: true } },
        _count: { select: { invoices: true, quotations: true, expenses: true, tasks: true } },
      },
    });
    return toCsv(
      ["Name", "Email", "Role", "Plan", "Pro until", "Joined", "Last active", "Invoices", "Quotations", "Expenses", "Tasks"],
      users.map((u) => [
        u.name,
        u.email,
        u.role,
        u.subscriptions.length ? "Pro" : "Free",
        u.subscriptions[0] ? format(u.subscriptions[0].currentPeriodEnd, "yyyy-MM-dd") : "",
        format(u.createdAt, "yyyy-MM-dd"),
        u.lastActiveAt ? format(u.lastActiveAt, "yyyy-MM-dd") : "",
        u._count.invoices,
        u._count.quotations,
        u._count.expenses,
        u._count.tasks,
      ]),
    );
  },
  async "tool-usage"() {
    const rows = await getToolUsage();
    return toCsv(
      ["Tool", "Slug", "Event", "Last 7 days", "Last 30 days", "All time"],
      rows.sort((a, b) => a.tool.localeCompare(b.tool) || a.event.localeCompare(b.event)).map((r) => [getToolOrNull(r.tool)?.name ?? r.tool, r.tool, r.event, r.d7, r.d30, r.total]),
    );
  },
  async subscriptions() {
    const subs = await prisma.subscription.findMany({ orderBy: { createdAt: "asc" }, include: { user: { select: { email: true } } } });
    return toCsv(
      ["Email", "Plan", "Billing", "Source", "Status", "Started", "Period end", "Cancelled"],
      subs.map((s) => [
        s.user.email,
        s.plan,
        s.interval,
        s.provider,
        s.status,
        format(s.createdAt, "yyyy-MM-dd"),
        format(s.currentPeriodEnd, "yyyy-MM-dd"),
        s.cancelledAt ? format(s.cancelledAt, "yyyy-MM-dd") : "",
      ]),
    );
  },
};

/** CSV exports for admins. Anyone else gets a plain 404. */
export async function GET(_request: Request, ctx: RouteContext<"/admin/reports/[report]">) {
  const user = await getSessionUser();
  const { report } = await ctx.params;
  if (user?.role !== "ADMIN" || !Object.hasOwn(REPORTS, report)) return new Response("Not found", { status: 404 });

  const csv = await REPORTS[report as keyof typeof REPORTS]();
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${report}-${format(new Date(), "yyyy-MM-dd")}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
