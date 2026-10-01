/**
 * Plans and what each one includes. This is the single source of truth for the pricing page,
 * limit checks on the server and "upgrade" prompts. Prices are in rupees.
 */
export type PlanId = "FREE" | "PRO";
export type BillingInterval = "monthly" | "yearly";

export interface PlanLimits {
  /** Invoices saved to the account per calendar month (null = unlimited). */
  invoicesPerMonth: number | null;
  quotationsPerMonth: number | null;
  /** Calculations kept in "Recent calculations". */
  savedCalculations: number;
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  FREE: { invoicesPerMonth: 20, quotationsPerMonth: 20, savedCalculations: 50 },
  PRO: { invoicesPerMonth: null, quotationsPerMonth: null, savedCalculations: 1000 },
};

export const PRICES: Record<BillingInterval, { amount: number; label: string; note?: string }> = {
  monthly: { amount: 99, label: "₹99 / month" },
  yearly: { amount: 999, label: "₹999 / year", note: "2 months free" },
};

export const PLAN_FEATURES: Record<PlanId, string[]> = {
  FREE: [
    "Every calculator and tool",
    "PDF and image tools",
    "Invoices and quotations with every template",
    "Business profile that fills in your documents",
    "20 invoices + 20 quotations a month saved to your account",
    "Expenses, tasks and favourite tools synced across devices",
  ],
  PRO: [
    "Everything in Free",
    "Unlimited invoices and quotations in the cloud",
    "Up to 1,000 saved calculations",
    "Priority email support",
    "No ads, ever",
  ],
};

export function planLabel(plan: PlanId) {
  return plan === "PRO" ? "Pro" : "Free";
}
