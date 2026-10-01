"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { z } from "zod";
import { applyDiscount, applyDiscountWithGst, applyMultipleDiscounts } from "@/lib/calculations/discount";
import { GST_RATES } from "@/lib/calculations/gst";
import { formatINR, formatPercent, parseNumber } from "@/lib/format";
import { useLocationHash } from "@/lib/hooks/use-client-values";
import { numberString, validateInputs } from "@/lib/validation/fields";
import { ChipPicker, NumberField, SegmentedControl } from "@/components/shared/form-fields";
import { CopyButton, ResetButton } from "@/components/shared/result-actions";
import { CalculatorLayout, EmptyResult, InputCard, ResultCard, ResultRows } from "@/components/shared/result-card";
import { Button } from "@/components/ui/button";

type Mode = "single" | "multiple" | "gst";
const MODES: Mode[] = ["single", "multiple", "gst"];
const MAX_STACKED = 5;

const priceField = numberString({ min: 0, max: 1e12, exclusiveMin: true });
const percentField = numberString({ min: 0, max: 100 });

const singleSchema = z.object({ price: priceField, discount: percentField });
const gstSchema = z.object({ price: priceField, discount: percentField, gst: percentField });

const DEFAULTS = { price: "", discount: "", gst: "18", stacked: ["20", "10"] };

