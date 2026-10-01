import { describe, expect, it } from "vitest";
import { calculateFha, calculateRefinance, calculateRentVsBuy, monthlyMortgagePayment } from "./mortgage";

describe("mortgage calculations", () => {
  it("calculates a standard amortizing payment", () => expect(monthlyMortgagePayment(300000, 6, 30)).toBeCloseTo(1798.65, 2));
  it("calculates refinance savings and break-even", () => {
    const result = calculateRefinance({ balance: 300000, currentRate: 7, remainingYears: 25, newRate: 6, newYears: 25, closingCosts: 6000 });
    expect(result.monthlySavings).toBeCloseTo(187.43, 2);
    expect(result.breakEvenMonths).toBe(33);
  });
  it("includes FHA upfront and annual MIP", () => {
    const result = calculateFha({ homePrice: 300000, downPercent: 3.5, annualRate: 6, years: 30, propertyTaxAnnual: 3600, insuranceAnnual: 1800, hoaMonthly: 0, upfrontMipPercent: 1.75, annualMipPercent: 0.55 });
    expect(result.baseLoan).toBe(289500);
    expect(result.upfrontMip).toBe(5066.25);
    expect(result.monthlyMip).toBeCloseTo(132.69, 2);
  });
  it("returns a finite rent-versus-buy comparison", () => {
    const result = calculateRentVsBuy({ homePrice: 400000, downPercent: 20, mortgageRate: 6, mortgageYears: 30, yearsToCompare: 7, buyingCostsPercent: 3, sellingCostsPercent: 6, propertyTaxPercent: 1.2, maintenancePercent: 1, appreciationPercent: 3, monthlyRent: 2200, rentInflationPercent: 3 });
    expect(result.buyNetCost).toBeGreaterThan(0);
    expect(result.rentNetCost).toBeGreaterThan(0);
  });
});
