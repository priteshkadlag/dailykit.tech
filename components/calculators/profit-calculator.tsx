"use client";

import { useState } from "react";
import { z } from "zod";
import { calculateProfit, targetSellingPrice } from "@/lib/calculations/profit";
import { formatINR, formatPercent } from "@/lib/format";
import { numberString, validateInputs } from "@/lib/validation/fields";
import { NumberField, SegmentedControl } from "@/components/shared/form-fields";
import { CopyButton, ResetButton } from "@/components/shared/result-actions";
import { CalculatorLayout, EmptyResult, InputCard, ResultCard, ResultRows } from "@/components/shared/result-card";

const money = numberString({ min: 0, max: 1e11 });
const optionalMoney = z.string().transform((s) => (s.trim() === "" ? "0" : s)).pipe(money);

const costSchema = z.object({
  purchasePrice: money,
  quantity: numberString({ min: 0, max: 1e9, exclusiveMin: true }),
  shipping: optionalMoney,
  packaging: optionalMoney,
  gatewayFeePercent: z.string().transform((s) => (s.trim() === "" ? "0" : s)).pipe(numberString({ min: 0, max: 99 })),
  marketing: optionalMoney,
  other: optionalMoney,
});
const profitSchema = costSchema.extend({ sellingPrice: money });
const targetSchema = z.object({ target: numberString({ min: 0, max: 1000 }) });

const DEFAULTS = { purchasePrice: "", sellingPrice: "", quantity: "1", shipping: "", packaging: "", gatewayFeePercent: "", marketing: "", other: "" };
type Values = typeof DEFAULTS;

