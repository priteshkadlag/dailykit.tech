import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { formatINR } from "@/lib/format";
import { getAdminOverview } from "@/lib/server/admin";
import { getToolOrNull } from "@/lib/tools";
import { Panel, StatCard } from "@/components/dashboard/panels";
import { DailyChartLoader } from "@/components/admin/daily-chart-loader";

export const metadata: Metadata = { title: "Overview" };

export default async function AdminOverviewPage() {
  await requireAdmin();
  const o = await getAdminOverview();
  const maxOpens = Math.max(1, ...o.topTools.map((t) => t.opens));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Overview</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total users" value={o.totalUsers.toLocaleString("en-IN")} caption={`+${o.newUsers30} in 30 days`} />
        <StatCard label="Total tool usage" value={o.toolOpensAll.toLocaleString("en-IN")} caption={`${o.toolOpens30.toLocaleString("en-IN")} opens in 30 days`} />
        <StatCard label="Daily active" value={o.visitorsToday.toLocaleString("en-IN")} caption={`visitors today · ${o.activeUsersToday} signed in`} />
        <StatCard label="Monthly active" value={o.visitors30.toLocaleString("en-IN")} caption={`visitors in 30 days · ${o.activeUsers30} signed in`} />
        <StatCard label="Pro subscribers" value={o.proUsers.toLocaleString("en-IN")} caption={o.totalUsers ? `${((o.proUsers / o.totalUsers) * 100).toFixed(1)}% of users` : undefined} />
        <StatCard label="Revenue (30 days)" value={formatINR(o.revenue30Paise / 100, { whole: true })} caption={`${formatINR(o.revenueAllPaise / 100, { whole: true })} all time`} />
      </div>

      <Panel title="Last 30 days">
        <div className="py-2">
          <DailyChartLoader data={o.daily} />
        </div>
      </Panel>

      <Panel title="Most used tools (30 days)" href="/admin/tools" linkLabel="All tools">
        {o.topTools.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">No tool usage recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <caption className="sr-only">Tool opens in the last 30 days</caption>
            <thead className="sr-only">
              <tr>
                <th>Tool</th>
                <th>Opens</th>
              </tr>
            </thead>
            <tbody>
              {o.topTools.map((t) => (
                <tr key={t.slug}>
                  <th scope="row" className="w-44 py-1.5 pr-3 text-left font-medium sm:w-56">
                    {getToolOrNull(t.slug)?.name ?? t.slug}
                  </th>
                  <td className="py-1.5">
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-[var(--chart-1)]" style={{ width: `${(t.opens / maxOpens) * 100}%` }} />
                      </div>
                      <span className="w-14 text-right tabular-nums">{t.opens.toLocaleString("en-IN")}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
      <p className="text-xs text-muted-foreground">
        Visitors are counted by an anonymous per-browser ID (no personal data). Browsers with Do Not Track or Global Privacy Control, and users who opted out, aren&apos;t
        counted. Dates are in IST.
      </p>
    </div>
  );
}
