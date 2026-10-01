"use client";

import { useState } from "react";
import { z } from "zod";
import {
  DEDUCTION_CAPS, GRATUITY_TAX_FREE_LIMIT, HRA_METROS, calculateGratuity, calculateHra, calculateIncomeTax, projectEpf,
  type AgeGroup, type GratuityEmployer, type HraYear, type TaxInput, type TaxResult,
} from "@/lib/calculations/india-salary";
import { formatINR, formatNumber, parseNumber } from "@/lib/format";
import { numberString, validateInputs } from "@/lib/validation/fields";
import { cn } from "@/lib/utils";
import { CheckboxField, NumberField, SegmentedControl, SelectField } from "@/components/shared/form-fields";
import { CopyButton, ResetButton, SaveCalculationButton } from "@/components/shared/result-actions";
import { CalculatorLayout, EmptyResult, InputCard, ResultCard, ResultRows } from "@/components/shared/result-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/** Optional amount: blank counts as zero; returns an error message for junk or negatives. */
function optional(value: string): { value: number; error?: string } {
  if (!value.trim()) return { value: 0 };
  const n = parseNumber(value);
  if (!Number.isFinite(n)) return { value: 0, error: "Enter a valid number" };
  if (n < 0) return { value: 0, error: "Can't be negative" };
  return { value: n };
}

const rupees = (n: number) => formatINR(n, { whole: true });

