"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { z } from "zod";
import { calculateEmi } from "@/lib/calculations/emi";
import { formatINR, formatNumber } from "@/lib/format";
import { downloadReportPdf, pdfAmount } from "@/lib/pdf/report";
import { numberString, validateInputs } from "@/lib/validation/fields";
import { NumberField, SegmentedControl } from "@/components/shared/form-fields";
import { DownloadPdfButton, ResetButton, SaveCalculationButton, ShareButton } from "@/components/shared/result-actions";
import { CalculatorLayout, EmptyResult, ErrorResult, InputCard, ResultCard, ResultRows } from "@/components/shared/result-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const chartFallback = () => <div className="h-44 animate-pulse rounded-lg bg-muted" />;
const EmiBreakupChart = dynamic(() => import("./emi-charts").then((m) => m.EmiBreakupChart), { ssr: false, loading: chartFallback });
const EmiYearlyChart = dynamic(() => import("./emi-charts").then((m) => m.EmiYearlyChart), { ssr: false, loading: chartFallback });

const MAX_MONTHS = 40 * 12;

const schema = z.object({
  principal: numberString({ min: 0, max: 1e11, exclusiveMin: true }),
  rate: numberString({ min: 0, max: 50 }),
  tenure: numberString({ min: 0, max: 480, exclusiveMin: true }),
});

type TenureUnit = "years" | "months";
const DEFAULTS = { principal: "1000000", rate: "8.5", tenure: "20" };

