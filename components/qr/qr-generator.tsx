"use client";

import { useMemo, useState } from "react";
import { AtSign, Download, IndianRupee, Link, MessageCircle, Phone, TriangleAlert, Type, Wifi } from "lucide-react";
import { toast } from "sonner";
import { track } from "@/lib/analytics/client";
import { qrColorWarning } from "@/lib/color";
import { downloadBlob } from "@/lib/files/download";
import { buildQrPayload, EMPTY_QR_FIELDS, type QrFields, type QrType } from "@/lib/qr/payload";
import { ECC_LABEL, qrToPng, qrToSvg, QrTooLongError, svgDataUrl, type ErrorCorrection } from "@/lib/qr/render";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogoUpload } from "@/components/documents/logo-upload";
import { CheckboxField, NumberField, SegmentedControl, SelectField, TextAreaField, TextField } from "@/components/shared/form-fields";

const TYPES: { value: QrType; label: string; icon: typeof Link }[] = [
  { value: "url", label: "Website", icon: Link },
  { value: "upi", label: "UPI Payment", icon: IndianRupee },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { value: "wifi", label: "WiFi", icon: Wifi },
  { value: "text", label: "Text", icon: Type },
  { value: "phone", label: "Phone", icon: Phone },
  { value: "email", label: "Email", icon: AtSign },
];

const SIZES = [
  { value: "256", label: "256 px — web & WhatsApp" },
  { value: "512", label: "512 px — recommended" },
  { value: "1024", label: "1024 px — print (up to ~10 cm)" },
  { value: "2048", label: "2048 px — large print & banners" },
];

