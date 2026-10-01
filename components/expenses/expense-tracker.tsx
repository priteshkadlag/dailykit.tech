"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { FileDown, Pencil, Sheet, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  CATEGORY_LABEL,
  dailyTotals,
  displayDate,
  EXPENSE_CATEGORIES,
  expensesToCsv,
  filterExpenses,
  METHOD_LABEL,
  monthlyTotals,
  PAYMENT_METHODS,
  periodRange,
  sortByDateDesc,
  summarize,
  totalsByCategory,
  type Expense,
  type ExpenseFilter,
  type Period,
} from "@/lib/expenses/model";
import { expensesStore } from "@/lib/expenses/store";
import { showSaveError } from "@/components/shared/save-error";
import { whereSaved } from "@/lib/storage/synced-collection";
import { formatINR } from "@/lib/format";
import { downloadReportPdf, pdfAmount } from "@/lib/pdf/report";
import { newId, useCollection } from "@/lib/storage/local-collection";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DateField, SegmentedControl, SelectField, TextField } from "@/components/shared/form-fields";
import { ExpenseForm } from "./expense-form";

const chartFallback = () => <div className="h-56 animate-pulse rounded-lg bg-muted" />;
const CategoryChart = dynamic(() => import("./expense-charts").then((m) => m.CategoryChart), { ssr: false, loading: chartFallback });
const TimeChart = dynamic(() => import("./expense-charts").then((m) => m.TimeChart), { ssr: false, loading: chartFallback });

