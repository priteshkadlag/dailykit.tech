import { round2 } from "@/lib/format";

export interface SalaryHourlyInput {
  annualSalary: number;
  hoursPerWeek: number;
  workingWeeks: number;
  deductionPercent: number;
}

export function calculateSalaryHourly(input: SalaryHourlyInput) {
  const annualHours = input.hoursPerWeek * input.workingWeeks;
  const grossHourly = input.annualSalary / annualHours;
  const takeHomeAnnual = input.annualSalary * (1 - input.deductionPercent / 100);
  return {
    annualHours: round2(annualHours),
    grossHourly: round2(grossHourly),
    grossMonthly: round2(input.annualSalary / 12),
    takeHomeAnnual: round2(takeHomeAnnual),
    takeHomeMonthly: round2(takeHomeAnnual / 12),
    takeHomeHourly: round2(takeHomeAnnual / annualHours),
  };
}

export interface FreelanceRateInput {
  desiredTakeHome: number;
  annualExpenses: number;
  hoursPerWeek: number;
  workingWeeks: number;
  nonBillablePercent: number;
  taxPercent: number;
  bufferPercent: number;
}

export function calculateFreelanceRate(input: FreelanceRateInput) {
  const workingHours = input.hoursPerWeek * input.workingWeeks;
  const billableHours = workingHours * (1 - input.nonBillablePercent / 100);
  const preTaxIncomeNeeded = input.desiredTakeHome / (1 - input.taxPercent / 100);
  const baseRevenue = preTaxIncomeNeeded + input.annualExpenses;
  const targetRevenue = baseRevenue / (1 - input.bufferPercent / 100);
  return {
    workingHours: round2(workingHours),
    billableHours: round2(billableHours),
    targetRevenue: round2(targetRevenue),
    hourlyRate: round2(targetRevenue / billableHours),
    dayRate: round2((targetRevenue / billableHours) * 8),
    monthlyRevenue: round2(targetRevenue / 12),
  };
}