export function QrGenerator() {
  const [type, setType] = useState<QrType>("url");
  const [fields, setFields] = useState<QrFields>(EMPTY_QR_FIELDS);
  const [size, setSize] = useState("512");
  const [ecc, setEcc] = useState<ErrorCorrection>("M");
  const [foreground, setForeground] = useState("#000000");
  const [background, setBackground] = useState("#ffffff");
  const [logo, setLogo] = useState("");
  const set = <K extends keyof QrFields>(key: K) => (value: QrFields[K]) => setFields((f) => ({ ...f, [key]: value }));

  const payload = buildQrPayload(type, fields);
  const style = useMemo(() => ({ size: Number(size), ecc, foreground, background, logo }), [size, ecc, foreground, background, logo]);
  const colorWarning = qrColorWarning(foreground, background);
  const errors = payload.ok ? {} : payload.errors;

  let svg: string | null = null;
  let renderError: string | null = null;
  if (payload.ok) {
    try {
      svg = qrToSvg(payload.value, style);
    } catch (error) {
      renderError = error instanceof QrTooLongError ? error.message : "Couldn't create this QR code.";
    }
  }

  const fileBase = `qr-${type}`;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
      <div className="space-y-6">
        <section aria-label="QR code content" className="space-y-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
          <div role="radiogroup" aria-label="QR code type" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={type === value}
                onClick={() => setType(value)}
                className={cn(
                  "flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors",
                  type === value ? "border-transparent bg-brand text-white shadow-sm" : "bg-background hover:border-primary/40 hover:bg-accent",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {label}
              </button>
            ))}
          </div>

          {type === "url" && <TextField label="Website address" value={fields.url} onChange={set("url")} error={errors.url} placeholder="e.g. www.yourshop.in" inputMode="url" />}
          {type === "text" && <TextAreaField label="Text" value={fields.text} onChange={set("text")} rows={4} maxLength={1500} placeholder="Any text — shown to the person who scans" />}
          {type === "phone" && <TextField label="Phone number" type="tel" value={fields.phone} onChange={set("phone")} error={errors.phone} placeholder="98200 12345" hint="Indian numbers get +91 automatically" />}
          {type === "email" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Email address" type="email" value={fields.email} onChange={set("email")} error={errors.email} className="sm:col-span-2" />
              <TextField label="Subject (optional)" value={fields.emailSubject} onChange={set("emailSubject")} className="sm:col-span-2" />
              <TextAreaField label="Message (optional)" value={fields.emailBody} onChange={set("emailBody")} rows={3} className="sm:col-span-2" />
            </div>
          )}
          {type === "whatsapp" && (
            <div className="space-y-4">
              <TextField label="WhatsApp number" type="tel" value={fields.whatsappPhone} onChange={set("whatsappPhone")} error={errors.whatsappPhone} placeholder="98200 12345" hint="Indian numbers get +91 automatically" />
              <TextAreaField label="Pre-filled message (optional)" value={fields.whatsappMessage} onChange={set("whatsappMessage")} rows={3} maxLength={500} placeholder="Hi! I'd like to know more about…" />
            </div>
          )}
          {type === "wifi" && (
            <div className="space-y-4">
              <TextField label="Network name (SSID)" value={fields.wifiSsid} onChange={set("wifiSsid")} />
              <SegmentedControl
                label="Security"
                value={fields.wifiSecurity}
                onChange={set("wifiSecurity")}
                options={[
                  { value: "WPA", label: "WPA/WPA2" },
                  { value: "WEP", label: "WEP" },
                  { value: "nopass", label: "No password" },
                ]}
              />
              {fields.wifiSecurity !== "nopass" && <TextField label="Password" value={fields.wifiPassword} onChange={set("wifiPassword")} error={errors.wifiPassword} />}
              <CheckboxField label="Hidden network" checked={fields.wifiHidden} onChange={set("wifiHidden")} />
            </div>
          )}
          {type === "upi" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="UPI ID" value={fields.upiId} onChange={set("upiId")} error={errors.upiId} placeholder="yourname@okhdfc" className="sm:col-span-2" />
              <TextField label="Payee name" value={fields.upiName} onChange={set("upiName")} placeholder="Shown in the payment app" />
              <NumberField label="Amount (optional)" prefix="₹" value={fields.upiAmount} onChange={set("upiAmount")} error={errors.upiAmount} hint="Leave empty to let the payer enter it" />
              <TextField label="Transaction note (optional)" value={fields.upiNote} onChange={set("upiNote")} maxLength={50} className="sm:col-span-2" />
            </div>
          )}
        </section>

        <section aria-label="Customise" className="space-y-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
          <h2 className="text-base font-semibold">Customise</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Size" value={size} onChange={setSize} options={SIZES} />
            <SelectField
              label="Error correction"
              value={logo ? "H" : ecc}
              onChange={setEcc}
              options={(Object.keys(ECC_LABEL) as ErrorCorrection[]).map((e) => ({ value: e, label: ECC_LABEL[e] }))}
              hint={logo ? "Set to High automatically because a logo covers part of the code." : "Higher levels still scan when the code is scratched or partly covered."}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ColorField label="Code colour" value={foreground} onChange={setForeground} />
            <ColorField label="Background" value={background} onChange={setBackground} />
          </div>
          {colorWarning && (
            <p role="alert" className="flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> {colorWarning}
            </p>
          )}
          <LogoUpload label="Logo in the centre (optional)" value={logo} onChange={setLogo} />
        </section>
      </div>

      <aside aria-label="QR code preview" className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 lg:sticky lg:top-32">
        <div className="mx-auto flex aspect-square w-full max-w-72 items-center justify-center overflow-hidden rounded-lg bg-muted/40">
          {svg ? (
            // eslint-disable-next-line @next/next/no-img-element -- generated SVG data URL
            <img src={svgDataUrl(svg)} alt="Your QR code" className="size-full" />
          ) : (
            <p className="max-w-48 p-4 text-center text-sm text-muted-foreground">{renderError ?? (payload.ok ? "" : payload.empty ? "Fill in the details to see your QR code." : "Fix the highlighted field to create the code.")}</p>
          )}
        </div>
        {svg && payload.ok && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Button
                className="h-11"
                onClick={async () => {
                  try {
                    downloadBlob(await qrToPng(payload.value, style), `${fileBase}.png`);
                    toast.success("QR code downloaded as PNG.");
                    track("qr_generated");
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Couldn't create the PNG.");
                  }
                }}
              >
                <Download /> Download PNG
              </Button>
              <Button
                variant="outline"
                className="h-11"
                onClick={() => {
                  downloadBlob(new Blob([svg], { type: "image/svg+xml" }), `${fileBase}.svg`);
                  toast.success("QR code downloaded as SVG.");
                  track("qr_generated");
                }}
              >
                <Download /> Download SVG
              </Button>
            </div>
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer select-none">What this code contains</summary>
              <code className="mt-2 block rounded bg-muted p-2 break-all">{payload.value}</code>
            </details>
            <p className="text-xs text-muted-foreground">Always test-scan with your phone before printing.</p>
          </>
        )}
      </aside>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="space-y-1.5">
      <span className="block text-sm font-medium">{label}</span>
      <span className="flex h-11 items-center gap-2 rounded-lg border bg-background px-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent" aria-label={label} />
        <span className="font-mono text-sm uppercase">{value}</span>
      </span>
    </label>
  );
}
