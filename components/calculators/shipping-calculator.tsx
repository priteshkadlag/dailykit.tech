"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { z } from "zod";
import {
  calculateShipping,
  DEFAULT_RATE_CARD,
  ZONES,
  type RateCard,
  type ShippingMode,
  type ShippingZone,
} from "@/lib/calculations/shipping";
import { formatINR, formatNumber, parseNumber } from "@/lib/format";
import { numberString, validateInputs } from "@/lib/validation/fields";
import { CheckboxField, NumberField, SegmentedControl, SelectField } from "@/components/shared/form-fields";
import { CopyButton, ResetButton } from "@/components/shared/result-actions";
import { CalculatorLayout, EmptyResult, InputCard, ResultCard, ResultRows } from "@/components/shared/result-card";
import { Button } from "@/components/ui/button";

const dim = numberString({ min: 0, max: 500, exclusiveMin: true });
const schema = z.object({
  weight: numberString({ min: 0, max: 500, exclusiveMin: true }),
  length: dim,
  width: dim,
  height: dim,
  packaging: z.string().transform((s) => (s.trim() === "" ? "0" : s)).pipe(numberString({ min: 0, max: 1e6 })),
});
const orderValueSchema = z.object({ orderValue: numberString({ min: 0, max: 1e8 }) });

const DEFAULTS = { weight: "", length: "", width: "", height: "", packaging: "" };

