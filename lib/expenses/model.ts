import { addDays, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek, subDays, subMonths } from "date-fns";
import { z } from "zod";
import { parseDateInput, toDateInputValue } from "@/lib/calculations/age";
import { toCsv } from "@/lib/files/csv";
import { round2 } from "@/lib/format";

export const EXPENSE_CATEGORIES = ["food", "travel", "shopping", "office", "bills", "marketing", "salary", "other"] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  food: "Food",
  travel: "Travel",
  shopping: "Shopping",
  office: "Office",
  bills: "Bills",
  marketing: "Marketing",
  salary: "Salary",
  other: "Other",
};

export const PAYMENT_METHODS = ["cash", "upi", "card", "bank"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const METHOD_LABEL: Record<PaymentMethod, string> = { cash: "Cash", upi: "UPI", card: "Card", bank: "Bank" };

export const expenseSchema = z.object({
  id: z.string(),
  amount: z.number().positive().max(1e10),
  category: z.enum(EXPENSE_CATEGORIES),
  /** yyyy-mm-dd, local calendar date. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  method: z.enum(PAYMENT_METHODS),
  note: z.string().max(300).default(""),
  createdAt: z.string(),
});
export type Expense = z.infer<typeof expenseSchema>;

export type Period = "all" | "today" | "week" | "month" | "last30" | "custom";

export interface ExpenseFilter {
  period: Period;
  from?: string;
  to?: string;
  category: ExpenseCategory | "all";
  method: PaymentMethod | "all";
  query: string;
}

/** Inclusive yyyy-mm-dd bounds for a period relative to `today`. Weeks start on Monday. */
export function periodRange(period: Period, today: Date, custom?: { from?: string; to?: string }): { from?: string; to?: string } {
  const iso = toDateInputValue;
  switch (period) {
    case "today":
      return { from: iso(today), to: iso(today) };
    case "week":
      return { from: iso(startOfWeek(today, { weekStartsOn: 1 })), to: iso(endOfWeek(today, { weekStartsOn: 1 })) };
    case "month":
      return { from: iso(startOfMonth(today)), to: iso(endOfMonth(today)) };
    case "last30":
      return { from: iso(subDays(today, 29)), to: iso(today) };
    case "custom":
      return { from: custom?.from || undefined, to: custom?.to || undefined };
    default:
      return {};
  }
}

export function filterExpenses(expenses: Expense[], filter: ExpenseFilter, today: Date) {
  const { from, to } = periodRange(filter.period, today, filter);
  const q = filter.query.trim().toLowerCase();
  return expenses.filter(
    (e) =>
      (!from || e.date >= from) &&
      (!to || e.date <= to) &&
      (filter.category === "all" || e.category === filter.category) &&
      (filter.method === "all" || e.method === filter.method) &&
      (!q || e.note.toLowerCase().includes(q) || CATEGORY_LABEL[e.category].toLowerCase().includes(q)),
  );
}

const sum = (list: Expense[]) => round2(list.reduce((s, e) => s + e.amount, 0));

export function summarize(expenses: Expense[], today: Date) {
  const within = (period: Period) => {
    const { from, to } = periodRange(period, today);
    return sum(expenses.filter((e) => (!from || e.date >= from) && (!to || e.date <= to)));
  };
  return { today: within("today"), week: within("week"), month: within("month"), total: sum(expenses) };
}

export function totalsByCategory(expenses: Expense[]) {
  return EXPENSE_CATEGORIES.map((category) => ({
    category,
    label: CATEGORY_LABEL[category],
    amount: sum(expenses.filter((e) => e.category === category)),
  }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

/** One entry per day for the last `days` days ending today, including zero days. */
export function dailyTotals(expenses: Expense[], today: Date, days = 30) {
  const start = subDays(today, days - 1);
  const map = new Map<string, number>();
  for (const e of expenses) map.set(e.date, (map.get(e.date) ?? 0) + e.amount);
  return Array.from({ length: days }, (_, i) => {
    const d = addDays(start, i);
    const key = toDateInputValue(d);
    return { key, label: format(d, "d MMM"), amount: round2(map.get(key) ?? 0) };
  });
}

/** One entry per month for the last `months` months ending this month, including zero months. */
export function monthlyTotals(expenses: Expense[], today: Date, months = 12) {
  const map = new Map<string, number>();
  for (const e of expenses) map.set(e.date.slice(0, 7), (map.get(e.date.slice(0, 7)) ?? 0) + e.amount);
  return Array.from({ length: months }, (_, i) => {
    const d = subMonths(startOfMonth(today), months - 1 - i);
    const key = format(d, "yyyy-MM");
    return { key, label: format(d, "MMM yy"), amount: round2(map.get(key) ?? 0) };
  });
}

export function expensesToCsv(expenses: Expense[]) {
  const rows = [...expenses]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => [e.date, CATEGORY_LABEL[e.category], METHOD_LABEL[e.method], e.amount.toFixed(2), e.note]);
  return toCsv(["Date", "Category", "Payment method", "Amount (INR)", "Note"], rows);
}

export function sortByDateDesc(expenses: Expense[]) {
  return [...expenses].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export function displayDate(iso: string) {
  const d = parseDateInput(iso);
  return d ? format(d, "EEE, d MMM yyyy") : iso;
}
