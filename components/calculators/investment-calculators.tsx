"use client";

import { useState } from "react";
import { z } from "zod";
import { calculateFd, calculateSimpleInterest, calculateSip } from "@/lib/calculations/investment";
import { formatINR, formatPercent } from "@/lib/format";
import { numberString, validateInputs } from "@/lib/validation/fields";
import { ChipPicker, NumberField } from "@/components/shared/form-fields";
import { CopyButton, ResetButton } from "@/components/shared/result-actions";
import { CalculatorLayout, EmptyResult, InputCard, ResultCard, ResultRows } from "@/components/shared/result-card";

type Kind = "sip" | "fd" | "simple";
const defaults = { sip: { amount: "5000", rate: "12", years: "10" }, fd: { amount: "100000", rate: "7", years: "5" }, simple: { amount: "100000", rate: "8", years: "3" } };
const schema = z.object({
  amount: numberString({ min: 0, max: 1e12, exclusiveMin: true }),
  rate: numberString({ min: 0, max: 100 }),
  years: numberString({ min: 0, max: 100, exclusiveMin: true }),
});

function InvestmentCalculator({ kind }: { kind: Kind }) {
  const [values, setValues] = useState(defaults[kind]);
  const validation = validateInputs(schema, values);
  const set = (key: keyof typeof values) => (value: string) => setValues((v) => ({ ...v, [key]: value }));
  const title = kind === "sip" ? "Estimated maturity value" : kind === "fd" ? "Maturity amount" : "Total amount";
  const amountLabel = kind === "sip" ? "Monthly investment" : "Principal amount";
  const result = validation.ok
    ? kind === "sip" ? calculateSip(validation.data.amount, validation.data.rate, validation.data.years)
      : kind === "fd" ? calculateFd(validation.data.amount, validation.data.rate, validation.data.years)
        : calculateSimpleInterest(validation.data.amount, validation.data.rate, validation.data.years)
    : null;
  const total = result ? ("maturity" in result ? result.maturity : result.total) : 0;
  const gains = result ? ("returns" in result ? result.returns : result.interest) : 0;
  const base = result ? ("invested" in result ? result.invested : result.principal) : 0;
  const copy = result ? `${title}: ${formatINR(total)}. Amount invested: ${formatINR(base)}. ${kind === "sip" ? "Estimated returns" : "Interest earned"}: ${formatINR(gains)}.` : "";

  return <CalculatorLayout inputs={<InputCard>
    <NumberField label={amountLabel} prefix="₹" value={values.amount} onChange={set("amount")} error={validation.errors.amount} />
    <NumberField label="Expected annual return" suffix="%" value={values.rate} onChange={set("rate")} error={validation.errors.rate} />
    <ChipPicker label="Common rates" options={["6", "7", "8", "10", "12", "15"]} value={values.rate} onSelect={set("rate")} format={(v) => `${v}%`} />
    <NumberField label="Time period" suffix="years" value={values.years} onChange={set("years")} error={validation.errors.years} />
  </InputCard>} result={result ? <ResultCard highlightLabel={title} highlightValue={formatINR(total)} highlightCaption={`${formatPercent(validation.ok ? validation.data.rate : 0)} p.a. for ${values.years} years`} actions={<><CopyButton text={copy} /><ResetButton onReset={() => setValues(defaults[kind])} /></>}>
    <ResultRows rows={[{ label: kind === "sip" ? "Total invested" : "Principal", value: formatINR(base) }, { label: kind === "sip" ? "Estimated returns" : "Interest earned", value: formatINR(gains) }, { label: title, value: formatINR(total), emphasis: true }]} />
  </ResultCard> : <EmptyResult message={`Enter the ${amountLabel.toLowerCase()}, rate and time period to calculate the result.`} />} />;
}

export function SipCalculator() { return <InvestmentCalculator kind="sip" />; }
export function FdCalculator() { return <InvestmentCalculator kind="fd" />; }
export function SimpleInterestCalculator() { return <InvestmentCalculator kind="simple" />; }