function Note({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warn" }) {
  return <p className={cn("rounded-lg px-3 py-2 text-sm", tone === "warn" ? "bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200" : "bg-muted text-muted-foreground")}>{children}</p>;
}

// ---- Income tax

const AGE_OPTIONS: { value: AgeGroup; label: string }[] = [
  { value: "below60", label: "Below 60" }, { value: "60to80", label: "60 to 79" }, { value: "above80", label: "80 and above" },
];
const TAX_DEFAULTS = { salary: "1500000", otherIncome: "", section80C: "150000", section80D: "25000", homeLoanInterest: "", nps80ccd1b: "", hraExemption: "", professionalTax: "2500", otherDeductions: "", employerNps: "" };
type TaxField = keyof typeof TAX_DEFAULTS;
const OLD_FIELDS: { key: TaxField; label: string; hint?: string }[] = [
  { key: "hraExemption", label: "HRA exemption", hint: "Work it out with the HRA calculator" },
  { key: "section80C", label: "Section 80C", hint: `EPF, PPF, ELSS, life insurance, tuition fees… (max ${rupees(DEDUCTION_CAPS.section80C)})` },
  { key: "section80D", label: "Section 80D — health insurance", hint: "₹25,000 for self/family (₹50,000 if senior) plus parents" },
  { key: "homeLoanInterest", label: "Home loan interest — self-occupied", hint: `Section 24(b), max ${rupees(DEDUCTION_CAPS.homeLoanInterest)}` },
  { key: "nps80ccd1b", label: "Your own NPS contribution — 80CCD(1B)", hint: `Over and above 80C, max ${rupees(DEDUCTION_CAPS.nps80ccd1b)}` },
  { key: "professionalTax", label: "Professional tax", hint: "Max ₹2,500" },
  { key: "otherDeductions", label: "Other deductions", hint: "80E education loan interest, 80G donations, 80TTA savings interest…" },
];

function RegimeColumn({ result, best }: { result: TaxResult; best: boolean }) {
  return (
    <div className={cn("space-y-2 rounded-lg p-3 ring-1", best ? "bg-accent/40 ring-primary/40" : "ring-foreground/10")}>
      <h3 className="flex items-center justify-between gap-2 text-sm font-semibold">
        {result.regime === "new" ? "New regime" : "Old regime"}
        {best && <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">Lower tax</span>}
      </h3>
      <ResultRows rows={[
        { label: "Gross income", value: rupees(result.grossIncome) },
        { label: "Deductions", value: `− ${rupees(result.totalDeductions)}` },
        { label: "Taxable income", value: rupees(result.taxableIncome) },
        { label: "Tax on slabs", value: rupees(result.taxBeforeRebate) },
        ...(result.rebate > 0 ? [{ label: result.rebate === result.taxBeforeRebate ? "Rebate u/s 87A" : "Rebate / marginal relief", value: `− ${rupees(result.rebate)}` }] : []),
        ...(result.surcharge > 0 ? [{ label: "Surcharge", value: rupees(result.surcharge) }] : []),
        { label: "Health & education cess (4%)", value: rupees(result.cess) },
        { label: "Total tax", value: rupees(result.totalTax), emphasis: true },
        { label: "Per month", value: rupees(result.monthlyTax), sub: true },
      ]} />
    </div>
  );
}

export function IncomeTaxCalculator() {
  const [values, setValues] = useState(TAX_DEFAULTS);
  const [age, setAge] = useState<AgeGroup>("below60");
  const set = (key: TaxField) => (value: string) => setValues((v) => ({ ...v, [key]: value }));
  const salary = validateInputs(z.object({ salary: numberString({ min: 0, max: 1e11 }) }), { salary: values.salary });
  const parsed = Object.fromEntries((Object.keys(TAX_DEFAULTS) as TaxField[]).filter((k) => k !== "salary").map((k) => [k, optional(values[k])])) as Record<Exclude<TaxField, "salary">, { value: number; error?: string }>;
  const hasError = Object.values(parsed).some((p) => p.error);
  const input: TaxInput | null = salary.ok && !hasError ? {
    salary: salary.data.salary, age,
    ...(Object.fromEntries(Object.entries(parsed).map(([k, p]) => [k, p.value])) as Omit<TaxInput, "salary" | "age">),
  } : null;
  const results = input ? { new: calculateIncomeTax(input, "new"), old: calculateIncomeTax(input, "old") } : null;
  const better = results ? (results.new.totalTax <= results.old.totalTax ? "new" : "old") : "new";
  const saving = results ? Math.abs(results.new.totalTax - results.old.totalTax) : 0;
  const summary = results ? `Income tax for FY 2026-27 on ${rupees(results.new.grossIncome)}: new regime ${rupees(results.new.totalTax)}, old regime ${rupees(results.old.totalTax)}. The ${better} regime saves ${rupees(saving)}.` : "";

  return (
    <CalculatorLayout
      inputs={<InputCard title="Income and deductions">
        <SegmentedControl label="Your age" value={age} onChange={setAge} options={AGE_OPTIONS} />
        <NumberField label="Annual gross salary" prefix="₹" value={values.salary} onChange={set("salary")} error={salary.errors.salary} hint="Before any deductions, including allowances and bonus" />
        <NumberField label="Other income" prefix="₹" value={values.otherIncome} onChange={set("otherIncome")} error={parsed.otherIncome.error} hint="Interest, rent, freelance income (taxed at slab rates)" />
        <NumberField label="Employer's NPS contribution — 80CCD(2)" prefix="₹" value={values.employerNps} onChange={set("employerNps")} error={parsed.employerNps.error} hint="Allowed in both regimes (up to 14% of basic in the new regime, 10% in the old)" />
        <fieldset className="space-y-4 rounded-lg border p-4">
          <legend className="px-1 text-sm font-semibold">Deductions — old regime only</legend>
          {OLD_FIELDS.map((f) => <NumberField key={f.key} label={f.label} prefix="₹" value={values[f.key]} onChange={set(f.key)} error={parsed[f.key as Exclude<TaxField, "salary">].error} hint={f.hint} />)}
        </fieldset>
      </InputCard>}
      result={results ? (
        <ResultCard highlightLabel={`Lower tax: ${better === "new" ? "new" : "old"} regime`} highlightValue={rupees(results[better].totalTax)}
          highlightCaption={saving > 0 ? `Saves ${rupees(saving)} a year over the ${better === "new" ? "old" : "new"} regime` : "Both regimes give the same tax"}
          actions={<><CopyButton text={summary} /><SaveCalculationButton text={summary} /><ResetButton onReset={() => { setValues(TAX_DEFAULTS); setAge("below60"); }} /></>}>
          <div className="grid gap-3 sm:grid-cols-2">
            <RegimeColumn result={results.new} best={better === "new"} />
            <RegimeColumn result={results.old} best={better === "old"} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">FY 2025-26 and FY 2026-27 rates (Budget 2026 made no changes). Effective rate: {formatNumber(Math.round(results[better].effectiveRate * 100) / 100)}%. Capital gains and other special-rate income aren&apos;t included.</p>
        </ResultCard>
      ) : <EmptyResult message="Enter your annual salary to compare tax under the old and new regimes." />}
    />
  );
}

// ---- HRA

const HRA_DEFAULTS = { basic: "50000", da: "", commission: "", hra: "20000", rent: "25000" };

export function HraCalculator() {
  const [values, setValues] = useState(HRA_DEFAULTS);
  const [period, setPeriod] = useState<"monthly" | "annual">("monthly");
  const [year, setYear] = useState<HraYear>("2026-27");
  const [city, setCity] = useState("Mumbai");
  const set = (key: keyof typeof HRA_DEFAULTS) => (value: string) => setValues((v) => ({ ...v, [key]: value }));
  const required = validateInputs(z.object({ basic: numberString({ min: 0, max: 1e10, exclusiveMin: true }), hra: numberString({ min: 0, max: 1e10 }), rent: numberString({ min: 0, max: 1e10 }) }), { basic: values.basic, hra: values.hra, rent: values.rent });
  const da = optional(values.da);
  const commission = optional(values.commission);
  const metros = HRA_METROS[year];
  const metro = metros.includes(city);
  const factor = period === "monthly" ? 12 : 1;
  const result = required.ok && !da.error && !commission.error
    ? calculateHra({ basic: required.data.basic * factor, da: da.value * factor, commission: commission.value * factor, hraReceived: required.data.hra * factor, rentPaid: required.data.rent * factor, metro })
    : null;
  const per = period === "monthly" ? "a month" : "a year";
  const summary = result ? `HRA exemption (FY ${year}, ${metro ? "metro" : "non-metro"}): ${rupees(result.exempt)} a year exempt, ${rupees(result.taxable)} taxable.` : "";

  return (
    <CalculatorLayout
      inputs={<InputCard title="Salary and rent">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Financial year" value={year} onChange={setYear} options={[{ value: "2026-27", label: "FY 2026-27" }, { value: "2025-26", label: "FY 2025-26" }]} />
          <SelectField label="City you rent in" value={metros.includes(city) || city === "other" ? city : "other"} onChange={setCity} options={[...metros.map((c) => ({ value: c, label: `${c} (metro, 50%)` })), { value: "other", label: "Any other city (40%)" }]} />
        </div>
        <SegmentedControl label="Amounts entered" value={period} onChange={setPeriod} options={[{ value: "monthly", label: "Per month" }, { value: "annual", label: "Per year" }]} />
        <NumberField label="Basic salary" prefix="₹" value={values.basic} onChange={set("basic")} error={required.errors.basic} />
        <NumberField label="Dearness allowance (DA)" prefix="₹" value={values.da} onChange={set("da")} error={da.error} hint="Only the part counted for retirement benefits; leave blank if none" />
        <NumberField label="Commission (fixed % of turnover)" prefix="₹" value={values.commission} onChange={set("commission")} error={commission.error} hint="Usually blank" />
        <NumberField label="HRA received" prefix="₹" value={values.hra} onChange={set("hra")} error={required.errors.hra} />
        <NumberField label="Rent paid" prefix="₹" value={values.rent} onChange={set("rent")} error={required.errors.rent} />
      </InputCard>}
      result={result ? (
        <ResultCard highlightLabel="Exempt HRA" highlightValue={rupees(result.exempt / factor)} highlightCaption={`${per} · ${rupees(result.exempt)} for the year`}
          actions={<><CopyButton text={summary} /><SaveCalculationButton text={summary} /><ResetButton onReset={() => setValues(HRA_DEFAULTS)} /></>}>
          <ResultRows rows={[
            { label: "HRA received", value: rupees(required.ok ? required.data.hra : 0) },
            { label: "Exempt from tax", value: rupees(result.exempt / factor) },
            { label: "Taxable HRA", value: rupees(result.taxable / factor), emphasis: true },
          ]} />
          <div className="mt-4 space-y-2 border-t pt-4">
            <h3 className="text-sm font-semibold">Exemption is the least of these ({per})</h3>
            <ul className="space-y-1.5 text-sm">
              {result.limits.map((l) => (
                <li key={l.label} className={cn("flex justify-between gap-3 rounded-md px-2 py-1", l.label === result.binding && "bg-accent font-medium")}>
                  <span>{l.label}{l.label === result.binding && " ← applies"}</span><span className="tabular-nums">{rupees(l.amount / factor)}</span>
                </li>
              ))}
            </ul>
            {result.taxable > 0 && result.binding.startsWith("Rent") && <Note>Paying rent of {rupees(result.rentForFullExemption / factor)} {per} or more would make all your HRA exempt (subject to the salary limit).</Note>}
            <Note>HRA exemption is available only in the old tax regime. If your rent is over ₹1 lakh a year, give your employer your landlord&apos;s PAN.</Note>
          </div>
        </ResultCard>
      ) : <EmptyResult message="Enter your basic salary, HRA and rent to see how much HRA is tax-free." />}
    />
  );
}

// ---- Gratuity

const GRATUITY_DEFAULTS = { wage: "60000", years: "8", months: "7", gross: "" };
const EMPLOYERS: { value: GratuityEmployer; label: string }[] = [
  { value: "covered", label: "Covered by the Gratuity Act" }, { value: "not-covered", label: "Not covered" }, { value: "government", label: "Government" },
];

export function GratuityCalculator() {
  const [values, setValues] = useState(GRATUITY_DEFAULTS);
  const [employer, setEmployer] = useState<GratuityEmployer>("covered");
  const [fixedTerm, setFixedTerm] = useState(false);
  const set = (key: keyof typeof GRATUITY_DEFAULTS) => (value: string) => setValues((v) => ({ ...v, [key]: value }));
  const validation = validateInputs(z.object({ wage: numberString({ min: 0, max: 1e9, exclusiveMin: true }), years: numberString({ min: 0, max: 60, integer: true }), months: numberString({ min: 0, max: 11, integer: true }) }), { wage: values.wage, years: values.years, months: values.months || "0" });
  const gross = optional(values.gross);
  // Labour codes: if allowances exceed half of total pay, the excess counts as wages.
  const wage = validation.ok ? Math.max(validation.data.wage, gross.value / 2) : 0;
  const result = validation.ok && !gross.error ? calculateGratuity({ monthlyWage: wage, years: validation.data.years, months: validation.data.months, employer }) : null;
  const totalMonths = validation.ok ? validation.data.years * 12 + validation.data.months : 0;
  const eligible = fixedTerm ? totalMonths >= 12 : totalMonths >= 60;
  const summary = result ? `Gratuity on ${rupees(wage)} monthly wages for ${result.serviceYears} years of service: ${rupees(result.gratuity)} (${rupees(result.taxFree)} tax-free).` : "";

  return (
    <CalculatorLayout
      inputs={<InputCard title="Salary and service">
        <SelectField label="Employer" value={employer} onChange={setEmployer} options={EMPLOYERS} />
        <NumberField label="Last drawn basic salary + DA (monthly)" prefix="₹" value={values.wage} onChange={set("wage")} error={validation.errors.wage} />
        <NumberField label="Total monthly pay (optional)" prefix="₹" value={values.gross} onChange={set("gross")} error={gross.error} hint="Under the labour codes, if basic + DA is less than half your total pay, half your total pay counts as wages" />
        <div className="grid grid-cols-2 gap-4">
          <NumberField label="Years of service" suffix="yrs" value={values.years} onChange={set("years")} error={validation.errors.years} />
          <NumberField label="Extra months" suffix="mo" value={values.months} onChange={set("months")} error={validation.errors.months} />
        </div>
        <CheckboxField label="Fixed-term employee" checked={fixedTerm} onChange={setFixedTerm} hint="Fixed-term staff qualify after one year under the labour codes" />
      </InputCard>}
      result={result ? (
        <ResultCard highlightLabel="Gratuity amount" highlightValue={rupees(result.gratuity)} highlightCaption={`for ${result.serviceYears} ${result.serviceYears === 1 ? "year" : "years"} of service`}
          actions={<><CopyButton text={summary} /><SaveCalculationButton text={summary} /><ResetButton onReset={() => { setValues(GRATUITY_DEFAULTS); setEmployer("covered"); setFixedTerm(false); }} /></>}>
          <ResultRows rows={[
            { label: "Wages used (basic + DA)", value: rupees(wage) },
            { label: "Service counted", value: `${result.serviceYears} years` },
            { label: "Formula", value: employer === "not-covered" ? "½ × wages × completed years" : "15 × wages × years ÷ 26" },
            { label: "Tax-free", value: rupees(result.taxFree) },
            { label: "Taxable", value: rupees(result.taxable) },
            { label: "Gratuity", value: rupees(result.gratuity), emphasis: true },
          ]} />
          <div className="mt-4 space-y-2 border-t pt-4">
            {!eligible && <Note tone="warn">Gratuity is normally paid after {fixedTerm ? "one year" : "five years"} of continuous service. It&apos;s paid regardless of service on death or disablement.</Note>}
            {employer === "covered" && validation.ok && validation.data.months > 0 && validation.data.months <= 6 && <Note>Only a part year of more than six months counts as a full year, so the {validation.data.months} extra months aren&apos;t counted.</Note>}
            {employer === "not-covered" && <Note>For employers not covered by the Act, only completed years count and wages are the average of the last 10 months.</Note>}
            {employer !== "government" && result.gratuity > GRATUITY_TAX_FREE_LIMIT && <Note tone="warn">The Act caps gratuity at {rupees(GRATUITY_TAX_FREE_LIMIT)}, and that is also the lifetime tax-free limit. Anything your employer pays above it is taxable.</Note>}
          </div>
        </ResultCard>
      ) : <EmptyResult message="Enter your last drawn basic salary and years of service to calculate gratuity." />}
    />
  );
}

// ---- EPF

const EPF_DEFAULTS = { wage: "30000", age: "28", retirementAge: "58", balance: "100000", increase: "5", rate: "8.25", employeeRate: "12" };

export function EpfCalculator() {
  const [values, setValues] = useState(EPF_DEFAULTS);
  const set = (key: keyof typeof EPF_DEFAULTS) => (value: string) => setValues((v) => ({ ...v, [key]: value }));
  const validation = validateInputs(z.object({
    wage: numberString({ min: 0, max: 1e8, exclusiveMin: true }), age: numberString({ min: 15, max: 70 }), retirementAge: numberString({ min: 16, max: 75 }),
    balance: numberString({ min: 0, max: 1e10 }), increase: numberString({ min: 0, max: 50 }), rate: numberString({ min: 0, max: 20 }), employeeRate: numberString({ min: 12, max: 100 }),
  }), { ...EPF_DEFAULTS, ...values, balance: values.balance || "0" });
  const ageError = validation.ok && validation.data.retirementAge <= validation.data.age ? "Must be more than your current age" : undefined;
  const result = validation.ok && !ageError ? projectEpf({ monthlyWage: validation.data.wage, age: validation.data.age, retirementAge: validation.data.retirementAge, currentBalance: validation.data.balance, annualIncrease: validation.data.increase, interestRate: validation.data.rate, employeeRate: validation.data.employeeRate }) : null;
  const monthly = validation.ok ? { employee: (validation.data.wage * validation.data.employeeRate) / 100, eps: Math.min(validation.data.wage, 15_000) * 0.0833, employer: validation.data.wage * 0.12 - Math.min(validation.data.wage, 15_000) * 0.0833 } : null;
  const summary = result ? `EPF at retirement (age ${values.retirementAge}): ${rupees(result.balance)}, from ${rupees(result.totalEmployee)} your contributions, ${rupees(result.totalEmployer)} employer's and ${rupees(result.totalInterest)} interest at ${values.rate}%.` : "";

  return (
    <div className="space-y-6">
      <CalculatorLayout
        inputs={<InputCard title="Salary and EPF details">
          <NumberField label="Monthly basic salary + DA" prefix="₹" value={values.wage} onChange={set("wage")} error={validation.errors.wage} />
          <div className="grid grid-cols-2 gap-4">
            <NumberField label="Your age" suffix="yrs" value={values.age} onChange={set("age")} error={validation.errors.age} />
            <NumberField label="Retirement age" suffix="yrs" value={values.retirementAge} onChange={set("retirementAge")} error={validation.errors.retirementAge ?? ageError} />
          </div>
          <NumberField label="Current EPF balance" prefix="₹" value={values.balance} onChange={set("balance")} error={validation.errors.balance} />
          <NumberField label="Expected yearly salary increase" suffix="%" value={values.increase} onChange={set("increase")} error={validation.errors.increase} />
          <NumberField label="EPF interest rate" suffix="%" value={values.rate} onChange={set("rate")} error={validation.errors.rate} hint="8.25% for FY 2023-24, 2024-25 and 2025-26" />
          <NumberField label="Your contribution" suffix="% of wages" value={values.employeeRate} onChange={set("employeeRate")} error={validation.errors.employeeRate} hint="12% is mandatory; more than that is Voluntary PF (VPF)" />
        </InputCard>}
        result={result && monthly ? (
          <ResultCard highlightLabel="EPF balance at retirement" highlightValue={rupees(result.balance)} highlightCaption={`at age ${values.retirementAge}, after ${result.years} years`}
            actions={<><CopyButton text={summary} /><SaveCalculationButton text={summary} /><ResetButton onReset={() => setValues(EPF_DEFAULTS)} /></>}>
            <ResultRows rows={[
              { label: "Opening balance", value: rupees(validation.ok ? validation.data.balance : 0) },
              { label: "Your contributions", value: rupees(result.totalEmployee) },
              { label: "Employer's contributions (to EPF)", value: rupees(result.totalEmployer) },
              { label: "Interest earned", value: rupees(result.totalInterest) },
              { label: "Balance at retirement", value: rupees(result.balance), emphasis: true },
            ]} />
            <div className="mt-4 space-y-2 border-t pt-4 text-sm">
              <h3 className="font-semibold">This month&apos;s split</h3>
              <ResultRows rows={[
                { label: "You (to EPF)", value: rupees(monthly.employee) },
                { label: "Employer to EPF (3.67%+)", value: rupees(monthly.employer) },
                { label: "Employer to pension, EPS (8.33% of up to ₹15,000)", value: rupees(monthly.eps) },
              ]} />
              <Note>EPS contributions ({rupees(result.totalEps)} in total) fund your monthly pension and aren&apos;t part of the EPF balance. Interest on your own contributions above ₹2.5 lakh a year is taxable.</Note>
            </div>
          </ResultCard>
        ) : <EmptyResult message="Enter your basic salary and age to project your EPF balance." />}
      />
      {result && result.schedule.length > 0 && (
        <section aria-label="Year-by-year EPF growth" className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
          <h2 className="text-base font-semibold">Year-by-year growth</h2>
          <div className="max-h-[28rem] overflow-auto rounded-lg border">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted">
                <TableRow><TableHead>Age</TableHead><TableHead className="text-right">You</TableHead><TableHead className="text-right">Employer</TableHead><TableHead className="text-right">Interest</TableHead><TableHead className="text-right">Balance</TableHead></TableRow>
              </TableHeader>
              <TableBody className="tabular-nums">
                {result.schedule.map((y) => (
                  <TableRow key={y.year}><TableCell>{y.age}</TableCell><TableCell className="text-right">{rupees(y.employee)}</TableCell><TableCell className="text-right">{rupees(y.employer)}</TableCell><TableCell className="text-right">{rupees(y.interest)}</TableCell><TableCell className="text-right">{rupees(y.balance)}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}
    </div>
  );
}
