import type { Metadata } from "next";
import { format } from "date-fns";
import { requireAdmin } from "@/lib/auth/session";
import { getPaymentProvider } from "@/lib/billing/provider";
import { formatINR } from "@/lib/format";
import { getSubscriptions } from "@/lib/server/admin";
import { Panel, StatCard } from "@/components/dashboard/panels";

export const metadata: Metadata = { title: "Subscriptions & revenue" };

const th = "px-4 py-2.5 font-medium";
const td = "px-4 py-2.5";

export default async function AdminSubscriptionsPage() {
  await requireAdmin();
  const { subscriptions, payments, activeCount, manualCount, mrr } = await getSubscriptions();
  const revenue = payments.filter((p) => p.status === "captured").reduce((s, p) => s + p.amount, 0);
  const gateway = getPaymentProvider();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Subscriptions & revenue</h1>

      {!gateway && (
        <p className="rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground">
          No payment gateway is connected yet. Give Pro from <a href="/admin/users" className="font-medium underline">Users</a> (recorded as &quot;manual&quot;). Once Razorpay
          or Stripe is added in <code className="text-xs">lib/billing/provider.ts</code>, paid subscriptions and payments appear here automatically.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Active Pro users" value={String(activeCount)} caption={manualCount ? `${manualCount} granted manually` : undefined} />
        <StatCard label="Monthly recurring revenue" value={formatINR(mrr, { whole: true })} caption="paid subscriptions" />
        <StatCard label="Revenue (last 100 payments)" value={formatINR(revenue / 100, { whole: true })} />
        <StatCard label="Payments recorded" value={String(payments.length)} />
      </div>

      <Panel title="Subscriptions">
        {subscriptions.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">No subscriptions yet.</p>
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead className="border-b text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className={th}>User</th>
                  <th scope="col" className={th}>Billing</th>
                  <th scope="col" className={th}>Source</th>
                  <th scope="col" className={th}>Status</th>
                  <th scope="col" className={th}>Started</th>
                  <th scope="col" className={th}>Ends</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {subscriptions.map((s) => {
                  const live = s.status === "ACTIVE" && s.currentPeriodEnd > new Date();
                  return (
                    <tr key={s.id}>
                      <td className={`${td} max-w-60 truncate`}>{s.user.email}</td>
                      <td className={`${td} capitalize`}>{s.interval}</td>
                      <td className={`${td} capitalize`}>{s.provider}</td>
                      <td className={td}>
                        <span className={live ? "font-medium text-emerald-700" : "text-muted-foreground"}>{live ? "Active" : s.status === "CANCELLED" ? "Cancelled" : "Ended"}</span>
                      </td>
                      <td className={`${td} whitespace-nowrap`}>{format(s.createdAt, "d MMM yyyy")}</td>
                      <td className={`${td} whitespace-nowrap`}>{format(s.currentPeriodEnd, "d MMM yyyy")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Payments">
        {payments.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">No payments yet. They&apos;ll appear here once a payment gateway is connected.</p>
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[32rem] text-sm">
              <thead className="border-b text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className={th}>Date</th>
                  <th scope="col" className={th}>User</th>
                  <th scope="col" className={`${th} text-right`}>Amount</th>
                  <th scope="col" className={th}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className={`${td} whitespace-nowrap`}>{format(p.createdAt, "d MMM yyyy")}</td>
                    <td className={`${td} max-w-60 truncate`}>{p.user.email}</td>
                    <td className={`${td} text-right tabular-nums`}>{formatINR(p.amount / 100)}</td>
                    <td className={`${td} capitalize`}>{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
