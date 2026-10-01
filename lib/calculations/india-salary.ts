/**
 * Indian salary and tax maths: income tax (old vs new regime), HRA exemption, gratuity and EPF.
 * Rates are for FY 2025-26 and FY 2026-27 (Budget 2026 left slabs, rebate, surcharge and cess unchanged).
 */

export type Regime = "new" | "old";
export type AgeGroup = "below60" | "60to80" | "above80";

interface Slab { upto: number; rate: number }

const NEW_SLABS: Slab[] = [
  { upto: 400_000, rate: 0 }, { upto: 800_000, rate: 5 }, { upto: 1_200_000, rate: 10 }, { upto: 1_600_000, rate: 15 },
  { upto: 2_000_000, rate: 20 }, { upto: 2_400_000, rate: 25 }, { upto: Infinity, rate: 30 },
];
const OLD_EXEMPT: Record<AgeGroup, number> = { below60: 250_000, "60to80": 300_000, above80: 500_000 };
const oldSlabs = (age: AgeGroup): Slab[] => [
  { upto: OLD_EXEMPT[age], rate: 0 },
  ...(OLD_EXEMPT[age] < 500_000 ? [{ upto: 500_000, rate: 5 }] : []),
  { upto: 1_000_000, rate: 20 }, { upto: Infinity, rate: 30 },
];

export const STANDARD_DEDUCTION: Record<Regime, number> = { new: 75_000, old: 50_000 };
export const REBATE: Record<Regime, { limit: number; max: number }> = { new: { limit: 1_200_000, max: 60_000 }, old: { limit: 500_000, max: 12_500 } };
export const DEDUCTION_CAPS = { section80C: 150_000, section80D: 100_000, homeLoanInterest: 200_000, nps80ccd1b: 50_000, professionalTax: 2_500 };

function slabTax(income: number, slabs: Slab[]) {
  let tax = 0;
  let lower = 0;
  const breakdown: { from: number; to: number; rate: number; tax: number }[] = [];
  for (const { upto, rate } of slabs) {
    if (income <= lower) break;
    const portion = Math.min(income, upto) - lower;
    const slabAmount = (portion * rate) / 100;
    breakdown.push({ from: lower, to: Math.min(income, upto), rate, tax: slabAmount });
    tax += slabAmount;
    lower = upto;
  }
  return { tax, breakdown };
}

const SURCHARGE_THRESHOLDS = [50_000_000, 20_000_000, 10_000_000, 5_000_000];

/** 10% above ₹50 lakh, 15% above ₹1 crore, 25% above ₹2 crore, 37% above ₹5 crore (capped at 25% in the new regime). */
export function surchargeRate(income: number, regime: Regime) {
  if (income > 50_000_000) return regime === "new" ? 25 : 37;
  if (income > 20_000_000) return 25;
  if (income > 10_000_000) return 15;
  if (income > 5_000_000) return 10;
  return 0;
}

/** Tax after the 87A rebate (with the new regime’s marginal relief just above ₹12 lakh). */
function taxAfterRebate(income: number, regime: Regime, age: AgeGroup) {
  const { tax } = slabTax(income, regime === "new" ? NEW_SLABS : oldSlabs(age));
  const { limit, max } = REBATE[regime];
  if (income <= limit) return Math.max(0, tax - max);
  return regime === "new" ? Math.min(tax, income - limit) : tax;
}

/** Surcharge with marginal relief: crossing a threshold can’t cost more extra tax than the income above it. */
function taxWithSurcharge(income: number, regime: Regime, age: AgeGroup) {
  const tax = taxAfterRebate(income, regime, age);
  const threshold = SURCHARGE_THRESHOLDS.find((t) => income > t);
  if (threshold === undefined) return { tax, surcharge: 0, marginalRelief: 0 };
  const full = tax * (1 + surchargeRate(income, regime) / 100);
  const atThreshold = taxAfterRebate(threshold, regime, age) * (1 + surchargeRate(threshold, regime) / 100);
  const capped = Math.min(full, atThreshold + (income - threshold));
  return { tax, surcharge: capped - tax, marginalRelief: full - capped };
}

