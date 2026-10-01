import type { Metadata } from "next";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Building2, FilePlus2, FileText, ListTodo, Receipt, Sparkles, Star, Wallet } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { planLabel } from "@/lib/billing/plans";
import { STATUS_LABEL, type DocStatus } from "@/lib/documents/types";
import { CATEGORY_LABEL, type ExpenseCategory } from "@/lib/expenses/model";
import { formatINR } from "@/lib/format";
import { getDashboardData, type DashboardData } from "@/lib/server/dashboard";
import { getToolOrNull } from "@/lib/tools";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { CalculationsPanel } from "@/components/dashboard/calculations-panel";
import { DeviceImport } from "@/components/dashboard/device-import";
import { Panel, PanelEmpty, StatCard, UsageMeter } from "@/components/dashboard/panels";
import { TasksPanel } from "@/components/dashboard/tasks-panel";
import { ToolCard } from "@/components/shared/tool-card";

export const metadata: Metadata = { title: "My Dashboard" };

const quickActions = [
  { href: "/invoice-generator", label: "New invoice", icon: FilePlus2 },
  { href: "/quotation-generator", label: "New quotation", icon: FileText },
  { href: "/expense-tracker", label: "Add expense", icon: Wallet },
  { href: "/task-manager", label: "Add task", icon: ListTodo },
];