export function ShippingCalculator() {
  const [values, setValues] = useState(DEFAULTS);
  const [zone, setZone] = useState<ShippingZone>("national");
  const [mode, setMode] = useState<ShippingMode>("surface");
  const [cod, setCod] = useState(false);
  const [orderValue, setOrderValue] = useState("");
  const [includeGst, setIncludeGst] = useState(true);
  const [card, setCard] = useState<RateCard>(DEFAULT_RATE_CARD);
  const [showCard, setShowCard] = useState(false);
  // Bumped on "restore" to remount the rate inputs with fresh text.
  const [cardVersion, setCardVersion] = useState(0);
  const set = (key: keyof typeof DEFAULTS) => (value: string) => setValues((v) => ({ ...v, [key]: value }));

  const validation = validateInputs(schema, values);
  const codValidation = validateInputs(orderValueSchema, { orderValue });
  const codReady = !cod || codValidation.ok;

  const quote =
    validation.ok && codReady
      ? calculateShipping(
          {
            weightKg: validation.data.weight,
            lengthCm: validation.data.length,
            widthCm: validation.data.width,
            heightCm: validation.data.height,
            zone,
            mode,
            cod,
            orderValue: cod && codValidation.ok ? codValidation.data.orderValue : 0,
            packaging: validation.data.packaging,
            includeGst,
          },
          card,
        )
      : null;

  const zoneLabel = ZONES.find((z) => z.value === zone)?.label ?? zone;
  const usingVolumetric = quote ? quote.volumetricWeight > quote.actualWeight : false;

  const setRate = (m: ShippingMode, z: ShippingZone, key: "base" | "additional") => (n: number) =>
    setCard((c) => ({ ...c, rates: { ...c.rates, [m]: { ...c.rates[m], [z]: { ...c.rates[m][z], [key]: n } } } }));
  const setCardValue = (key: "codFixed" | "codPercent" | "gstPercent") => (n: number) => setCard((c) => ({ ...c, [key]: n }));

  return (
    <div className="space-y-6">
      <CalculatorLayout
        inputs={
          <InputCard title="Parcel details">
            <NumberField label="Actual weight" suffix="kg" value={values.weight} onChange={set("weight")} error={validation.errors.weight} placeholder="e.g. 1.2" />
            <div>
              <p className="mb-1.5 text-sm font-medium">Box size (cm)</p>
              <div className="grid grid-cols-3 gap-3">
                <NumberField label="Length" value={values.length} onChange={set("length")} error={validation.errors.length} />
                <NumberField label="Width" value={values.width} onChange={set("width")} error={validation.errors.width} />
                <NumberField label="Height" value={values.height} onChange={set("height")} error={validation.errors.height} />
              </div>
            </div>
            <SelectField
              label="Shipping zone"
              value={zone}
              onChange={setZone}
              options={ZONES.map((z) => ({ value: z.value, label: `${z.label} — ${z.hint}` }))}
            />
            <SegmentedControl
              label="Shipping type"
              value={mode}
              onChange={setMode}
              options={[
                { value: "surface", label: "Surface (standard)" },
                { value: "express", label: "Express (air)" },
              ]}
            />
            <NumberField label="Packaging cost" prefix="₹" value={values.packaging} onChange={set("packaging")} error={validation.errors.packaging} placeholder="0" />
            <CheckboxField label="Cash on delivery (COD)" checked={cod} onChange={setCod} hint={`${formatINR(card.codFixed, { whole: true })} or ${formatNumber(card.codPercent)}% of order value, whichever is higher`} />
            {cod && <NumberField label="Order value (for COD charge)" prefix="₹" value={orderValue} onChange={setOrderValue} error={codValidation.errors.orderValue} />}
            <CheckboxField label={`Add ${formatNumber(card.gstPercent)}% GST on courier charges`} checked={includeGst} onChange={setIncludeGst} />
          </InputCard>
        }
        result={
          quote ? (
            <ResultCard
              highlightLabel="Total shipping cost"
              highlightValue={formatINR(quote.total)}
              highlightCaption={`${formatNumber(quote.chargeableWeight)} kg · ${zoneLabel} · ${mode === "surface" ? "Surface" : "Express"}`}
              actions={
                <>
                  <CopyButton
                    text={`Shipping: ${formatNumber(quote.chargeableWeight)} kg chargeable (${zoneLabel}, ${mode}) — freight ${formatINR(quote.freight)}${cod ? `, COD ${formatINR(quote.codCharge)}` : ""}${includeGst ? `, GST ${formatINR(quote.gst)}` : ""}${quote.packaging ? `, packaging ${formatINR(quote.packaging)}` : ""} = ${formatINR(quote.total)}`}
                  />
                  <ResetButton
                    onReset={() => {
                      setValues(DEFAULTS);
                      setCod(false);
                      setOrderValue("");
                    }}
                  />
                </>
              }
            >
              <ResultRows
                rows={[
                  { label: "Actual weight", value: `${formatNumber(quote.actualWeight)} kg` },
                  { label: `Volumetric weight (L×W×H ÷ ${card.volumetricDivisor[mode]})`, value: `${formatNumber(quote.volumetricWeight)} kg` },
                  { label: "Chargeable weight", value: `${formatNumber(quote.chargeableWeight)} kg`, emphasis: true },
                  { label: `Freight (${quote.slabs} × 0.5 kg slab${quote.slabs > 1 ? "s" : ""})`, value: formatINR(quote.freight) },
                  ...(cod ? [{ label: "COD charge", value: formatINR(quote.codCharge) }] : []),
                  ...(includeGst ? [{ label: `GST @ ${formatNumber(card.gstPercent)}%`, value: formatINR(quote.gst) }] : []),
                  ...(quote.packaging ? [{ label: "Packaging", value: formatINR(quote.packaging) }] : []),
                  { label: "Total", value: formatINR(quote.total), emphasis: true },
                ]}
              />
              {usingVolumetric && (
                <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                  You&apos;re being charged for the box size, not the weight. A smaller box could cut this cost.
                </p>
              )}
            </ResultCard>
          ) : (
            <EmptyResult message="Enter the parcel's weight and box size to estimate the courier charge." />
          )
        }
      />

      <section className="rounded-xl bg-card ring-1 ring-foreground/10">
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-full justify-between rounded-xl px-5 py-4 text-left sm:px-6"
          aria-expanded={showCard}
          onClick={() => setShowCard((s) => !s)}
        >
          <span>
            <span className="block text-base font-semibold">Rate card</span>
            <span className="block text-sm font-normal whitespace-normal text-muted-foreground">
              Sample rates typical of Indian courier aggregators. Edit them to match your courier.
            </span>
          </span>
          <ChevronDown className={showCard ? "rotate-180 transition-transform" : "transition-transform"} />
        </Button>
        {showCard && (
          <div key={cardVersion} className="space-y-5 border-t px-5 py-5 sm:px-6">
            {(["surface", "express"] as const).map((m) => (
              <div key={m} className="space-y-3">
                <h3 className="text-sm font-semibold">{m === "surface" ? "Surface" : "Express"} — price for first 0.5 kg / each extra 0.5 kg</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {ZONES.map((z) => (
                    <div key={z.value} className="grid grid-cols-2 gap-2 rounded-lg border p-3">
                      <p className="col-span-2 text-xs font-medium text-muted-foreground">{z.label}</p>
                      <RateField label="First" prefix="₹" initial={card.rates[m][z.value].base} onValue={setRate(m, z.value, "base")} />
                      <RateField label="Extra" prefix="₹" initial={card.rates[m][z.value].additional} onValue={setRate(m, z.value, "additional")} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="grid gap-3 sm:grid-cols-3">
              <RateField label="COD minimum" prefix="₹" initial={card.codFixed} onValue={setCardValue("codFixed")} />
              <RateField label="COD percentage" suffix="%" initial={card.codPercent} onValue={setCardValue("codPercent")} />
              <RateField label="GST on courier" suffix="%" initial={card.gstPercent} onValue={setCardValue("gstPercent")} />
            </div>
            <Button type="button" variant="outline" className="h-10" onClick={() => {
                setCard(DEFAULT_RATE_CARD);
                setCardVersion((v) => v + 1);
              }}>
              Restore sample rates
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

/** Rate-card input that keeps what the user types (e.g. "2.") and only reports valid numbers upward. */
function RateField({ label, prefix, suffix, initial, onValue }: { label: string; prefix?: string; suffix?: string; initial: number; onValue: (n: number) => void }) {
  const [text, setText] = useState(String(initial));
  const n = parseNumber(text);
  const valid = Number.isFinite(n) && n >= 0 && n <= 1e6;
  return (
    <NumberField
      label={label}
      prefix={prefix}
      suffix={suffix}
      value={text}
      error={valid ? undefined : "Invalid"}
      onChange={(next) => {
        setText(next);
        const value = parseNumber(next);
        if (Number.isFinite(value) && value >= 0 && value <= 1e6) onValue(value);
      }}
    />
  );
}
