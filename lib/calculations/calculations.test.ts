import { describe, expect, it } from "vitest";
import { calculateAge, parseDateInput } from "./age";
import { applyDiscount, applyDiscountWithGst, applyMultipleDiscounts } from "./discount";
import { calculateEmi, monthlyEmi } from "./emi";
import { calculateGst } from "./gst";
import { applyPercent, percentChange, percentOf, whatPercent } from "./percentage";

describe("GST", () => {
  it("adds GST exclusive with CGST/SGST split", () => {
    const r = calculateGst({ amount: 1000, rate: 18, mode: "exclusive", supply: "intra" });
    expect(r).toMatchObject({ baseAmount: 1000, gstAmount: 180, totalAmount: 1180, cgst: 90, sgst: 90, igst: 0, cgstRate: 9 });
  });

  it("removes GST from an inclusive amount", () => {
    const r = calculateGst({ amount: 1180, rate: 18, mode: "inclusive", supply: "inter" });
    expect(r).toMatchObject({ baseAmount: 1000, gstAmount: 180, totalAmount: 1180, igst: 180, cgst: 0 });
  });

  it("keeps CGST + SGST equal to total GST when paise are odd", () => {
    const r = calculateGst({ amount: 100.05, rate: 5, mode: "exclusive", supply: "intra" });
    expect(r.gstAmount).toBe(5);
    expect(r.cgst + r.sgst).toBeCloseTo(r.gstAmount, 10);
    const odd = calculateGst({ amount: 10.1, rate: 3, mode: "exclusive", supply: "intra" });
    expect(odd.gstAmount).toBe(0.3);
    expect(odd.cgst + odd.sgst).toBeCloseTo(0.3, 10);
  });

  it("inclusive base + GST always equals the entered amount", () => {
    for (const amount of [99.99, 1, 12345.67, 500]) {
      for (const rate of [0, 5, 12, 18, 28, 40]) {
        const r = calculateGst({ amount, rate, mode: "inclusive", supply: "intra" });
        expect(r.totalAmount).toBeCloseTo(amount, 10);
      }
    }
  });
});

describe("EMI", () => {
  it("matches the standard formula for a ₹10 lakh loan at 10% for 20 years", () => {
    expect(monthlyEmi(1_000_000, 10, 240)).toBeCloseTo(9650.22, 2);
  });

  it("handles 0% interest", () => {
    const r = calculateEmi({ principal: 120000, annualRate: 0, months: 12 });
    expect(r.emi).toBe(10000);
    expect(r.totalInterest).toBe(0);
  });

  it("amortizes to exactly zero with principal summing to the loan", () => {
    const r = calculateEmi({ principal: 500000, annualRate: 8.5, months: 60 });
    expect(r.schedule).toHaveLength(60);
    expect(r.schedule.at(-1)!.balance).toBe(0);
    const principalSum = r.schedule.reduce((s, row) => s + row.principal, 0);
    expect(principalSum).toBeCloseTo(500000, 0);
    const interestSum = r.schedule.reduce((s, row) => s + row.interest, 0);
    expect(interestSum).toBeCloseTo(r.totalInterest, 0);
    expect(r.yearly).toHaveLength(5);
  });
});

describe("Percentage", () => {
  it("computes the four standard questions", () => {
    expect(percentOf(20, 150)).toBe(30);
    expect(whatPercent(30, 150)).toBe(20);
    expect(percentChange(200, 250)).toBe(25);
    expect(percentChange(250, 200)).toBe(-20);
    expect(applyPercent(200, 10)).toBeCloseTo(220);
    expect(applyPercent(200, -10)).toBeCloseTo(180);
    expect(whatPercent(1, 0)).toBeNaN();
  });
});

describe("Discount", () => {
  it("applies a single discount", () => {
    expect(applyDiscount(2499, 20)).toMatchObject({ discountAmount: 499.8, finalPrice: 1999.2 });
  });

  it("stacks successive discounts (20% + 10% = 28%)", () => {
    const r = applyMultipleDiscounts(1000, [20, 10]);
    expect(r.finalPrice).toBe(720);
    expect(r.effectivePercent).toBeCloseTo(28);
    expect(r.steps.map((s) => s.priceAfter)).toEqual([800, 720]);
  });

  it("applies discount before GST (exclusive)", () => {
    const r = applyDiscountWithGst(1000, 10, 18, false);
    expect(r).toMatchObject({ discountAmount: 100, priceAfterDiscount: 900, gstAmount: 162, finalPrice: 1062 });
  });

  it("discounts a GST-inclusive MRP", () => {
    const r = applyDiscountWithGst(1180, 10, 18, true);
    expect(r).toMatchObject({ priceAfterDiscount: 900, gstAmount: 162, finalPrice: 1062, discountAmount: 118 });
  });
});

describe("Age", () => {
  it("computes years, months and days", () => {
    const r = calculateAge(parseDateInput("1990-05-15")!, parseDateInput("2026-09-28")!);
    expect([r.years, r.months, r.days]).toEqual([36, 4, 13]);
    expect(r.totalMonths).toBe(436);
    expect(r.daysToNextBirthday).toBe(229);
    expect(r.turningAge).toBe(37);
  });

  it("detects a birthday today", () => {
    const r = calculateAge(parseDateInput("2000-09-28")!, parseDateInput("2026-09-28")!);
    expect(r.isBirthdayToday).toBe(true);
    expect(r.daysToNextBirthday).toBe(0);
    expect([r.years, r.months, r.days]).toEqual([26, 0, 0]);
  });

  it("handles month-end and leap-day birthdays", () => {
    const r = calculateAge(parseDateInput("2000-01-31")!, parseDateInput("2000-03-01")!);
    expect([r.years, r.months, r.days]).toEqual([0, 1, 1]);
    const leap = calculateAge(parseDateInput("2004-02-29")!, parseDateInput("2026-01-01")!);
    expect(leap.nextBirthday.getMonth()).toBe(1);
    expect(leap.nextBirthday.getDate()).toBe(28);
  });

  it("rejects invalid dates", () => {
    expect(parseDateInput("2023-02-30")).toBeNull();
    expect(parseDateInput("")).toBeNull();
  });
});
