"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { z } from "zod";
import { calculateEmi } from "@/lib/calculations/emi";
import { projectMutualFund, type FundMode } from "@/lib/calculations/investment";
import { formatINR, formatNumber } from "@/lib/format";
import { numberString, validateInputs } from "@/lib/validation/fields";
import { ChipPicker, NumberField, SegmentedControl } from "@/components/shared/form-fields";
import { CopyButton, ResetButton, SaveCalculationButton } from "@/components/shared/result-actions";
import { CalculatorLayout, EmptyResult, ErrorResult, InputCard, ResultCard, ResultRows } from "@/components/shared/result-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const chartFallback = () => <div className="h-44 animate-pulse rounded-lg bg-muted" />;
const BreakupChart = dynamic(() => import("./emi-charts").then((m) => m.EmiBreakupChart), { ssr: false, loading: chartFallback });

function YearTable({ heading, columns, rows }: { heading: string; columns: string[]; rows: (string | number)[][] }) {
  return (
    <section aria-label={heading} className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
      <h2 className="text-base font-semibold">{heading}</h2>
      <div className="max-h-[28rem] overflow-auto rounded-lg border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow>{columns.map((c, i) => <TableHead key={c} className={i ? "text-right" : undefined}>{c}</TableHead>)}</TableRow>
          </TableHeader>
          <TableBody className="tabular-nums">
            {rows.map((row) => <TableRow key={String(row[0])}>{row.map((cell, i) => <TableCell key={i} className={i ? "text-right" : undefined}>{cell}</TableCell>)}</TableRow>)}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

// ---- Car loan

const carSchema = z.object({
  price: numberString({ min: 0, max: 1e9, exclusiveMin: true }),
  down: numberString({ min: 0, max: 1e9 }),
  rate: numberString({ min: 0, max: 40 }),
  years: numberString({ min: 0, max: 10, exclusiveMin: true }),
  fee: numberString({ min: 0, max: 10 }),
});
const CAR_DEFAULTS = { price: "1000000", down: "200000", rate: "9.5", years: "5", fee: "0.5" };

export function CarLoanCalculator() {
  const [values, setValues] = useState(CAR_DEFAULTS);
  const set = (key: keyof typeof CAR_DEFAULTS) => (value: string) => setValues((v) => ({ ...v, [key]: value }));
  const validation = validateInputs(carSchema, values);
  const data = validation.ok ? validation.data : null;
  const loan = data ? data.price - data.down : 0;
  const error = data && loan <= 0 ? "The down payment must be less than the car's on-road price." : undefined;
  const result = data && !error ? calculateEmi({ principal: loan, annualRate: data.rate, months: Math.round(data.years * 12) }) : null;
  const fee = data ? (loan * data.fee) / 100 : 0;
  const totalCost = result && data ? data.down + result.totalPayment + fee : 0;
  const downPercent = data && data.price ? (data.down / data.price) * 100 : 0;
  const summary = result && data ? `Car loan of ${formatINR(loan, { whole: true })} at ${data.rate}% for ${data.years} years: EMI ${formatINR(result.emi)}, total interest ${formatINR(result.totalInterest, { whole: true })}, total cost of the car ${formatINR(totalCost, { whole: true })}.` : "";

  return (
    <div className="space-y-6">
      <CalculatorLayout
        inputs={<InputCard title="Car and loan details">
          <NumberField label="On-road price of the car" prefix="₹" value={values.price} onChange={set("price")} error={validation.errors.price} hint="Ex-showroom price plus registration, insurance and other charges" />
          <NumberField label="Down payment" prefix="₹" value={values.down} onChange={set("down")} error={validation.errors.down} hint={data ? `${formatNumber(Math.round(downPercent * 10) / 10)}% of the on-road price — lenders usually fund 80–90%` : undefined} />
          <ChipPicker label="Down payment shortcut" options={["10", "15", "20", "30"]} value={data ? String(Math.round(downPercent)) : ""} onSelect={(p) => data && set("down")(String(Math.round((data.price * Number(p)) / 100)))} format={(p) => `${p}%`} />
          <NumberField label="Interest rate (per year)" suffix="%" value={values.rate} onChange={set("rate")} error={validation.errors.rate} hint="New car loans typically 8.5–11%; used cars 11–16%" />
          <NumberField label="Loan tenure" suffix="years" value={values.years} onChange={set("years")} error={validation.errors.years} />
          <ChipPicker label="Common tenures" options={["3", "5", "7"]} value={values.years} onSelect={set("years")} format={(y) => `${y} yrs`} />
          <NumberField label="Processing fee" suffix="% of loan" value={values.fee} onChange={set("fee")} error={validation.errors.fee} />
        </InputCard>}
        result={result ? (
          <ResultCard highlightLabel="Monthly EMI" highlightValue={formatINR(result.emi)} highlightCaption={`${Math.round(Number(values.years) * 12)} EMIs on a ${formatINR(loan, { whole: true })} loan`}
            actions={<><CopyButton text={summary} /><SaveCalculationButton text={summary} /><ResetButton onReset={() => setValues(CAR_DEFAULTS)} /></>}>
            <ResultRows rows={[
              { label: "Loan amount", value: formatINR(loan, { whole: true }) },
              { label: "Total interest", value: formatINR(result.totalInterest, { whole: true }) },
              { label: "Processing fee", value: formatINR(fee, { whole: true }) },
              { label: "Down payment", value: formatINR(data?.down ?? 0, { whole: true }) },
              { label: "Total cost of the car", value: formatINR(totalCost, { whole: true }), emphasis: true },
            ]} />
            <div className="mt-4 border-t pt-4"><BreakupChart principal={loan} interest={result.totalInterest} /></div>
          </ResultCard>
        ) : error ? <ErrorResult message={error} /> : <EmptyResult message="Enter the car price, down payment, rate and tenure to see your EMI." />}
      />
      {result && result.yearly.length > 1 && (
        <YearTable heading="Year-by-year repayment" columns={["Year", "Principal", "Interest", "Balance"]}
          rows={result.yearly.map((y) => [y.year, formatINR(y.principal, { whole: true }), formatINR(y.interest, { whole: true }), formatINR(y.balance, { whole: true })])} />
      )}
    </div>
  );
}

// ---- Mutual fund

const fundSchema = z.object({
  amount: numberString({ min: 0, max: 1e11, exclusiveMin: true }),
  rate: numberString({ min: 0, max: 50 }),
  years: numberString({ min: 0, max: 60, exclusiveMin: true }),
  stepUp: numberString({ min: 0, max: 100 }),
  inflation: numberString({ min: 0, max: 20 }),
});
const FUND_DEFAULTS = { amount: "10000", rate: "12", years: "15", stepUp: "10", inflation: "6" };
const MODE_LABEL: Record<FundMode, string> = { sip: "Monthly SIP", lumpsum: "Lump sum", "step-up": "Step-up SIP" };

export function MutualFundCalculator() {
  const [mode, setMode] = useState<FundMode>("sip");
  const [values, setValues] = useState(FUND_DEFAULTS);
  const set = (key: keyof typeof FUND_DEFAULTS) => (value: string) => setValues((v) => ({ ...v, [key]: value }));
  const validation = validateInputs(fundSchema, values);
  const result = validation.ok ? projectMutualFund({ mode, amount: validation.data.amount, annualRate: validation.data.rate, years: validation.data.years, stepUp: validation.data.stepUp, inflation: validation.data.inflation }) : null;
  const summary = result ? `${MODE_LABEL[mode]} of ${formatINR(validation.ok ? validation.data.amount : 0, { whole: true })}${mode === "lumpsum" ? "" : " a month"} at ${values.rate}% for ${values.years} years: invested ${formatINR(result.invested, { whole: true })}, estimated value ${formatINR(result.maturity, { whole: true })} (${formatINR(result.realValue, { whole: true })} in today's money).` : "";

  return (
    <div className="space-y-6">
      <CalculatorLayout
        inputs={<InputCard title="Investment details">
          <SegmentedControl label="How you invest" value={mode} onChange={setMode} options={(Object.keys(MODE_LABEL) as FundMode[]).map((value) => ({ value, label: MODE_LABEL[value] }))} />
          <NumberField label={mode === "lumpsum" ? "One-time investment" : mode === "step-up" ? "Starting monthly SIP" : "Monthly SIP"} prefix="₹" value={values.amount} onChange={set("amount")} error={validation.errors.amount} />
          {mode === "step-up" && <NumberField label="Increase the SIP every year by" suffix="%" value={values.stepUp} onChange={set("stepUp")} error={validation.errors.stepUp} hint="Many investors raise their SIP in line with salary hikes" />}
          <NumberField label="Expected return (per year)" suffix="%" value={values.rate} onChange={set("rate")} error={validation.errors.rate} />
          <ChipPicker label="Typical long-term returns" options={["7", "10", "12", "14"]} value={values.rate} onSelect={set("rate")} format={(r) => ({ "7": "Debt 7%", "10": "Hybrid 10%", "12": "Large cap 12%", "14": "Mid/small 14%" })[r] ?? `${r}%`} />
          <NumberField label="Investment period" suffix="years" value={values.years} onChange={set("years")} error={validation.errors.years} />
          <NumberField label="Inflation (to show today's value)" suffix="%" value={values.inflation} onChange={set("inflation")} error={validation.errors.inflation} />
        </InputCard>}
        result={result ? (
          <ResultCard highlightLabel="Estimated value" highlightValue={formatINR(result.maturity, { whole: true })} highlightCaption={`after ${values.years} years at ${values.rate}% a year`}
            actions={<><CopyButton text={summary} /><SaveCalculationButton text={summary} /><ResetButton onReset={() => { setValues(FUND_DEFAULTS); setMode("sip"); }} /></>}>
            <ResultRows rows={[
              { label: "Total invested", value: formatINR(result.invested, { whole: true }) },
              { label: "Estimated returns", value: formatINR(result.returns, { whole: true }) },
              { label: "Estimated value", value: formatINR(result.maturity, { whole: true }), emphasis: true },
              { label: `Worth in today's money (${values.inflation}% inflation)`, value: formatINR(result.realValue, { whole: true }), sub: true },
            ]} />
            <div className="mt-4 border-t pt-4"><BreakupChart principal={result.invested} interest={Math.max(0, result.returns)} labels={["Invested", "Returns"]} /></div>
          </ResultCard>
        ) : <EmptyResult message="Enter the amount, expected return and period to project your mutual fund value." />}
      />
      {result && result.schedule.length > 1 && (
        <YearTable heading="Year-by-year growth" columns={["Year", "Invested", "Value", "Gain"]}
          rows={result.schedule.map((y) => [y.year, formatINR(y.invested, { whole: true }), formatINR(y.value, { whole: true }), formatINR(y.value - y.invested, { whole: true })])} />
      )}
    </div>
  );
}
