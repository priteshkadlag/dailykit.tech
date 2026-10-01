"use client";

import { useState } from "react";
import { z } from "zod";
import { applyPercent, percentChange, percentOf, whatPercent } from "@/lib/calculations/percentage";
import { formatNumber } from "@/lib/format";
import { useLocationHash } from "@/lib/hooks/use-client-values";
import { numberString, validateInputs } from "@/lib/validation/fields";
import { NumberField, SegmentedControl } from "@/components/shared/form-fields";
import { CopyButton, ResetButton } from "@/components/shared/result-actions";
import { CalculatorLayout, EmptyResult, ErrorResult, InputCard, ResultCard, ResultRows } from "@/components/shared/result-card";

type Mode = "of" | "what" | "change" | "apply";
const MODES: Mode[] = ["of", "what", "change", "apply"];

const schema = z.object({
  a: numberString({ min: -1e12, max: 1e12 }),
  b: numberString({ min: -1e12, max: 1e12 }),
});

const config: Record<Mode, { tab: string; aLabel: string; bLabel: string; aSuffix?: string; bSuffix?: string; empty: string }> = {
  of: { tab: "X% of Y", aLabel: "Percentage (X)", aSuffix: "%", bLabel: "Of value (Y)", empty: "Find what X percent of a number is — e.g. 18% of 2,500." },
  what: { tab: "X is what % of Y", aLabel: "Value (X)", bLabel: "Total (Y)", empty: "Find what percentage one number is of another — e.g. marks scored out of total." },
  change: { tab: "% increase / decrease", aLabel: "Original value", bLabel: "New value", empty: "Find the percentage increase or decrease between two values — e.g. last month's vs this month's sales." },
  apply: { tab: "Add / subtract %", aLabel: "Value", bLabel: "Percentage", bSuffix: "%", empty: "Increase or decrease a value by a percentage — use a negative percentage to decrease." },
};

function compute(mode: Mode, a: number, b: number) {
  switch (mode) {
    case "of": {
      const value = percentOf(a, b);
      return { headline: formatNumber(value), label: `${formatNumber(a)}% of ${formatNumber(b)}`, sentence: `${formatNumber(a)}% of ${formatNumber(b)} is ${formatNumber(value)}`, rows: [{ label: "Remaining", value: formatNumber(b - value) }] };
    }
    case "what": {
      const value = whatPercent(a, b);
      if (Number.isNaN(value)) return { error: "The total (Y) can't be zero." };
      return { headline: `${formatNumber(value)}%`, label: `${formatNumber(a)} out of ${formatNumber(b)}`, sentence: `${formatNumber(a)} is ${formatNumber(value)}% of ${formatNumber(b)}`, rows: [{ label: "Remaining share", value: `${formatNumber(100 - value)}%` }] };
    }
    case "change": {
      const value = percentChange(a, b);
      if (Number.isNaN(value)) return { error: "The original value can't be zero — a change from zero has no percentage." };
      const direction = value > 0 ? "increase" : value < 0 ? "decrease" : "no change";
      return {
        headline: `${formatNumber(Math.abs(value))}%`,
        label: value === 0 ? "No change" : `Percentage ${direction}`,
        sentence: `From ${formatNumber(a)} to ${formatNumber(b)} is a ${formatNumber(Math.abs(value))}% ${direction}`,
        rows: [{ label: "Difference", value: `${b - a >= 0 ? "+" : "−"}${formatNumber(Math.abs(b - a))}` }],
      };
    }
    case "apply": {
      const value = applyPercent(a, b);
      return {
        headline: formatNumber(value),
        label: `${formatNumber(a)} ${b >= 0 ? "+" : "−"} ${formatNumber(Math.abs(b))}%`,
        sentence: `${formatNumber(a)} ${b >= 0 ? "increased" : "decreased"} by ${formatNumber(Math.abs(b))}% is ${formatNumber(value)}`,
        rows: [{ label: b >= 0 ? "Amount added" : "Amount subtracted", value: formatNumber(Math.abs(value - a)) }],
      };
    }
  }
}

const EMPTY = { a: "", b: "" };

export function PercentageCalculator() {
  const hash = useLocationHash();
  const [modeOverride, setModeOverride] = useState<Mode | null>(null);
  const mode: Mode = modeOverride ?? (MODES.includes(hash as Mode) ? (hash as Mode) : "of");
  const [values, setValues] = useState(EMPTY);
  const c = config[mode];

  const validation = validateInputs(schema, values);
  const outcome = validation.ok ? compute(mode, validation.data.a, validation.data.b) : null;

  return (
    <CalculatorLayout
      inputs={
        <InputCard>
          <SegmentedControl
            label="What do you want to calculate?"
            value={mode}
            onChange={(m) => {
              setModeOverride(m);
              setValues(EMPTY);
            }}
            options={MODES.map((m) => ({ value: m, label: config[m].tab }))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField label={c.aLabel} suffix={c.aSuffix} value={values.a} onChange={(a) => setValues((v) => ({ ...v, a }))} error={validation.errors.a} />
            <NumberField label={c.bLabel} suffix={c.bSuffix} value={values.b} onChange={(b) => setValues((v) => ({ ...v, b }))} error={validation.errors.b} />
          </div>
        </InputCard>
      }
      result={
        outcome && "error" in outcome && outcome.error ? (
          <ErrorResult message={outcome.error} />
        ) : outcome && !("error" in outcome) ? (
          <ResultCard
            highlightLabel={outcome.label}
            highlightValue={outcome.headline}
            highlightCaption={outcome.sentence}
            actions={
              <>
                <CopyButton text={outcome.sentence} />
                <ResetButton onReset={() => setValues(EMPTY)} />
              </>
            }
          >
            <ResultRows rows={outcome.rows} />
          </ResultCard>
        ) : (
          <EmptyResult message={c.empty} />
        )
      }
    />
  );
}