export function ProfitCalculator() {
  const [values, setValues] = useState<Values>(DEFAULTS);
  const [target, setTarget] = useState("30");
  const [basis, setBasis] = useState<"margin" | "markup">("margin");
  const set = (key: keyof Values) => (value: string) => setValues((v) => ({ ...v, [key]: value }));

  // Optional cost fields are allowed to be empty, so only required ones count as "not filled in".
  const required = { purchasePrice: values.purchasePrice, quantity: values.quantity, sellingPrice: values.sellingPrice };
  const validation = validateInputs(profitSchema, values);
  const costValidation = validateInputs(costSchema, values); // Zod drops the extra sellingPrice key
  const targetValidation = validateInputs(targetSchema, { target });
  const incomplete = Object.values(required).some((v) => v.trim() === "");

  const result = validation.ok ? calculateProfit(validation.data) : null;
  const targetPrice = costValidation.ok && targetValidation.ok ? targetSellingPrice(costValidation.data, targetValidation.data.target, basis) : null;
  const qty = costValidation.ok ? costValidation.data.quantity : 1;

  const loss = result ? result.profit < 0 : false;

  return (
    <div className="space-y-6">
      <CalculatorLayout
        inputs={
          <InputCard title="Product & costs">
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField label="Purchase price (per unit)" prefix="₹" value={values.purchasePrice} onChange={set("purchasePrice")} error={validation.errors.purchasePrice} />
              <NumberField label="Selling price (per unit)" prefix="₹" value={values.sellingPrice} onChange={set("sellingPrice")} error={validation.errors.sellingPrice} />
              <NumberField label="Quantity" value={values.quantity} onChange={set("quantity")} error={validation.errors.quantity} />
              <NumberField label="Payment gateway / platform fee" suffix="%" value={values.gatewayFeePercent} onChange={set("gatewayFeePercent")} error={validation.errors.gatewayFeePercent} placeholder="0" hint="Razorpay, Amazon, Meesho fee etc." />
              <NumberField label="Shipping (per unit)" prefix="₹" value={values.shipping} onChange={set("shipping")} error={validation.errors.shipping} placeholder="0" />
              <NumberField label="Packaging (per unit)" prefix="₹" value={values.packaging} onChange={set("packaging")} error={validation.errors.packaging} placeholder="0" />
              <NumberField label="Marketing (total)" prefix="₹" value={values.marketing} onChange={set("marketing")} error={validation.errors.marketing} placeholder="0" hint="Ads, promotions for this batch" />
              <NumberField label="Other expenses (total)" prefix="₹" value={values.other} onChange={set("other")} error={validation.errors.other} placeholder="0" />
            </div>
          </InputCard>
        }
        result={
          result ? (
            <ResultCard
              highlightLabel={loss ? "Loss" : "Net profit"}
              highlightValue={formatINR(Math.abs(result.profit))}
              highlightCaption={`${formatPercent(round1(result.marginPercent))} margin · ${formatINR(result.profitPerUnit)} per unit`}
              tone={loss ? "negative" : "default"}
              actions={
                <>
                  <CopyButton
                    text={[
                      `Revenue: ${formatINR(result.revenue)}`,
                      `Total cost: ${formatINR(result.totalCost)}`,
                      `${loss ? "Loss" : "Profit"}: ${formatINR(Math.abs(result.profit))}`,
                      `Margin: ${formatPercent(round1(result.marginPercent))}, Markup: ${formatPercent(round1(result.markupPercent))}`,
                      `Break-even price: ${formatINR(result.breakEvenPrice)} per unit`,
                    ].join("\n")}
                  />
                  <ResetButton onReset={() => setValues(DEFAULTS)} />
                </>
              }
            >
              <ResultRows
                rows={[
                  { label: "Revenue", value: formatINR(result.revenue), emphasis: true },
                  { label: "Product cost", value: formatINR(result.productCost), sub: true },
                  { label: "Shipping & packaging", value: formatINR(result.shippingPackaging), sub: true },
                  { label: "Gateway / platform fee", value: formatINR(result.gatewayFee), sub: true },
                  { label: "Marketing & other", value: formatINR(result.overheads), sub: true },
                  { label: "Total cost", value: formatINR(result.totalCost), emphasis: true },
                  { label: "Profit margin (on selling price)", value: formatPercent(round1(result.marginPercent)) },
                  { label: "Markup (on total cost)", value: formatPercent(round1(result.markupPercent)) },
                  { label: "Cost per unit", value: formatINR(result.costPerUnit) },
                  { label: "Break-even selling price", value: Number.isNaN(result.breakEvenPrice) ? "–" : formatINR(result.breakEvenPrice) },
                ]}
              />
            </ResultCard>
          ) : (
            <EmptyResult message={incomplete ? "Enter purchase price, selling price and quantity to see your profit and margin." : "Fix the highlighted fields to see your result."} />
          )
        }
      />

      <section aria-labelledby="target-heading" className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
        <div>
          <h2 id="target-heading" className="text-base font-semibold">
            Target selling price
          </h2>
          <p className="text-sm text-muted-foreground">Find the price you need to charge to earn the profit you want, after all the costs above.</p>
        </div>
        <div className="grid items-end gap-4 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
          <NumberField label="Desired profit" suffix="%" value={target} onChange={setTarget} error={targetValidation.errors.target} />
          <SegmentedControl
            label="Profit calculated on"
            value={basis}
            onChange={setBasis}
            options={[
              { value: "margin", label: "Selling price (margin)" },
              { value: "markup", label: "Cost (markup)" },
            ]}
          />
        </div>
        {targetPrice === null ? (
          <p className="text-sm text-muted-foreground">Enter purchase price and quantity above to calculate a target price.</p>
        ) : Number.isNaN(targetPrice) ? (
          <p role="alert" className="text-sm font-medium text-destructive">
            That target can&apos;t be reached — the fees and profit together would be 100% or more of the price. Try a lower target.
          </p>
        ) : (
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 rounded-lg bg-accent p-4 text-accent-foreground">
            <p>
              <span className="text-sm">Sell at </span>
              <span className="text-2xl font-bold tabular-nums">{formatINR(targetPrice)}</span>
              <span className="text-sm"> per unit</span>
            </p>
            <p className="text-sm tabular-nums">
              Profit {formatINR(round2(targetPrice * qty - costAt(targetPrice)))} on {qty} unit{qty === 1 ? "" : "s"}
            </p>
          </div>
        )}
      </section>
    </div>
  );

  function costAt(price: number) {
    if (!costValidation.ok) return 0;
    return calculateProfit({ ...costValidation.data, sellingPrice: price }).totalCost;
  }
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;
