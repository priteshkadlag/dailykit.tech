import { describe, expect, it } from "vitest";
import { calculateFreelanceRate, calculateSalaryHourly } from "./earnings";

describe("salary to hourly conversion", () => {
  it("calculates gross and estimated take-home rates", () => {
    expect(calculateSalaryHourly({ annualSalary: 1_200_000, hoursPerWeek: 40, workingWeeks: 50, deductionPercent: 20 })).toEqual({
      annualHours: 2000,
      grossHourly: 600,
      grossMonthly: 100000,
      takeHomeAnnual: 960000,
      takeHomeMonthly: 80000,
      takeHomeHourly: 480,
    });
  });
});

describe("freelance hourly rate", () => {
  it("accounts for expenses, tax, buffer and non-billable time", () => {
    const result = calculateFreelanceRate({ desiredTakeHome: 600000, annualExpenses: 120000, hoursPerWeek: 40, workingWeeks: 48, nonBillablePercent: 40, taxPercent: 20, bufferPercent: 10 });
    expect(result.billableHours).toBe(1152);
    expect(result.targetRevenue).toBeCloseTo(966666.67, 2);
    expect(result.hourlyRate).toBeCloseTo(839.12, 2);
  });
});
