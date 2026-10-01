"use client";

import { useState } from "react";
import { Check, Copy, RotateCcw, Send } from "lucide-react";
import { toast } from "sonner";
import { formatPhone, normalizePhone } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { FESTIVALS, TEMPLATES, whatsappUrl, type FestivalId, type FieldKey, type MessageFields } from "@/lib/whatsapp/templates";
import { Button, buttonVariants } from "@/components/ui/button";
import { DateField, NumberField, SelectField, TextField } from "@/components/shared/form-fields";

const EMPTY: MessageFields = { customerName: "", businessName: "", product: "", amount: "", orderNumber: "", date: "", time: "", festival: "diwali" };

// Order in which fields appear in the form, whatever the template.
const FIELD_ORDER: FieldKey[] = ["customerName", "product", "orderNumber", "amount", "date", "time", "businessName"];

export function WhatsappGenerator() {
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const [fields, setFields] = useState<MessageFields>(EMPTY);
  const [phone, setPhone] = useState("");
  // null = follow the template; a string = the user has edited the message by hand.
  const [edited, setEdited] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const template = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0];
  const generated = template.render(fields);
  const message = edited ?? generated;
  const phoneDigits = phone.trim() ? normalizePhone(phone) : null;
  const phoneError = phone.trim() && !phoneDigits ? "Enter a valid mobile number" : undefined;
  const set = (key: keyof MessageFields) => (value: string) => setFields((f) => ({ ...f, [key]: value }));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success("Message copied.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select the message and copy it manually.");
    }
  };

  const field = (key: FieldKey) => {
    const label = template.fields[key];
    if (!label) return null;
    if (key === "amount") return <NumberField key={key} label={label} prefix="₹" value={fields.amount} onChange={set("amount")} />;
    if (key === "date") return <DateField key={key} label={label} value={fields.date} onChange={set("date")} />;
    if (key === "time")
      return (
        <label key={key} className="space-y-1.5">
          <span className="block text-sm font-medium">{label}</span>
          <input type="time" value={fields.time} onChange={(e) => set("time")(e.target.value)} className="h-11 w-full rounded-lg border bg-background px-3 text-base" />
        </label>
      );
    return <TextField key={key} label={label} value={fields[key]} onChange={set(key)} />;
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      <div className="space-y-6">
        <section aria-label="Message type" className="space-y-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
          <h2 className="text-base font-semibold">Choose a message</h2>
          <div role="radiogroup" aria-label="Template" className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={t.id === templateId}
                onClick={() => {
                  setTemplateId(t.id);
                  setEdited(null);
                }}
                className={cn(
                  "min-h-10 rounded-full border px-4 text-sm font-medium transition-colors",
                  t.id === templateId ? "border-transparent bg-brand text-white shadow-sm" : "bg-background hover:border-primary/40 hover:bg-accent",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>

        <section aria-label="Details" className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
          <h2 className="text-base font-semibold">Details</h2>
          {template.id === "festival" && (
            <SelectField
              label="Festival"
              value={fields.festival}
              onChange={(v: FestivalId) => setFields((f) => ({ ...f, festival: v }))}
              options={(Object.keys(FESTIVALS) as FestivalId[]).map((id) => ({ value: id, label: FESTIVALS[id].label }))}
            />
          )}
          <div className="grid gap-4 sm:grid-cols-2">{FIELD_ORDER.map(field)}</div>
          <TextField
            label="Send to (WhatsApp number)"
            type="tel"
            value={phone}
            onChange={setPhone}
            error={phoneError}
            placeholder="98200 12345"
            hint={phoneDigits ? `Opens a chat with ${formatPhone(phoneDigits)}` : "Optional — leave empty to pick a contact in WhatsApp"}
          />
        </section>
      </div>

      <aside aria-label="Message preview" className="space-y-4 lg:sticky lg:top-32">
        <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
          <div className="bg-[#075e54] px-4 py-3 text-sm font-medium text-white">{phoneDigits ? formatPhone(phoneDigits) : "WhatsApp preview"}</div>
          <div className="bg-[#efeae2] p-4">
            <div className="ml-auto max-w-[92%] rounded-lg rounded-tr-none bg-[#d9fdd3] p-1 shadow-sm">
              <label htmlFor="wa-message" className="sr-only">
                Message
              </label>
              <textarea
                id="wa-message"
                value={message}
                onChange={(e) => setEdited(e.target.value)}
                rows={Math.min(16, Math.max(6, message.split("\n").length + 1))}
                className="w-full resize-none rounded bg-transparent p-2 text-[15px] leading-snug text-[#111b21] outline-none focus-visible:ring-2 focus-visible:ring-[#075e54]/40"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{edited !== null ? "Edited by you" : "Tap the message to edit it"}</span>
          <span className="tabular-nums">{message.length} characters</span>
        </div>
        {edited !== null && edited !== generated && (
          <Button variant="ghost" className="h-9" onClick={() => setEdited(null)}>
            <RotateCcw /> Reset to template (applies your latest details)
          </Button>
        )}
        <div className="grid grid-cols-2 gap-2">
          {message.trim() && !phoneError ? (
            <a
              href={whatsappUrl(message, phoneDigits)}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants(), "h-12 bg-[#128c7e] text-base text-white hover:bg-[#0f7a6e]")}
            >
              <Send /> Open WhatsApp
            </a>
          ) : (
            <Button className="h-12 bg-[#128c7e] text-base text-white" disabled>
              <Send /> Open WhatsApp
            </Button>
          )}
          <Button variant="outline" className="h-12 text-base" onClick={copy} disabled={!message.trim()}>
            {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy message"}
          </Button>
        </div>
      </aside>
    </div>
  );
}