export interface TaxInput {
  salary: number;
  otherIncome: number;
  age: AgeGroup;
  /** Old-regime deductions and exemptions (annual). Amounts above the legal caps are capped. */
  section80C: number;
  section80D: number;
  homeLoanInterest: number;
  nps80ccd1b: number;
  hraExemption: number;
  professionalTax: number;
  otherDeductions: number;
  /** Employer NPS contribution, 80CCD(2) — allowed in both regimes. */
  employerNps: number;
}

export interface TaxResult {
  regime: Regime;
  grossIncome: number;
  deductions: { label: string; amount: number }[];
  totalDeductions: number;
  taxableIncome: number;
  slabs: { from: number; to: number; rate: number; tax: number }[];
  taxBeforeRebate: number;
  rebate: number;
  surcharge: number;
  marginalRelief: number;
  cess: number;
  totalTax: number;
  effectiveRate: number;
  monthlyTax: number;
}

export function calculateIncomeTax(input: TaxInput, regime: Regime): TaxResult {
  const grossIncome = input.salary + input.otherIncome;
  const deductions: { label: string; amount: number }[] = [];
  const add = (label: string, amount: number) => { if (amount > 0) deductions.push({ label, amount }); };
  if (input.salary > 0) add("Standard deduction", Math.min(STANDARD_DEDUCTION[regime], input.salary));
  if (regime === "old") {
    add("HRA exemption", input.hraExemption);
    add("Professional tax", Math.min(input.professionalTax, DEDUCTION_CAPS.professionalTax));
    add("Home loan interest (24b)", Math.min(input.homeLoanInterest, DEDUCTION_CAPS.homeLoanInterest));
    add("Section 80C", Math.min(input.section80C, DEDUCTION_CAPS.section80C));
    add("Section 80D (health insurance)", Math.min(input.section80D, DEDUCTION_CAPS.section80D));
    add("NPS 80CCD(1B)", Math.min(input.nps80ccd1b, DEDUCTION_CAPS.nps80ccd1b));
    add("Other deductions", input.otherDeductions);
  }
  add("Employer NPS 80CCD(2)", input.employerNps);
  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  const taxableIncome = Math.max(0, Math.floor((grossIncome - totalDeductions) / 10) * 10); // Section 288A: round down to ₹10
  const { tax: taxBeforeRebate, breakdown } = slabTax(taxableIncome, regime === "new" ? NEW_SLABS : oldSlabs(input.age));
  const { tax, surcharge, marginalRelief } = taxWithSurcharge(taxableIncome, regime, input.age);
  const cess = ((tax + surcharge) * 4) / 100;
  const totalTax = Math.round((tax + surcharge + cess) / 10) * 10; // Section 288B: round to nearest ₹10
  return {
    regime, grossIncome, deductions, totalDeductions, taxableIncome, slabs: breakdown, taxBeforeRebate,
    rebate: taxBeforeRebate - tax, surcharge, marginalRelief, cess, totalTax,
    effectiveRate: grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0,
    monthlyTax: totalTax / 12,
  };
}

/* ---------- HRA ---------- */

export type HraYear = "2025-26" | "2026-27";
export const HRA_METROS: Record<HraYear, string[]> = {
  "2025-26": ["Delhi", "Mumbai", "Kolkata", "Chennai"],
  "2026-27": ["Delhi", "Mumbai", "Kolkata", "Chennai", "Bengaluru", "Hyderabad", "Pune", "Ahmedabad"],
};

export interface HraInput { basic: number; da: number; commission: number; hraReceived: number; rentPaid: number; metro: boolean }

