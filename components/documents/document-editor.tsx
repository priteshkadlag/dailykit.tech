"use client";

import type { DocumentTotals, LineTotals } from "@/lib/calculations/document";
import Link from "next/link";
import { DOC_LABEL } from "@/lib/documents/model";
import { businessDefaultsStore } from "@/lib/documents/store";
import {
  INVOICE_STATUSES,
  QUOTATION_STATUSES,
  STATUS_LABEL,
  TEMPLATES_FOR,
  type BusinessDocument,
  type DocStatus,
  type TemplateId,
} from "@/lib/documents/types";
import { formatINR, formatNumber } from "@/lib/format";
import { CheckboxField, DateField, SegmentedControl, SelectField, TextAreaField, TextField } from "@/components/shared/form-fields";
import { LineItemsEditor } from "./line-items-editor";
import { LogoUpload } from "./logo-upload";

const TEMPLATE_LABEL: Record<TemplateId, string> = {
  classic: "Classic",
  modern: "Modern",
  minimal: "Minimal",
  professional: "Professional",
  corporate: "Corporate",
};

interface DocumentEditorProps {
  doc: BusinessDocument;
  totals: DocumentTotals;
  lineTotals: Map<string, LineTotals>;
  errors: Record<string, string>;
  warnings: Record<string, string>;
  onChange: (update: (doc: BusinessDocument) => BusinessDocument) => void;
}

