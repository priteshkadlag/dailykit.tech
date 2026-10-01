"use client";

import { useState } from "react";
import { z } from "zod";
import { calculateGst, GST_RATES, type GstMode, type SupplyType } from "@/lib/calculations/gst";
import { formatINR, formatPercent } from "@/lib/format";
import { useLocationHash } from "@/lib/hooks/use-client-values";
import { downloadReportPdf, pdfAmount } from "@/lib/pdf/report";
import { numberString, validateInputs } from "@/lib/validation/fields";
import { ChipPicker, NumberField, SegmentedControl } from "@/components/shared/form-fields";
import { CopyButton, DownloadPdfButton, ResetButton } from "@/components/shared/result-actions";
import { CalculatorLayout, EmptyResult, InputCard, ResultCard, ResultRows } from "@/components/shared/result-card";

const schema = z.object({
  amount: numberString({ min: 0, max: 1e12, exclusiveMin: true }),
  rate: numberString({ min: 0, max: 100 }),
});

const DEFAULTS = { amount: "", rate: "18" };

export function GstCalculator() {
  const hash = useLocationHash();
  const [modeOverride, setModeOverride] = useState<GstMode | null>(null);
  const mode: GstMode = modeOverride ?? (hash === "inclusive" ? "inclusive" : "exclusive");
  const [supply, setSupply] = useState<SupplyType>("intra");
  const [values, setValues] = useState(DEFAULTS);

  const validation = validateInputs(schema, values);
  const result = validation.ok ? calculateGst({ ...validation.data, mode, supply }) : null;
  const rate = validation.ok ? validation.data.rate : 0;

  const summary = result
    ? [
        `GST ${mode === "exclusive" ? "Exclusive" : "Inclusive"} @ ${formatPercent(rate)}`,
        `Base amount: ${formatINR(result.baseAmount)}`,
        supply === "intra"
          ? `CGST (${formatPercent(result.cgstRate)}): ${formatINR(result.cgst)}\nSGST (${formatPercent(result.sgstRate)}): ${formatINR(result.sgst)}`
          : `IGST (${formatPercent(result.igstRate)}): ${formatINR(result.igst)}`,
        `Total GST: ${formatINR(result.gstAmount)}`,
        `Final amount: ${formatINR(result.totalAmount)}`,
      ].join("\n")
    : "";

  return (
    <CalculatorLayout
      inputs={
        <InputCard>
          <SegmentedControl
            label="Calculation type"
            value={mode}
            onChange={setModeOverride}
            options={[
              { value: "exclusive", label: "Add GST (Exclusive)" },
              { value: "inclusive", label: "Remove GST (Inclusive)" },
            ]}
          />
          <NumberField
            label={mode === "exclusive" ? "Amount before GST" : "Amount including GST"}
            prefix="₹"
            placeholder="e.g. 10,000"
            value={values.amount}
            onChange={(amount) => setValues((v) => ({ ...v, amount }))}
            error={validation.errors.amount}
          />
          <div className="space-y-3">
            <NumberField
              label="GST rate"
              suffix="%"
              value={values.rate}
              onChange={(rate) => setValues((v) => ({ ...v, rate }))}
              error={validation.errors.rate}
            />
            <ChipPicker
              label="Common GST rates"
              options={GST_RATES.map(String)}
              value={values.rate}
              onSelect={(rate) => setValues((v) => ({ ...v, rate }))}
              format={(r) => `${r}%`}
            />
          </div>
          <SegmentedControl
            label="Type of supply"
            value={supply}
            onChange={setSupply}
            options={[
              { value: "intra", label: "Within state (CGST + SGST)" },
              { value: "inter", label: "Other state (IGST)" },
            ]}
          />
        </InputCard>
      }
      result={
        result ? (
          <ResultCard
            highlightLabel={mode === "exclusive" ? "Total amount (incl. GST)" : "Base amount (excl. GST)"}
            highlightValue={formatINR(mode === "exclusive" ? result.totalAmount : result.baseAmount)}
            highlightCaption={`GST @ ${formatPercent(rate)} = ${formatINR(result.gstAmount)}`}
            actions={
              <>
                <CopyButton text={summary} />
                <DownloadPdfButton
                  label="Download result"
                  onDownload={() =>
                    downloadReportPdf({
                      title: "GST Calculation",
                      fileName: "gst-calculation",
                      sections: [
                        {
                          rows: [
                            ["Calculation type", mode === "exclusive" ? "GST Exclusive (added)" : "GST Inclusive (removed)"],
                            ["Type of supply", supply === "intra" ? "Intra-state" : "Inter-state"],
                            ["GST rate", formatPercent(rate)],
                            ["Base amount", pdfAmount(result.baseAmount)],
                            ...(supply === "intra"
                              ? ([
                                  [`CGST @ ${formatPercent(result.cgstRate)}`, pdfAmount(result.cgst)],
                                  [`SGST @ ${formatPercent(result.sgstRate)}`, pdfAmount(result.sgst)],
                                ] as [string, string][])
                              : ([[`IGST @ ${formatPercent(result.igstRate)}`, pdfAmount(result.igst)]] as [string, string][])),
                            ["Total GST", pdfAmount(result.gstAmount)],
                            ["Final amount", pdfAmount(result.totalAmount)],
                          ],
                        },
                      ],
                    })
                  }
                />
                <ResetButton onReset={() => setValues(DEFAULTS)} />
              </>
            }
          >
            <ResultRows
              rows={[
                { label: "Base amount", value: formatINR(result.baseAmount) },
                ...(supply === "intra"
                  ? [
                      { label: `CGST @ ${formatPercent(result.cgstRate)}`, value: formatINR(result.cgst), sub: true },
                      { label: `SGST @ ${formatPercent(result.sgstRate)}`, value: formatINR(result.sgst), sub: true },
                    ]
                  : [{ label: `IGST @ ${formatPercent(result.igstRate)}`, value: formatINR(result.igst), sub: true }]),
                { label: "Total GST", value: formatINR(result.gstAmount) },
                { label: "Final amount", value: formatINR(result.totalAmount), emphasis: true },
              ]}
            />
          </ResultCard>
        ) : (
          <EmptyResult
            message={
              mode === "exclusive"
                ? "Enter an amount to add GST and see the CGST, SGST or IGST breakup."
                : "Enter a GST-inclusive amount to find the base price and tax included in it."
            }
          />
        )
      }
    />
  );
}