const shortDate = (iso: string) => (iso ? format(parseISO(iso), "d MMM yyyy") : "—");

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const data = await getDashboardData(user.id);
  const firstName = user.name?.split(" ")[0];
  const overdueInvoices = data.invoices.recent.filter((d) => d.status !== "paid" && d.dueDate && d.dueDate < data.today).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{firstName ? `Namaste, ${firstName}` : "My Dashboard"}</h1>
          <p className="text-sm text-muted-foreground">
            {planLabel(data.plan)} plan
            {data.planPeriodEnd && ` · renews or ends ${format(data.planPeriodEnd, "d MMM yyyy")}`}
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          {quickActions.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={cn(buttonVariants({ variant: "outline" }), "h-10 px-3")}>
              <Icon /> {label}
            </Link>
          ))}
        </div>
      </div>

      <DeviceImport />

      {!data.profile?.businessName && (
        <div className="flex flex-col gap-3 rounded-xl bg-accent p-4 text-accent-foreground sm:flex-row sm:items-center">
          <Building2 className="size-5 shrink-0" aria-hidden />
          <p className="flex-1 text-sm">
            <strong>Set up your business profile</strong> — your name, logo, GSTIN, bank and UPI details will fill in every new invoice and quotation automatically.
          </p>
          <Link href="/dashboard/business-profile" className={cn(buttonVariants(), "h-10")}>
            Set up profile
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Invoiced this month" value={formatINR(data.invoices.monthTotal, { whole: true })} caption={`${data.invoices.monthCount} invoice${data.invoices.monthCount === 1 ? "" : "s"}`} />
        <StatCard
          label="Awaiting payment"
          value={formatINR(data.invoices.unpaidTotal, { whole: true })}
          caption={`${data.invoices.unpaidCount} unpaid${overdueInvoices ? ` · ${overdueInvoices} overdue` : ""}`}
          tone={overdueInvoices ? "warning" : "default"}
        />
        <StatCard label="Expenses this month" value={formatINR(data.expenses.monthTotal, { whole: true })} caption={`${data.expenses.monthCount} entr${data.expenses.monthCount === 1 ? "y" : "ies"}`} />
        <StatCard label="Quotations saved" value={String(data.quotations.count)} caption={`${data.tasks.length} open task${data.tasks.length === 1 ? "" : "s"}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DocumentsPanel title="Saved invoices" href="/invoice-generator" docs={data.invoices.recent} today={data.today} empty="No invoices saved yet." newLabel="Create an invoice" />
        <DocumentsPanel title="Saved quotations" href="/quotation-generator" docs={data.quotations.recent} today={data.today} empty="No quotations saved yet." newLabel="Create a quotation" />
        <TasksPanel tasks={data.tasks} />
        <ExpensesPanel expenses={data.expenses.recent} />
        <CalculationsPanel calculations={data.calculations} />
        <PlanPanel data={data} />
      </div>

      <section aria-labelledby="favorites-heading" className="space-y-3">
        <h2 id="favorites-heading" className="flex items-center gap-2 text-lg font-semibold">
          <Star className="size-5 text-amber-500" aria-hidden /> Favourite tools
        </h2>
        {data.favorites.length === 0 ? (
          <p className="rounded-xl bg-card p-5 text-sm text-muted-foreground ring-1 ring-foreground/10">
            Tap <strong>Add to favourites</strong> at the top of any tool to pin it here. <Link href="/tools" className="font-medium text-primary hover:underline">Browse tools</Link>
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.favorites.map((slug) => {
              const tool = getToolOrNull(slug);
              return tool ? <ToolCard key={slug} tool={tool} /> : null;
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function DocumentsPanel({ title, href, docs, today, empty, newLabel }: { title: string; href: string; docs: DashboardData["invoices"]["recent"]; today: string; empty: string; newLabel: string }) {
  return (
    <Panel title={title} href={href} linkLabel="Open generator">
      {docs.length === 0 ? (
        <PanelEmpty action={<Link href={href} className={cn(buttonVariants({ variant: "outline" }), "h-9")}><Receipt /> {newLabel}</Link>}>{empty}</PanelEmpty>
      ) : (
        <ul className="divide-y">
          {docs.map((d) => {
            const overdue = href === "/invoice-generator" && d.status !== "paid" && d.dueDate && d.dueDate < today;
            return (
              <li key={d.clientId}>
                <Link href={`${href}?doc=${encodeURIComponent(d.clientId)}`} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {d.number} · {d.customerName || "No customer"}
                    </p>
                    <p className="text-xs text-muted-foreground">{shortDate(d.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">{formatINR(d.grandTotal)}</p>
                    <p className={cn("text-xs", overdue ? "font-medium text-destructive" : "text-muted-foreground")}>{overdue ? "Overdue" : (STATUS_LABEL[d.status as DocStatus] ?? d.status)}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function ExpensesPanel({ expenses }: { expenses: DashboardData["expenses"]["recent"] }) {
  return (
    <Panel title="Recent expenses" href="/expense-tracker" linkLabel="Expense tracker">
      {expenses.length === 0 ? (
        <PanelEmpty action={<Link href="/expense-tracker" className={cn(buttonVariants({ variant: "outline" }), "h-9")}>Add an expense</Link>}>No expenses recorded yet.</PanelEmpty>
      ) : (
        <ul className="divide-y">
          {expenses.map((e) => (
            <li key={e.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{e.note || CATEGORY_LABEL[e.category as ExpenseCategory] || e.category}</p>
                <p className="text-xs text-muted-foreground">
                  {CATEGORY_LABEL[e.category as ExpenseCategory] ?? e.category} · {shortDate(e.date)}
                </p>
              </div>
              <p className="text-sm font-semibold tabular-nums">{formatINR(e.amount)}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function PlanPanel({ data }: { data: DashboardData }) {
  return (
    <Panel title={`${planLabel(data.plan)} plan`} href="/pricing" linkLabel={data.plan === "PRO" ? "Plan details" : "Compare plans"}>
      <div className="space-y-4 py-1">
        <UsageMeter label="Invoices saved this month" used={data.usage.invoices} limit={data.limits.invoicesPerMonth} />
        <UsageMeter label="Quotations saved this month" used={data.usage.quotations} limit={data.limits.quotationsPerMonth} />
        {data.plan === "FREE" && (
          <Link href="/pricing" className={cn(buttonVariants(), "h-10 w-full")}>
            <Sparkles /> Go Pro for unlimited documents
          </Link>
        )}
      </div>
    </Panel>
  );
}