/** Exempt HRA (annual figures): the least of actual HRA, rent minus 10% of salary, and 50%/40% of salary. */
export function calculateHra({ basic, da, commission, hraReceived, rentPaid, metro }: HraInput) {
  const salary = basic + da + commission;
  const rentExcess = Math.max(0, rentPaid - salary * 0.1);
  const salaryShare = salary * (metro ? 0.5 : 0.4);
  const exempt = Math.max(0, Math.min(hraReceived, rentExcess, salaryShare));
  const limits = [
    { label: "Actual HRA received", amount: hraReceived },
    { label: "Rent paid minus 10% of salary", amount: rentExcess },
    { label: `${metro ? 50 : 40}% of salary (${metro ? "metro" : "non-metro"})`, amount: salaryShare },
  ];
  const binding = limits.reduce((least, limit) => (limit.amount < least.amount ? limit : least));
  return { salary, exempt, taxable: Math.max(0, hraReceived - exempt), limits, binding: binding.label, rentForFullExemption: hraReceived + salary * 0.1 };
}

/* ---------- Gratuity ---------- */

export type GratuityEmployer = "covered" | "not-covered" | "government";
export const GRATUITY_TAX_FREE_LIMIT = 2_000_000;

export interface GratuityInput {
  /** Last drawn monthly basic + dearness allowance. */
  monthlyWage: number;
  years: number;
  months: number;
  employer: GratuityEmployer;
}

export function calculateGratuity({ monthlyWage, years, months, employer }: GratuityInput) {
  // Under the Gratuity Act a part year counts as a full year when it is more than six months.
  const serviceYears = employer === "not-covered" ? years : years + (months > 6 ? 1 : 0);
  const gratuity = employer === "not-covered" ? (monthlyWage * serviceYears) / 2 : (15 * monthlyWage * serviceYears) / 26;
  const taxFree = employer === "government" ? gratuity : Math.min(gratuity, GRATUITY_TAX_FREE_LIMIT);
  return { serviceYears, gratuity, taxFree, taxable: gratuity - taxFree };
}

/* ---------- EPF ---------- */

export const EPS_WAGE_CEILING = 15_000;

export interface EpfInput {
  monthlyWage: number;
  age: number;
  retirementAge: number;
  currentBalance: number;
  annualIncrease: number;
  interestRate: number;
  /** Employee share in percent (12 by default; more is Voluntary PF). */
  employeeRate: number;
}

export interface EpfYear { year: number; age: number; employee: number; employer: number; interest: number; balance: number }

/**
 * Projects the EPF balance. The employer's 12% is split: 8.33% of wages (on at most ₹15,000) goes to the
 * pension scheme (EPS) and the rest to EPF. Interest accrues monthly on the running balance and is credited yearly.
 */
export function projectEpf({ monthlyWage, age, retirementAge, currentBalance, annualIncrease, interestRate, employeeRate }: EpfInput) {
  const years = Math.max(0, Math.round(retirementAge - age));
  let balance = currentBalance;
  let wage = monthlyWage;
  let totalEmployee = 0;
  let totalEmployer = 0;
  let totalInterest = 0;
  let totalEps = 0;
  const schedule: EpfYear[] = [];
  for (let year = 1; year <= years; year++) {
    let employee = 0;
    let employer = 0;
    let interest = 0;
    for (let month = 0; month < 12; month++) {
      const eps = Math.min(wage, EPS_WAGE_CEILING) * 0.0833;
      const employeeShare = (wage * employeeRate) / 100;
      const employerShare = wage * 0.12 - eps;
      employee += employeeShare;
      employer += employerShare;
      totalEps += eps;
      balance += employeeShare + employerShare;
      interest += (balance * interestRate) / 1200;
    }
    balance += interest;
    totalEmployee += employee;
    totalEmployer += employer;
    totalInterest += interest;
    schedule.push({ year, age: age + year, employee, employer, interest, balance });
    wage *= 1 + annualIncrease / 100;
  }
  return { years, balance, totalEmployee, totalEmployer, totalInterest, totalEps, schedule, finalWage: wage };
}
