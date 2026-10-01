"use client";

import { useState } from "react";
import { z } from "zod";
import { calculateFreelanceRate, calculateSalaryHourly } from "@/lib/calculations/earnings";
import { formatINR, formatNumber } from "@/lib/format";
import { numberString, validateInputs } from "@/lib/validation/fields";
import { NumberField } from "@/components/shared/form-fields";
import { CopyButton, ResetButton } from "@/components/shared/result-actions";
import { CalculatorLayout, EmptyResult, InputCard, ResultCard, ResultRows } from "@/components/shared/result-card";

const salarySchema = z.object({
  annualSalary: numberString({ min: 1, max: 1e10 }),
  hoursPerWeek: numberString({ min: 1, max: 168 }),
  workingWeeks: numberString({ min: 1, max: 52 }),
  deductionPercent: numberString({ min: 0, max: 95 }),
});
const SALARY_DEFAULTS = { annualSalary: "", hoursPerWeek: "40", workingWeeks: "50", deductionPercent: "20" };

export function SalaryHourlyCalculator() {
  const [values, setValues] = useState(SALARY_DEFAULTS);
  const validation = validateInputs(salarySchema, values);
  const result = validation.ok ? calculateSalaryHourly(validation.data) : null;
  const set = (key: keyof typeof values) => (value: string) => setValues((current) => ({ ...current, [key]: value }));
  const summary = result ? `Gross hourly wage: ${formatINR(result.grossHourly)}. Estimated take-home hourly wage: ${formatINR(result.takeHomeHourly)}.` : "";

  return <CalculatorLayout inputs={<InputCard>
    <NumberField label="Annual gross salary" prefix="₹" value={values.annualSalary} onChange={set("annualSalary")} error={validation.errors.annualSalary} />
    <div className="grid gap-4 sm:grid-cols-2"><NumberField label="Paid hours per week" suffix="hours" value={values.hoursPerWeek} onChange={set("hoursPerWeek")} error={validation.errors.hoursPerWeek} /><NumberField label="Working weeks per year" suffix="weeks" value={values.workingWeeks} onChange={set("workingWeeks")} error={validation.errors.workingWeeks} /></div>
    <NumberField label="Estimated deductions" suffix="%" hint="Combined estimate for tax and payroll deductions." value={values.deductionPercent} onChange={set("deductionPercent")} error={validation.errors.deductionPercent} />
  </InputCard>} result={result ? <ResultCard highlightLabel="Gross hourly wage" highlightValue={formatINR(result.grossHourly)} highlightCaption={`${formatNumber(result.annualHours)} paid hours per year`} actions={<><CopyButton text={summary} /><ResetButton onReset={() => setValues(SALARY_DEFAULTS)} /></>}><ResultRows rows={[{ label: "Gross monthly salary", value: formatINR(result.grossMonthly) }, { label: "Estimated take-home per year", value: formatINR(result.takeHomeAnnual) }, { label: "Estimated take-home per month", value: formatINR(result.takeHomeMonthly) }, { label: "Estimated take-home per hour", value: formatINR(result.takeHomeHourly), emphasis: true }]} /></ResultCard> : <EmptyResult message="Enter your annual salary to convert it into monthly and hourly pay." />} />;
}

const freelanceSchema = z.object({
  desiredTakeHome: numberString({ min: 1, max: 1e10 }),
  annualExpenses: numberString({ min: 0, max: 1e10 }),
  hoursPerWeek: numberString({ min: 1, max: 100 }),
  workingWeeks: numberString({ min: 1, max: 52 }),
  nonBillablePercent: numberString({ min: 0, max: 95 }),
  taxPercent: numberString({ min: 0, max: 95 }),
  bufferPercent: numberString({ min: 0, max: 95 }),
});
const FREELANCE_DEFAULTS = { desiredTakeHome: "", annualExpenses: "120000", hoursPerWeek: "40", workingWeeks: "48", nonBillablePercent: "40", taxPercent: "20", bufferPercent: "10" };

export function FreelanceRateCalculator() {
  const [values, setValues] = useState(FREELANCE_DEFAULTS);
  const validation = validateInputs(freelanceSchema, values);
  const result = validation.ok ? calculateFreelanceRate(validation.data) : null;
  const set = (key: keyof typeof values) => (value: string) => setValues((current) => ({ ...current, [key]: value }));
  const summary = result ? `Suggested freelance rate: ${formatINR(result.hourlyRate)} per hour or ${formatINR(result.dayRate)} per 8-hour day.` : "";

  return <CalculatorLayout inputs={<InputCard>
    <div className="grid gap-4 sm:grid-cols-2"><NumberField label="Desired annual take-home" prefix="₹" value={values.desiredTakeHome} onChange={set("desiredTakeHome")} error={validation.errors.desiredTakeHome} /><NumberField label="Annual business expenses" prefix="₹" value={values.annualExpenses} onChange={set("annualExpenses")} error={validation.errors.annualExpenses} /></div>
    <div className="grid gap-4 sm:grid-cols-2"><NumberField label="Working hours per week" suffix="hours" value={values.hoursPerWeek} onChange={set("hoursPerWeek")} error={validation.errors.hoursPerWeek} /><NumberField label="Working weeks per year" suffix="weeks" value={values.workingWeeks} onChange={set("workingWeeks")} error={validation.errors.workingWeeks} /></div>
    <div className="grid gap-4 sm:grid-cols-3"><NumberField label="Non-billable time" suffix="%" value={values.nonBillablePercent} onChange={set("nonBillablePercent")} error={validation.errors.nonBillablePercent} /><NumberField label="Estimated tax" suffix="%" value={values.taxPercent} onChange={set("taxPercent")} error={validation.errors.taxPercent} /><NumberField label="Profit / safety buffer" suffix="%" value={values.bufferPercent} onChange={set("bufferPercent")} error={validation.errors.bufferPercent} /></div>
  </InputCard>} result={result ? <ResultCard highlightLabel="Suggested hourly rate" highlightValue={formatINR(result.hourlyRate)} highlightCaption="Starting estimate before market and project adjustments" actions={<><CopyButton text={summary} /><ResetButton onReset={() => setValues(FREELANCE_DEFAULTS)} /></>}><ResultRows rows={[{ label: "8-hour day rate", value: formatINR(result.dayRate), emphasis: true }, { label: "Target annual revenue", value: formatINR(result.targetRevenue) }, { label: "Target monthly revenue", value: formatINR(result.monthlyRevenue) }, { label: "Estimated billable hours per year", value: formatNumber(result.billableHours) }]} /></ResultCard> : <EmptyResult message="Enter your desired annual take-home income to estimate a sustainable freelance rate." />} />;
}