export function EmiCalculator() {
  const [values, setValues] = useState(DEFAULTS);
  const [unit, setUnit] = useState<TenureUnit>("years");
  const [scheduleView, setScheduleView] = useState<"yearly" | "monthly">("yearly");

  const validation = validateInputs(schema, values);
  const months = validation.ok ? Math.round(unit === "years" ? validation.data.tenure * 12 : validation.data.tenure) : 0;
  const tenureError = validation.ok && (months < 1 || months > MAX_MONTHS) ? "Tenure must be between 1 month and 40 years" : undefined;
  const result = validation.ok && !tenureError ? calculateEmi({ principal: validation.data.principal, annualRate: validation.data.rate, months }) : null;

  const set = (key: keyof typeof DEFAULTS) => (value: string) => setValues((v) => ({ ...v, [key]: value }));
  const tenureLabel = months % 12 === 0 ? `${months / 12} years` : `${months} months`;
  const shareText = result
    ? `Loan ${formatINR(result.principal, { whole: true })} at ${validation.ok ? validation.data.rate : 0}% for ${tenureLabel}: EMI ${formatINR(result.emi)}, total interest ${formatINR(result.totalInterest, { whole: true })}.`
    : "";

  return (
    <div className="space-y-6">
      <CalculatorLayout
        inputs={
          <InputCard title="Loan details">
            <NumberField label="Loan amount" prefix="₹" value={values.principal} onChange={set("principal")} error={validation.errors.principal} />
            <NumberField
              label="Interest rate (per year)"
              suffix="%"
              value={values.rate}
              onChange={set("rate")}
              error={validation.errors.rate}
              hint="Typical: home loan 8–10%, car loan 9–12%, personal loan 11–24%"
            />
            <div className="grid grid-cols-[1fr_auto] items-start gap-3">
              <NumberField
                label="Loan tenure"
                suffix={unit === "years" ? "yrs" : "mo"}
                value={values.tenure}
                onChange={set("tenure")}
                error={validation.errors.tenure ?? tenureError}
              />
              <SegmentedControl
                label="Tenure unit"
                hideLabel
                className="pt-6"
                value={unit}
                onChange={(next) => {
                  // Convert the entered tenure so switching units doesn't silently change the loan.
                  const n = Number(values.tenure);
                  if (values.tenure && Number.isFinite(n)) {
                    const converted = next === "months" ? n * 12 : n / 12;
                    setValues((v) => ({ ...v, tenure: String(Math.round(converted * 100) / 100) }));
                  }
                  setUnit(next);
                }}
                options={[
                  { value: "years", label: "Years" },
                  { value: "months", label: "Months" },
                ]}
              />
            </div>
          </InputCard>
        }
        result={
          result ? (
            <ResultCard
              highlightLabel="Monthly EMI"
              highlightValue={formatINR(result.emi)}
              highlightCaption={`for ${tenureLabel} at ${formatNumber(validation.ok ? validation.data.rate : 0)}% p.a.`}
              actions={
                <>
                  <DownloadPdfButton
                    onDownload={() =>
                      downloadReportPdf({
                        title: "Loan EMI Report",
                        fileName: "emi-report",
                        sections: [
                          {
                            rows: [
                              ["Loan amount", pdfAmount(result.principal)],
                              ["Interest rate", `${validation.ok ? validation.data.rate : 0}% per year`],
                              ["Tenure", `${tenureLabel} (${months} EMIs)`],
                              ["Monthly EMI", pdfAmount(result.emi)],
                              ["Total interest", pdfAmount(result.totalInterest)],
                              ["Total payment", pdfAmount(result.totalPayment)],
                            ],
                          },
                        ],
                        tables: [
                          {
                            heading: "Amortization schedule",
                            head: ["Month", "EMI", "Principal", "Interest", "Balance"],
                            body: result.schedule.map((r) => [r.month, pdfAmount(r.emi), pdfAmount(r.principal), pdfAmount(r.interest), pdfAmount(r.balance)]),
                          },
                        ],
                      })
                    }
                  />
                  <ShareButton title="My loan EMI" text={shareText} />
                  <SaveCalculationButton text={shareText} />
                  <ResetButton
                    onReset={() => {
                      setValues(DEFAULTS);
                      setUnit("years");
                    }}
                  />
                </>
              }
            >
              <ResultRows
                rows={[
                  { label: "Principal amount", value: formatINR(result.principal) },
                  { label: "Total interest", value: formatINR(result.totalInterest) },
                  { label: "Total payment", value: formatINR(result.totalPayment), emphasis: true },
                ]}
              />
              <div className="mt-4 border-t pt-4">
                <EmiBreakupChart principal={result.principal} interest={result.totalInterest} />
              </div>
            </ResultCard>
          ) : tenureError ? (
            <ErrorResult message={tenureError} />
          ) : (
            <EmptyResult message="Enter the loan amount, interest rate and tenure to calculate your EMI." />
          )
        }
      />

      {result && (
        <section aria-labelledby="schedule-heading" className="space-y-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="schedule-heading" className="text-base font-semibold">
              Amortization schedule
            </h2>
            <SegmentedControl
              label="Schedule view"
              hideLabel
              value={scheduleView}
              onChange={setScheduleView}
              options={[
                { value: "yearly", label: "Yearly" },
                { value: "monthly", label: "Monthly" },
              ]}
            />
          </div>
          {result.yearly.length > 1 && (
            <figure className="space-y-2">
              <figcaption className="text-sm text-muted-foreground">Principal and interest paid each year</figcaption>
              <EmiYearlyChart yearly={result.yearly} />
            </figure>
          )}
          <div className="max-h-[28rem] overflow-auto rounded-lg border">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted">
                <TableRow>
                  <TableHead>{scheduleView === "yearly" ? "Year" : "Month"}</TableHead>
                  {scheduleView === "monthly" && <TableHead className="text-right">EMI</TableHead>}
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Interest</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="tabular-nums">
                {scheduleView === "yearly"
                  ? result.yearly.map((row) => (
                      <TableRow key={row.year}>
                        <TableCell>{row.year}</TableCell>
                        <TableCell className="text-right">{formatINR(row.principal, { whole: true })}</TableCell>
                        <TableCell className="text-right">{formatINR(row.interest, { whole: true })}</TableCell>
                        <TableCell className="text-right">{formatINR(row.balance, { whole: true })}</TableCell>
                      </TableRow>
                    ))
                  : result.schedule.map((row) => (
                      <TableRow key={row.month}>
                        <TableCell>{row.month}</TableCell>
                        <TableCell className="text-right">{formatINR(row.emi)}</TableCell>
                        <TableCell className="text-right">{formatINR(row.principal)}</TableCell>
                        <TableCell className="text-right">{formatINR(row.interest)}</TableCell>
                        <TableCell className="text-right">{formatINR(row.balance)}</TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}
    </div>
  );
}
