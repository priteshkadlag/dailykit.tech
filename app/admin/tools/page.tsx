import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { ANALYTICS_EVENTS, EVENT_LABEL } from "@/lib/analytics/events";
import { getEventTotals, getToolUsage } from "@/lib/server/admin";
import { tools } from "@/lib/tools";
import { Panel } from "@/components/dashboard/panels";

export const metadata: Metadata = { title: "Tools" };

export default async function AdminToolsPage() {
  await requireAdmin();
  const [usage, totals] = await Promise.all([getToolUsage(), getEventTotals()]);

  const rows = tools
    .map((tool) => {
      const events = usage.filter((u) => u.tool === tool.slug);
      const sum = (event: string, key: "d7" | "d30" | "total") => events.filter((e) => e.event === event).reduce((s, e) => s + e[key], 0);
      const actions30 = events.filter((e) => e.event !== "tool_opened").reduce((s, e) => s + e.d30, 0);
      return { tool, opens7: sum("tool_opened", "d7"), opens30: sum("tool_opened", "d30"), opensAll: sum("tool_opened", "total"), actions30 };
    })
    .sort((a, b) => b.opens30 - a.opens30 || b.opensAll - a.opensAll);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Tools</h1>

      <Panel title="Events in the last 30 days">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 py-2 sm:grid-cols-4">
          {ANALYTICS_EVENTS.map((name) => (
            <div key={name}>
              <dt className="text-xs text-muted-foreground">{EVENT_LABEL[name]}</dt>
              <dd className="text-lg font-semibold tabular-nums">{(totals[name] ?? 0).toLocaleString("en-IN")}</dd>
            </div>
          ))}
        </dl>
      </Panel>

      <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
        <table className="w-full min-w-[40rem] text-sm">
          <caption className="sr-only">Usage by tool</caption>
          <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-medium">Tool</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">Opens · 7 days</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">Opens · 30 days</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">Opens · all time</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">Results & downloads · 30 days</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={r.tool.slug}>
                <th scope="row" className="px-4 py-2.5 text-left font-medium">
                  <a href={`/${r.tool.slug}`} className="hover:text-primary hover:underline">
                    {r.tool.name}
                  </a>
                </th>
                <td className="px-4 py-2.5 text-right tabular-nums">{r.opens7.toLocaleString("en-IN")}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{r.opens30.toLocaleString("en-IN")}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{r.opensAll.toLocaleString("en-IN")}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{r.actions30.toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