function Section({ title, description, children }: { title: string; description?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:p-6">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function DocumentEditor({ doc, totals, lineTotals, errors, warnings, onChange }: DocumentEditorProps) {
  const label = DOC_LABEL[doc.type];
  const gst = doc.taxMode === "gst";
  const set = <K extends keyof BusinessDocument>(key: K) => (value: BusinessDocument[K]) => onChange((d) => ({ ...d, [key]: value }));
  const setSeller = (key: keyof BusinessDocument["seller"]) => (value: string) => onChange((d) => ({ ...d, seller: { ...d.seller, [key]: value } }));
  const setCustomer = (key: keyof BusinessDocument["customer"]) => (value: string) => onChange((d) => ({ ...d, customer: { ...d.customer, [key]: value } }));
  const setBank = (key: keyof BusinessDocument["bank"]) => (value: string) => onChange((d) => ({ ...d, bank: { ...d.bank, [key]: value } }));
  const issue = (field: string) => errors[field] ?? warnings[field];
  const statuses = doc.type === "invoice" ? INVOICE_STATUSES : QUOTATION_STATUSES;

  return (
    <div className="space-y-4">
      <Section title={`${label.singular} details`}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TextField label={`${label.singular} number`} value={doc.number} onChange={set("number")} error={errors.number} />
          <DateField label={`${label.singular} date`} value={doc.date} onChange={set("date")} error={errors.date} />
          <DateField label={label.dueLabel} value={doc.dueDate} onChange={set("dueDate")} error={errors.dueDate} />
          <SelectField
            label="Status"
            value={doc.status as DocStatus}
            onChange={set("status")}
            options={statuses.map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
          />
          <SelectField
            label="Template"
            value={doc.template}
            onChange={set("template")}
            options={TEMPLATES_FOR[doc.type].map((t) => ({ value: t, label: TEMPLATE_LABEL[t] }))}
          />
        </div>
        <div className="grid gap-4 2xl:grid-cols-2">
          <SegmentedControl
            label="Tax"
            value={doc.taxMode}
            onChange={set("taxMode")}
            options={[
              { value: "gst", label: `GST ${label.singular.toLowerCase()}` },
              { value: "none", label: "Without GST" },
            ]}
          />
          {gst && (
            <SegmentedControl
              label="Type of supply"
              value={doc.supply}
              onChange={set("supply")}
              options={[
                { value: "intra", label: "Same state (CGST+SGST)" },
                { value: "inter", label: "Other state (IGST)" },
              ]}
            />
          )}
        </div>
        {gst && (
          <TextField
            label="Place of supply"
            value={doc.placeOfSupply}
            onChange={set("placeOfSupply")}
            placeholder="e.g. 27 - Maharashtra"
            hint="The customer's state. Required on GST invoices."
          />
        )}
      </Section>

      <Section
        title="Your business"
        description={
          businessDefaultsStore.mode() === "cloud" ? (
            <>
              Filled in from your{" "}
              <Link href="/dashboard/business-profile" className="font-medium text-primary hover:underline">
                business profile
              </Link>
              . Changes here apply to this document only.
            </>
          ) : (
            "Saved on this device and filled in automatically next time."
          )
        }
      >
        <LogoUpload value={doc.seller.logo} onChange={setSeller("logo")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Business name" value={doc.seller.name} onChange={setSeller("name")} error={errors["seller.name"]} autoComplete="organization" />
          <TextField label="GSTIN" value={doc.seller.gstin} onChange={setSeller("gstin")} error={issue("seller.gstin")} uppercase maxLength={15} placeholder="15-character GSTIN" />
          <TextField label="Phone" type="tel" value={doc.seller.phone} onChange={setSeller("phone")} autoComplete="tel" />
          <TextField label="Email" type="email" value={doc.seller.email} onChange={setSeller("email")} autoComplete="email" />
          <TextField label="PAN" value={doc.seller.pan} onChange={setSeller("pan")} uppercase maxLength={10} />
        </div>
        <TextAreaField label="Address" value={doc.seller.address} onChange={setSeller("address")} rows={2} maxLength={500} />
      </Section>

      <Section title={doc.type === "invoice" ? "Bill to" : "Prepared for"}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Customer name" value={doc.customer.name} onChange={setCustomer("name")} error={errors["customer.name"]} />
          <TextField label="Customer GSTIN" value={doc.customer.gstin} onChange={setCustomer("gstin")} error={issue("customer.gstin")} uppercase maxLength={15} hint="Optional — for B2B invoices" />
          <TextField label="Phone" type="tel" value={doc.customer.phone} onChange={setCustomer("phone")} />
          <TextField label="Email" type="email" value={doc.customer.email} onChange={setCustomer("email")} />
        </div>
        <TextAreaField label="Address" value={doc.customer.address} onChange={setCustomer("address")} rows={2} maxLength={500} />
      </Section>

      <Section title="Items">
        <LineItemsEditor items={doc.items} lineTotals={lineTotals} gst={gst} errors={errors} onChange={set("items")} />
        <dl className="ml-auto max-w-sm space-y-1.5 rounded-lg bg-muted/50 p-4 text-sm tabular-nums">
          <Row label="Subtotal" value={formatINR(totals.subtotal)} />
          {totals.discount > 0 && <Row label="Discount" value={`− ${formatINR(totals.discount)}`} />}
          {gst && <Row label="Taxable value" value={formatINR(totals.taxable)} />}
          {gst && doc.supply === "intra" && (
            <>
              <Row label="CGST" value={formatINR(totals.cgst)} />
              <Row label="SGST" value={formatINR(totals.sgst)} />
            </>
          )}
          {gst && doc.supply === "inter" && <Row label="IGST" value={formatINR(totals.igst)} />}
          {totals.roundOff !== 0 && <Row label="Round off" value={`${totals.roundOff > 0 ? "+" : "−"} ${formatNumber(Math.abs(totals.roundOff))}`} />}
          <div className="flex justify-between border-t pt-2 text-base font-bold">
            <dt>Grand total</dt>
            <dd>{formatINR(totals.grandTotal)}</dd>
          </div>
        </dl>
        <CheckboxField label="Round off grand total to the nearest rupee" checked={doc.roundOff} onChange={set("roundOff")} className="justify-end" />
      </Section>

      <Section title="Payment details" description={doc.type === "invoice" ? "Adding a UPI ID prints a scan-to-pay QR code on unpaid invoices." : undefined}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Account holder name" value={doc.bank.accountName} onChange={setBank("accountName")} />
          <TextField label="Bank name" value={doc.bank.bankName} onChange={setBank("bankName")} />
          <TextField label="Account number" value={doc.bank.accountNumber} onChange={setBank("accountNumber")} inputMode="numeric" />
          <TextField label="IFSC" value={doc.bank.ifsc} onChange={setBank("ifsc")} error={issue("bank.ifsc")} uppercase maxLength={11} />
          <TextField label="UPI ID" value={doc.bank.upiId} onChange={setBank("upiId")} error={issue("bank.upiId")} placeholder="yourname@okbank" className="sm:col-span-2" />
        </div>
      </Section>

      <Section title="Notes & terms">
        <TextAreaField label="Notes" value={doc.notes} onChange={set("notes")} rows={2} maxLength={2000} />
        <TextAreaField label="Terms & conditions" value={doc.terms} onChange={set("terms")} rows={3} maxLength={2000} />
      </Section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
