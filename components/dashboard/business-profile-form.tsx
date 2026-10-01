"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { isValidGstin } from "@/lib/calculations/document";
import { businessDefaultsStore } from "@/lib/documents/store";
import type { BusinessDefaults } from "@/lib/documents/types";
import { isValidUpiId } from "@/lib/upi";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { LogoUpload } from "@/components/documents/logo-upload";
import { TextAreaField, TextField } from "@/components/shared/form-fields";
import { showSaveError } from "@/components/shared/save-error";

const EMPTY: BusinessDefaults = {
  id: "default",
  seller: { name: "", address: "", phone: "", email: "", gstin: "", pan: "", logo: "" },
  bank: { accountName: "", bankName: "", accountNumber: "", ifsc: "", upiId: "" },
  terms: { invoice: "", quotation: "" },
};

const PAN = /^[A-Z]{5}\d{4}[A-Z]$/;
const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function problems(p: BusinessDefaults) {
  const e: Record<string, string> = {};
  if (!p.seller.name.trim()) e.name = "Add your business name";
  if (p.seller.gstin && !isValidGstin(p.seller.gstin)) e.gstin = "Enter a valid 15-character GSTIN, e.g. 27ABCDE1234F1Z5";
  if (p.seller.pan && !PAN.test(p.seller.pan.trim())) e.pan = "PAN has 10 characters, e.g. ABCDE1234F";
  if (p.seller.email && !EMAIL.test(p.seller.email.trim())) e.email = "Enter a valid email";
  if (p.bank.ifsc && !IFSC.test(p.bank.ifsc.trim())) e.ifsc = "IFSC has 11 characters, e.g. HDFC0001234";
  if (p.bank.upiId && !isValidUpiId(p.bank.upiId)) e.upiId = "UPI ID should look like name@bank";
  if (p.bank.accountNumber && !/^\d{9,18}$/.test(p.bank.accountNumber.trim())) e.accountNumber = "Account numbers are 9–18 digits";
  return e;
}

/** The Business Profile: filled into every new invoice and quotation. */
export function BusinessProfileForm() {
  const [profile, setProfile] = useState<BusinessDefaults>(() => businessDefaultsStore.get("default") ?? EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const errors = submitted ? problems(profile) : {};

  const seller = (key: keyof BusinessDefaults["seller"]) => (value: string) => setProfile((p) => ({ ...p, seller: { ...p.seller, [key]: value } }));
  const bank = (key: keyof BusinessDefaults["bank"]) => (value: string) => setProfile((p) => ({ ...p, bank: { ...p.bank, [key]: value } }));
  const terms = (key: keyof BusinessDefaults["terms"]) => (value: string) => setProfile((p) => ({ ...p, terms: { ...p.terms, [key]: value } }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const found = problems(profile);
    if (Object.keys(found).length) {
      toast.error(Object.values(found)[0]);
      return;
    }
    setSaving(true);
    try {
      await businessDefaultsStore.upsert(profile);
      toast.success("Business profile saved. New invoices and quotations will use it.");
    } catch (error) {
      showSaveError(error);
    } finally {
      setSaving(false);
    }
  };

  const card = "space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6";

  return (
    <form onSubmit={save} noValidate className="space-y-6">
      <section aria-labelledby="bp-business" className={card}>
        <h2 id="bp-business" className="text-base font-semibold">
          Business details
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Business name" value={profile.seller.name} onChange={seller("name")} error={errors.name} maxLength={200} autoComplete="organization" />
          <TextField label="Phone" type="tel" value={profile.seller.phone} onChange={seller("phone")} maxLength={30} autoComplete="tel" />
          <TextField label="Email" type="email" value={profile.seller.email} onChange={seller("email")} error={errors.email} maxLength={120} autoComplete="email" />
          <TextField label="GSTIN" value={profile.seller.gstin} onChange={seller("gstin")} error={errors.gstin} maxLength={15} uppercase hint="Leave empty if you're not GST registered" />
          <TextField label="PAN" value={profile.seller.pan} onChange={seller("pan")} error={errors.pan} maxLength={10} uppercase />
          <TextAreaField label="Address" value={profile.seller.address} onChange={seller("address")} rows={3} maxLength={500} className="sm:col-span-2" />
        </div>
        <LogoUpload label="Logo" value={profile.seller.logo} onChange={seller("logo")} />
      </section>

      <section aria-labelledby="bp-bank" className={card}>
        <h2 id="bp-bank" className="text-base font-semibold">
          Bank & UPI
        </h2>
        <p className="-mt-2 text-sm text-muted-foreground">Printed on invoices so customers know how to pay. The UPI ID also creates a scan-to-pay QR code.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Account holder name" value={profile.bank.accountName} onChange={bank("accountName")} maxLength={200} />
          <TextField label="Bank name" value={profile.bank.bankName} onChange={bank("bankName")} maxLength={200} />
          <TextField label="Account number" value={profile.bank.accountNumber} onChange={bank("accountNumber")} error={errors.accountNumber} inputMode="numeric" maxLength={30} />
          <TextField label="IFSC" value={profile.bank.ifsc} onChange={bank("ifsc")} error={errors.ifsc} maxLength={11} uppercase />
          <TextField label="UPI ID" value={profile.bank.upiId} onChange={bank("upiId")} error={errors.upiId} placeholder="yourshop@okhdfcbank" maxLength={80} className="sm:col-span-2" />
        </div>
      </section>

      <section aria-labelledby="bp-terms" className={card}>
        <h2 id="bp-terms" className="text-base font-semibold">
          Terms & conditions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextAreaField label="Invoice terms" value={profile.terms.invoice} onChange={terms("invoice")} rows={4} maxLength={2000} placeholder="e.g. Payment due within 15 days." />
          <TextAreaField label="Quotation terms" value={profile.terms.quotation} onChange={terms("quotation")} rows={4} maxLength={2000} placeholder="e.g. Prices valid for 30 days." />
        </div>
      </section>

      <div className="sticky bottom-16 z-10 -mx-4 flex flex-wrap gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 md:bottom-0">
        <Button type="submit" className="h-11 flex-1 px-6 sm:flex-none" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" /> : <Save />} Save profile
        </Button>
        <Link href="/invoice-generator" className={cn(buttonVariants({ variant: "outline" }), "h-11 flex-1 px-4 sm:flex-none")}>
          Create an invoice
        </Link>
      </div>
    </form>
  );
}