const PERIODS: { value: Period; label: string }[] = [
  { value: "month", label: "This month" },
  { value: "week", label: "This week" },
  { value: "today", label: "Today" },
  { value: "last30", label: "Last 30 days" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom range" },
];

export function ExpenseTracker() {
  const expenses = useCollection(expensesStore);
  const [today] = useState(() => new Date());
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);
  const [trend, setTrend] = useState<"daily" | "monthly">("daily");
  const [filter, setFilter] = useState<ExpenseFilter>({ period: "month", category: "all", method: "all", query: "", from: "", to: "" });
  const setFilterKey = <K extends keyof ExpenseFilter>(key: K) => (value: ExpenseFilter[K]) => setFilter((f) => ({ ...f, [key]: value }));

  const stats = useMemo(() => summarize(expenses, today), [expenses, today]);
  const filtered = useMemo(() => sortByDateDesc(filterExpenses(expenses, filter, today)), [expenses, filter, today]);
  const filteredTotal = filtered.reduce((s, e) => s + e.amount, 0);
  const byCategory = useMemo(() => totalsByCategory(filtered), [filtered]);
  // Trend charts ignore the period filter (they have their own window) but respect category/method/search.
  const trendSource = useMemo(() => filterExpenses(expenses, { ...filter, period: "all" }, today), [expenses, filter, today]);
  const trendData = useMemo(
    () => (trend === "daily" ? dailyTotals(trendSource, today, 30) : monthlyTotals(trendSource, today, 12)),
    [trend, trendSource, today],
  );

  const periodLabel = (() => {
    if (filter.period !== "custom") return PERIODS.find((p) => p.value === filter.period)?.label ?? "";
    const { from, to } = periodRange("custom", today, filter);
    return from || to ? `${from ? displayDate(from) : "Start"} – ${to ? displayDate(to) : "Today"}` : "All dates";
  })();

  const grouped = useMemo(() => {
    const groups = new Map<string, Expense[]>();
    for (const e of filtered) groups.set(e.date, [...(groups.get(e.date) ?? []), e]);
    return [...groups.entries()];
  }, [filtered]);

  const submit = async (values: Omit<Expense, "id" | "createdAt">) => {
    try {
      if (editing) {
        await expensesStore.upsert({ ...editing, ...values });
        setEditing(null);
        toast.success("Expense updated.");
      } else {
        await expensesStore.upsert({ ...values, id: newId(), createdAt: new Date().toISOString() });
        toast.success(`${formatINR(values.amount)} added to ${CATEGORY_LABEL[values.category]}.`);
      }
      return true;
    } catch (error) {
      showSaveError(error);
      return false;
    }
  };

  const exportCsv = () => {
    const blob = new Blob(["﻿" + expensesToCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${filter.period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} expense${filtered.length === 1 ? "" : "s"} to CSV.`);
  };

  const exportPdf = () =>
    downloadReportPdf({
      title: "Expense Report",
      fileName: `expense-report-${filter.period}`,
      sections: [
        {
          heading: `Summary — ${periodLabel}`,
          rows: [
            ["Number of expenses", String(filtered.length)],
            ["Total spent", pdfAmount(filteredTotal)],
            ...(filter.category !== "all" ? ([["Category", CATEGORY_LABEL[filter.category]]] as [string, string][]) : []),
            ...(filter.method !== "all" ? ([["Payment method", METHOD_LABEL[filter.method]]] as [string, string][]) : []),
          ],
        },
        { heading: "By category", rows: byCategory.map((c) => [c.label, pdfAmount(c.amount)] as [string, string]) },
      ],
      tables: [
        {
          heading: "Expenses",
          head: ["Date", "Category", "Method", "Note", "Amount"],
          body: [...filtered].reverse().map((e) => [e.date, CATEGORY_LABEL[e.category], METHOD_LABEL[e.method], e.note || "-", pdfAmount(e.amount)]),
        },
      ],
    });

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Your expenses are saved {whereSaved(expensesStore)}.</p>

      {/* Summary tiles */}
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Today", value: stats.today },
          { label: "This week", value: stats.week },
          { label: "This month", value: stats.month },
          { label: "All time", value: stats.total },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <dt className="text-sm text-muted-foreground">{s.label}</dt>
            <dd className="mt-1 text-xl font-bold tracking-tight tabular-nums sm:text-2xl">{formatINR(s.value)}</dd>
          </div>
        ))}
      </dl>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-6 lg:sticky lg:top-32">
          <ExpenseForm key={editing?.id ?? "new"} editing={editing} onSubmit={submit} onCancelEdit={() => setEditing(null)} />
        </div>

        <div className="space-y-6">
          {/* Filters */}
          <section aria-label="Filters" className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <SelectField label="Period" value={filter.period} onChange={setFilterKey("period")} options={PERIODS} />
              <SelectField
                label="Category"
                value={filter.category}
                onChange={setFilterKey("category")}
                options={[{ value: "all", label: "All categories" }, ...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABEL[c] }))]}
              />
              <SelectField
                label="Payment method"
                value={filter.method}
                onChange={setFilterKey("method")}
                options={[{ value: "all", label: "All methods" }, ...PAYMENT_METHODS.map((m) => ({ value: m, label: METHOD_LABEL[m] }))]}
              />
            </div>
            {filter.period === "custom" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <DateField label="From" value={filter.from ?? ""} onChange={setFilterKey("from")} />
                <DateField label="To" value={filter.to ?? ""} onChange={setFilterKey("to")} />
              </div>
            )}
            <TextField label="Search notes" value={filter.query} onChange={setFilterKey("query")} placeholder="e.g. petrol" />
          </section>

          {/* Charts */}
          {expenses.length > 0 && (
            <section aria-labelledby="charts-heading" className="space-y-6 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
              <h2 id="charts-heading" className="sr-only">
                Charts
              </h2>
              <figure className="space-y-3">
                <figcaption className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold">Spending by category</span>
                  <span className="text-sm text-muted-foreground">{periodLabel}</span>
                </figcaption>
                {byCategory.length > 0 ? <CategoryChart data={byCategory} /> : <p className="py-6 text-center text-sm text-muted-foreground">No expenses in this period.</p>}
              </figure>
              <figure className="space-y-3 border-t pt-6">
                <figcaption className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{trend === "daily" ? "Daily spending — last 30 days" : "Monthly spending — last 12 months"}</span>
                  <SegmentedControl
                    label="Trend"
                    hideLabel
                    value={trend}
                    onChange={setTrend}
                    options={[
                      { value: "daily", label: "Daily" },
                      { value: "monthly", label: "Monthly" },
                    ]}
                  />
                </figcaption>
                <TimeChart data={trendData} interval={trend === "daily" ? "preserveStartEnd" : 0} />
              </figure>
            </section>
          )}

          {/* List */}
          <section aria-labelledby="list-heading" className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="list-heading" className="text-lg font-semibold">
                  Expenses
                </h2>
                <p className="text-sm text-muted-foreground">
                  {filtered.length} item{filtered.length === 1 ? "" : "s"} · {formatINR(filteredTotal)} · {periodLabel}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="h-10" onClick={exportCsv} disabled={filtered.length === 0}>
                  <Sheet /> CSV
                </Button>
                <Button
                  variant="outline"
                  className="h-10"
                  disabled={filtered.length === 0}
                  onClick={async () => {
                    try {
                      await exportPdf();
                      toast.success("Expense report downloaded.");
                    } catch {
                      toast.error("Couldn't create the PDF report.");
                    }
                  }}
                >
                  <FileDown /> PDF report
                </Button>
              </div>
            </div>

            {expenses.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed bg-card/50 p-10 text-center">
                <Wallet className="size-8 text-muted-foreground" aria-hidden />
                <p className="font-medium">No expenses yet</p>
                <p className="max-w-xs text-sm text-muted-foreground">Add your first expense to start seeing where your money goes.</p>
              </div>
            ) : filtered.length === 0 ? (
              <p className="rounded-xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">No expenses match these filters.</p>
            ) : (
              <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
                {grouped.map(([date, items]) => (
                  <div key={date}>
                    <div className="flex justify-between bg-muted/60 px-4 py-2 text-xs font-medium text-muted-foreground">
                      <span>{displayDate(date)}</span>
                      <span className="tabular-nums">{formatINR(items.reduce((s, e) => s + e.amount, 0))}</span>
                    </div>
                    <ul className="divide-y">
                      {items.map((e) => (
                        <li key={e.id} className={cn("flex items-center gap-3 px-4 py-3", editing?.id === e.id && "bg-accent/40")}>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{e.note || CATEGORY_LABEL[e.category]}</p>
                            <p className="text-xs text-muted-foreground">
                              {CATEGORY_LABEL[e.category]} · {METHOD_LABEL[e.method]}
                            </p>
                          </div>
                          <span className="font-semibold tabular-nums">{formatINR(e.amount)}</span>
                          <div className="flex">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-10"
                              aria-label={`Edit expense of ${formatINR(e.amount)}`}
                              onClick={() => {
                                setEditing(e);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                            >
                              <Pencil />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-10 text-destructive hover:text-destructive" aria-label={`Delete expense of ${formatINR(e.amount)}`} onClick={() => setDeleting(e)}>
                              <Trash2 />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this expense?"
        description={deleting ? `${formatINR(deleting.amount)} · ${CATEGORY_LABEL[deleting.category]} on ${displayDate(deleting.date)}. This can't be undone.` : ""}
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!deleting) return;
          const target = deleting;
          try {
            await expensesStore.remove(target.id);
          } catch (error) {
            showSaveError(error);
            return;
          }
          if (editing?.id === target.id) setEditing(null);
          toast.success("Expense deleted.");
        }}
      />
    </div>
  );
}
