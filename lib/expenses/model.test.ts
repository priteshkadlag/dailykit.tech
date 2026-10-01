import { describe, expect, it } from "vitest";
import { dailyTotals, expensesToCsv, filterExpenses, monthlyTotals, periodRange, summarize, totalsByCategory, type Expense } from "./model";

const today = new Date(2026, 8, 30); // Wed 30 Sep 2026

const e = (date: string, amount: number, category: Expense["category"] = "food", method: Expense["method"] = "upi", note = ""): Expense => ({
  id: `${date}-${amount}`,
  date,
  amount,
  category,
  method,
  note,
  createdAt: `${date}T10:00:00Z`,
});

const data = [
  e("2026-09-30", 120.5),
  e("2026-09-28", 1000, "office", "bank"), // Monday of this week
  e("2026-09-27", 50, "travel", "cash"), // Sunday — previous week
  e("2026-09-01", 300, "bills"),
  e("2026-08-15", 2000, "salary", "bank", "Helper salary"),
];

describe("Expense periods", () => {
  it("uses Monday-start weeks and calendar months", () => {
    expect(periodRange("week", today)).toEqual({ from: "2026-09-28", to: "2026-10-04" });
    expect(periodRange("month", today)).toEqual({ from: "2026-09-01", to: "2026-09-30" });
    expect(periodRange("last30", today)).toEqual({ from: "2026-09-01", to: "2026-09-30" });
  });

  it("summarises today, week, month and total", () => {
    expect(summarize(data, today)).toEqual({ today: 120.5, week: 1120.5, month: 1470.5, total: 3470.5 });
  });

  it("filters by period, category, method and search", () => {
    const base = { period: "all" as const, category: "all" as const, method: "all" as const, query: "" };
    expect(filterExpenses(data, { ...base, period: "month" }, today)).toHaveLength(4);
    expect(filterExpenses(data, { ...base, method: "bank" }, today)).toHaveLength(2);
    expect(filterExpenses(data, { ...base, query: "helper" }, today)).toHaveLength(1);
    expect(filterExpenses(data, { ...base, period: "custom", from: "2026-09-27", to: "2026-09-28" }, today)).toHaveLength(2);
  });
});

describe("Expense charts", () => {
  it("totals by category, largest first", () => {
    expect(totalsByCategory(data).map((c) => c.category)).toEqual(["salary", "office", "bills", "food", "travel"]);
  });

  it("fills empty days and months with zero", () => {
    const daily = dailyTotals(data, today, 30);
    expect(daily).toHaveLength(30);
    expect(daily.at(-1)).toMatchObject({ key: "2026-09-30", amount: 120.5 });
    expect(daily.find((d) => d.key === "2026-09-29")?.amount).toBe(0);
    const monthly = monthlyTotals(data, today, 12);
    expect(monthly).toHaveLength(12);
    expect(monthly.at(-1)).toMatchObject({ key: "2026-09", amount: 1470.5 });
    expect(monthly.at(-2)).toMatchObject({ key: "2026-08", amount: 2000 });
  });
});

describe("CSV export", () => {
  it("escapes quotes, commas and formula injection", () => {
    const csv = expensesToCsv([e("2026-09-01", 10, "other", "cash", 'Tea, "special"'), e("2026-09-02", 5, "other", "cash", "=HYPERLINK(1)")]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("Date,Category,Payment method,Amount (INR),Note");
    expect(lines[1]).toBe('2026-09-01,Other,Cash,10.00,"Tea, ""special"""');
    expect(lines[2]).toBe("2026-09-02,Other,Cash,5.00,'=HYPERLINK(1)");
  });
});