export function DiscountCalculator() {
  const hash = useLocationHash();
  const [modeOverride, setModeOverride] = useState<Mode | null>(null);
  const mode: Mode = modeOverride ?? (MODES.includes(hash as Mode) ? (hash as Mode) : "single");
  const [gstIncluded, setGstIncluded] = useState(false);
  const [values, setValues] = useState(DEFAULTS);

  const set = (key: "price" | "discount" | "gst") => (value: string) => setValues((v) => ({ ...v, [key]: value }));

  // Validate each stacked discount individually so errors appear next to the right field.
  const stackedErrors = values.stacked.map((s) => {
    if (s.trim() === "") return undefined;
    const n = parseNumber(s);
    return Number.isFinite(n) && n >= 0 && n <= 100 ? undefined : "Enter 0–100";
  });

  const single = validateInputs(singleSchema, { price: values.price, discount: values.discount });
  const withGst = validateInputs(gstSchema, { price: values.price, discount: values.discount, gst: values.gst });
  const priceOnly = validateInputs(z.object({ price: priceField }), { price: values.price });
  const stackedValues = values.stacked.filter((s) => s.trim() !== "").map(parseNumber);
  const stackedOk = priceOnly.ok && stackedErrors.every((e) => !e) && stackedValues.length > 0;

  const errors: Partial<Record<"price" | "discount" | "gst", string>> =
    mode === "gst" ? withGst.errors : mode === "single" ? single.errors : priceOnly.errors;

  let resultNode: React.ReactNode = <EmptyResult message="Enter the original price and discount to see how much you save." />;

  if (mode === "single" && single.ok) {
    const r = applyDiscount(single.data.price, single.data.discount);
    const text = `${formatINR(r.originalPrice)} with ${formatPercent(single.data.discount)} off = ${formatINR(r.finalPrice)} (you save ${formatINR(r.discountAmount)})`;
    resultNode = (
      <ResultCard
        highlightLabel="Final price"
        highlightValue={formatINR(r.finalPrice)}
        highlightCaption={`You save ${formatINR(r.discountAmount)}`}
        actions={
          <>
            <CopyButton text={text} />
            <ResetButton onReset={() => setValues(DEFAULTS)} />
          </>
        }
      >
        <ResultRows
          rows={[
            { label: "Original price", value: formatINR(r.originalPrice) },
            { label: `Discount (${formatPercent(single.data.discount)})`, value: `− ${formatINR(r.discountAmount)}` },
            { label: "Final price", value: formatINR(r.finalPrice), emphasis: true },
          ]}
        />
      </ResultCard>
    );
  }

  if (mode === "multiple" && stackedOk && priceOnly.ok) {
    const r = applyMultipleDiscounts(priceOnly.data.price, stackedValues);
    const label = stackedValues.map((p) => formatPercent(p)).join(" + ");
    resultNode = (
      <ResultCard
        highlightLabel="Final price"
        highlightValue={formatINR(r.finalPrice)}
        highlightCaption={`${label} = effective ${formatPercent(Math.round(r.effectivePercent * 100) / 100)} off`}
        actions={
          <>
            <CopyButton
              text={`${formatINR(r.originalPrice)} with ${label} off = ${formatINR(r.finalPrice)} (effective ${formatPercent(Math.round(r.effectivePercent * 100) / 100)}, you save ${formatINR(r.discountAmount)})`}
            />
            <ResetButton onReset={() => setValues(DEFAULTS)} />
          </>
        }
      >
        <ResultRows
          rows={[
            { label: "Original price", value: formatINR(r.originalPrice) },
            ...r.steps.map((s, i) => ({ label: `Discount ${i + 1} (${formatPercent(s.percent)}) → ${formatINR(s.priceAfter)}`, value: `− ${formatINR(s.discount)}`, sub: true })),
            { label: "Total savings", value: formatINR(r.discountAmount) },
            { label: "Final price", value: formatINR(r.finalPrice), emphasis: true },
          ]}
        />
      </ResultCard>
    );
  }

  if (mode === "gst" && withGst.ok) {
    const { price, discount, gst } = withGst.data;
    const r = applyDiscountWithGst(price, discount, gst, gstIncluded);
    resultNode = (
      <ResultCard
        highlightLabel="Final price (incl. GST)"
        highlightValue={formatINR(r.finalPrice)}
        highlightCaption={`You save ${formatINR(r.discountAmount)}`}
        actions={
          <>
            <CopyButton
              text={`Price ${formatINR(price)} ${gstIncluded ? "(incl. GST)" : "+ GST"}, ${formatPercent(discount)} off, GST ${formatPercent(gst)}: taxable ${formatINR(r.priceAfterDiscount)}, GST ${formatINR(r.gstAmount)}, final ${formatINR(r.finalPrice)}`}
            />
            <ResetButton onReset={() => setValues(DEFAULTS)} />
          </>
        }
      >
        <ResultRows
          rows={[
            { label: gstIncluded ? "MRP (incl. GST)" : "Price (before GST)", value: formatINR(r.originalPrice) },
            { label: `Discount (${formatPercent(discount)})`, value: `− ${formatINR(r.discountAmount)}` },
            { label: "Taxable value after discount", value: formatINR(r.priceAfterDiscount) },
            { label: `GST @ ${formatPercent(gst)}`, value: `+ ${formatINR(r.gstAmount)}` },
            { label: "Final price", value: formatINR(r.finalPrice), emphasis: true },
          ]}
        />
      </ResultCard>
    );
  }

  return (
    <CalculatorLayout
      inputs={
        <InputCard>
          <SegmentedControl
            label="Discount type"
            value={mode}
            onChange={setModeOverride}
            options={[
              { value: "single", label: "Single discount" },
              { value: "multiple", label: "Multiple discounts" },
              { value: "gst", label: "Discount + GST" },
            ]}
          />
          {mode === "gst" && (
            <SegmentedControl
              label="Is GST already included in the price?"
              value={gstIncluded ? "yes" : "no"}
              onChange={(v) => setGstIncluded(v === "yes")}
              options={[
                { value: "no", label: "No, add GST" },
                { value: "yes", label: "Yes, it's the MRP" },
              ]}
            />
          )}
          <NumberField label={mode === "gst" && gstIncluded ? "MRP (incl. GST)" : "Original price"} prefix="₹" placeholder="e.g. 2,499" value={values.price} onChange={set("price")} error={errors.price} />

          {mode === "multiple" ? (
            <div className="space-y-3">
              {values.stacked.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <NumberField
                    className="flex-1"
                    label={`Discount ${i + 1}`}
                    suffix="%"
                    value={s}
                    error={stackedErrors[i]}
                    onChange={(next) => setValues((v) => ({ ...v, stacked: v.stacked.map((x, j) => (j === i ? next : x)) }))}
                  />
                  {values.stacked.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-6 size-11"
                      aria-label={`Remove discount ${i + 1}`}
                      onClick={() => setValues((v) => ({ ...v, stacked: v.stacked.filter((_, j) => j !== i) }))}
                    >
                      <X />
                    </Button>
                  )}
                </div>
              ))}
              {values.stacked.length < MAX_STACKED && (
                <Button type="button" variant="outline" className="h-10" onClick={() => setValues((v) => ({ ...v, stacked: [...v.stacked, ""] }))}>
                  <Plus /> Add another discount
                </Button>
              )}
            </div>
          ) : (
            <NumberField label="Discount" suffix="%" placeholder="e.g. 20" value={values.discount} onChange={set("discount")} error={errors.discount} />
          )}

          {mode === "gst" && (
            <div className="space-y-3">
              <NumberField label="GST rate" suffix="%" value={values.gst} onChange={set("gst")} error={withGst.errors.gst} />
              <ChipPicker label="Common GST rates" options={GST_RATES.map(String)} value={values.gst} onSelect={set("gst")} format={(r) => `${r}%`} />
            </div>
          )}
        </InputCard>
      }
      result={resultNode}
    />
  );
}
