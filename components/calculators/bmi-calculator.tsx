"use client";

import { useState } from "react";
import { z } from "zod";
import { formatNumber } from "@/lib/format";
import { numberString, validateInputs } from "@/lib/validation/fields";
import { NumberField } from "@/components/shared/form-fields";
import { CopyButton, ResetButton } from "@/components/shared/result-actions";
import { CalculatorLayout, EmptyResult, InputCard, ResultCard, ResultRows } from "@/components/shared/result-card";

const schema = z.object({ weight: numberString({ min: 1, max: 500 }), height: numberString({ min: 50, max: 300 }) });
const EMPTY = { weight: "", height: "" };
const oneDecimal = (value: number) => formatNumber(Math.round(value * 10) / 10);

export function BmiCalculator() {
  const [values, setValues] = useState(EMPTY);
  const validation = validateInputs(schema, values);
  const result = validation.ok ? (() => {
    const metres = validation.data.height / 100;
    const bmi = validation.data.weight / metres ** 2;
    const category = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Healthy weight" : bmi < 30 ? "Overweight" : "Obesity range";
    return { bmi, category, low: 18.5 * metres ** 2, high: 24.9 * metres ** 2 };
  })() : null;
  const rounded = result ? oneDecimal(result.bmi) : "";
  return <CalculatorLayout inputs={<InputCard>
    <NumberField label="Weight" suffix="kg" value={values.weight} onChange={(weight) => setValues((v) => ({ ...v, weight }))} error={validation.errors.weight} />
    <NumberField label="Height" suffix="cm" value={values.height} onChange={(height) => setValues((v) => ({ ...v, height }))} error={validation.errors.height} />
  </InputCard>} result={result ? <ResultCard highlightLabel="Your BMI" highlightValue={rounded} highlightCaption={result.category} actions={<><CopyButton text={`BMI: ${rounded} (${result.category}). Healthy weight range: ${oneDecimal(result.low)}–${oneDecimal(result.high)} kg.`} /><ResetButton onReset={() => setValues(EMPTY)} /></>}>
    <ResultRows rows={[{ label: "Weight category", value: result.category }, { label: "Healthy BMI range", value: "18.5–24.9" }, { label: "Healthy weight for your height", value: `${oneDecimal(result.low)}–${oneDecimal(result.high)} kg`, emphasis: true }]} />
  </ResultCard> : <EmptyResult message="Enter your height and weight to calculate your BMI." />} />;
}
