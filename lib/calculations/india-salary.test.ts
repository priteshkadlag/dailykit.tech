import { describe, expect, it } from "vitest";
import { calculateGratuity, calculateHra, calculateIncomeTax, projectEpf, surchargeRate, type TaxInput } from "@/lib/calculations/india-salary";
import { calculateSip, projectMutualFund } from "@/lib/calculations/investment";

const base: TaxInput = { salary: 0, otherIncome: 0, age: "below60", section80C: 0, section80D: 0, homeLoanInterest: 0, nps80ccd1b: 0, hraExemption: 0, professionalTax: 0, otherDeductions: 0, employerNps: 0 };
const tax = (salary: number, regime: "new" | "old", extra: Partial<TaxInput> = {}) => calculateIncomeTax({ ...base, salary, ...extra }, regime);

describe("income tax — new regime", () => {
  it("is zero for salaries up to ₹12.75 lakh (₹75k standard deduction + 87A rebate)", () => {
    expect(tax(1_275_000, "new").totalTax).toBe(0);
    expect(tax(1_275_000, "new").taxableIncome).toBe(1_200_000);
  });
  it("applies marginal relief just above ₹12 lakh taxable", () => {
    // Taxable 12,10,000: slab tax 61,500 but capped at the 10,000 above 12 lakh, plus 4% cess.
    expect(tax(1_285_000, "new").totalTax).toBe(10_400);
  });
  it("matches the slab tax at ₹20 lakh", () => {
    // Taxable 19,25,000 → 20k + 40k + 60k + 65k = 1,85,000 + 4% cess = 1,92,400.
    expect(tax(2_000_000, "new").totalTax).toBe(192_400);
  });
  it("ignores old-regime deductions", () => {
    expect(tax(2_000_000, "new", { section80C: 150_000 }).totalTax).toBe(192_400);
  });
});

describe("income tax — old regime", () => {
  it("gives the full 87A rebate up to ₹5 lakh taxable", () => {
    expect(tax(550_000, "old").totalTax).toBe(0);
  });
  it("applies slabs and caps 80C", () => {
    // 10,00,000 − 50k SD − 1.5L 80C = 8,00,000 → 12,500 + 60,000 = 72,500 + cess = 75,400.
    expect(tax(1_000_000, "old", { section80C: 300_000 }).totalTax).toBe(75_400);
  });
  it("uses a higher exemption for senior citizens", () => {
    expect(tax(1_050_000, "old", { age: "60to80" }).totalTax).toBeLessThan(tax(1_050_000, "old").totalTax);
  });
});

describe("surcharge", () => {
  it("has the right bands and caps the new regime at 25%", () => {
    expect(surchargeRate(5_000_000, "new")).toBe(0);
    expect(surchargeRate(6_000_000, "old")).toBe(10);
    expect(surchargeRate(60_000_000, "old")).toBe(37);
    expect(surchargeRate(60_000_000, "new")).toBe(25);
  });
  it("applies marginal relief just above ₹50 lakh", () => {
    const at = tax(5_075_000, "new"); // taxable exactly 50 lakh
    const above = tax(5_085_000, "new"); // 10,000 more
    expect(above.marginalRelief).toBeGreaterThan(0);
    expect(above.totalTax - at.totalTax).toBeLessThanOrEqual(10_400 + 10);
  });
});

describe("HRA", () => {
  it("takes the least of the three limits", () => {
    const r = calculateHra({ basic: 600_000, da: 0, commission: 0, hraReceived: 300_000, rentPaid: 240_000, metro: true });
    expect(r.exempt).toBe(180_000); // rent − 10% of salary
    expect(r.taxable).toBe(120_000);
    expect(calculateHra({ basic: 600_000, da: 0, commission: 0, hraReceived: 300_000, rentPaid: 600_000, metro: false }).exempt).toBe(240_000);
  });
});

describe("gratuity", () => {
  it("uses 15/26 and rounds more than six months up", () => {
    expect(calculateGratuity({ monthlyWage: 52_000, years: 10, months: 7, employer: "covered" }).gratuity).toBe(330_000);
    expect(calculateGratuity({ monthlyWage: 52_000, years: 10, months: 6, employer: "covered" }).serviceYears).toBe(10);
  });
  it("uses half a month per completed year when not covered by the Act", () => {
    expect(calculateGratuity({ monthlyWage: 60_000, years: 10, months: 11, employer: "not-covered" }).gratuity).toBe(300_000);
  });
  it("caps the tax-free part at ₹20 lakh except for government employees", () => {
    expect(calculateGratuity({ monthlyWage: 300_000, years: 30, months: 0, employer: "covered" }).taxable).toBeGreaterThan(0);
    expect(calculateGratuity({ monthlyWage: 300_000, years: 30, months: 0, employer: "government" }).taxable).toBe(0);
  });
});

describe("EPF", () => {
  it("splits the employer share and caps EPS at ₹1,250 a month", () => {
    const r = projectEpf({ monthlyWage: 50_000, age: 57, retirementAge: 58, currentBalance: 0, annualIncrease: 0, interestRate: 0, employeeRate: 12 });
    expect(r.totalEmployee).toBe(72_000);
    expect(r.totalEps).toBeCloseTo(14_994, 0); // 15,000 × 8.33% × 12
    expect(r.totalEmployer).toBeCloseTo(72_000 - 14_994, 0);
    expect(r.balance).toBeCloseTo(r.totalEmployee + r.totalEmployer, 6);
  });
  it("adds interest", () => {
    const r = projectEpf({ monthlyWage: 30_000, age: 30, retirementAge: 58, currentBalance: 100_000, annualIncrease: 5, interestRate: 8.25, employeeRate: 12 });
    expect(r.schedule).toHaveLength(28);
    expect(r.balance).toBeGreaterThan(100_000 + r.totalEmployee + r.totalEmployer);
  });
});

describe("mutual fund projection", () => {
  it("matches the SIP formula", () => {
    expect(projectMutualFund({ mode: "sip", amount: 5000, annualRate: 12, years: 10 }).maturity).toBeCloseTo(calculateSip(5000, 12, 10).maturity, 4);
  });
  it("grows a lump sum monthly", () => {
    expect(projectMutualFund({ mode: "lumpsum", amount: 100_000, annualRate: 12, years: 1 }).maturity).toBeCloseTo(100_000 * 1.01 ** 12, 4);
  });
  it("steps up the SIP each year and discounts for inflation", () => {
    const r = projectMutualFund({ mode: "step-up", amount: 10_000, annualRate: 0, years: 2, stepUp: 10, inflation: 5 });
    expect(r.invested).toBe(120_000 + 132_000);
    expect(r.realValue).toBeCloseTo(252_000 / 1.05 ** 2, 4);
  });
});
