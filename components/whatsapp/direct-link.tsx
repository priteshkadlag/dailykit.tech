"use client";

import { useState, useSyncExternalStore } from "react";
import { ExternalLink } from "lucide-react";
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { QrSvg } from "@/components/documents/upi-qr";
import { SelectField, TextAreaField, TextField } from "@/components/shared/form-fields";
import { CopyButton } from "@/components/shared/result-actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PINNED: CountryCode[] = ["IN", "AE", "US", "GB", "SA", "QA", "OM", "KW", "SG", "AU", "CA", "NP"];
type Option = { value: CountryCode; label: string };
let optionsCache: Option[] | null = null;
// Country names come from the browser (Intl.DisplayNames), which can differ from the server, so they load on the client.
function countryOptions(): Option[] {
  if (optionsCache) return optionsCache;
  const names = new Intl.DisplayNames(["en"], { type: "region" });
  const option = (c: CountryCode): Option => ({ value: c, label: `${names.of(c) ?? c} (+${getCountryCallingCode(c)})` });
  const rest = getCountries().filter((c) => !PINNED.includes(c)).map(option).sort((a, b) => a.label.localeCompare(b.label));
  return (optionsCache = [...PINNED.map(option), ...rest]);
}
const SERVER_OPTIONS: Option[] = [{ value: "IN", label: "India (+91)" }];
const serverOptions = () => SERVER_OPTIONS;
const noopSubscribe = () => () => {};

/** Opens a WhatsApp chat with any number without saving it as a contact, via a wa.me link. */
export function WhatsappDirectLink() {
  const [country, setCountry] = useState<CountryCode>("IN");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const options = useSyncExternalStore(noopSubscribe, countryOptions, serverOptions);

  const parsed = phone.trim() ? parsePhoneNumberFromString(phone, country) : undefined;
  const valid = !!parsed?.isValid();
  const countryName = options.find((o) => o.value === country)?.label.split(" (")[0] ?? country;
  const error = phone.trim() && !valid ? `That isn't a valid ${countryName} phone number. For another country, start with + and its country code.` : undefined;
  const link = valid ? `https://wa.me/${parsed!.number.slice(1)}${message.trim() ? `?text=${encodeURIComponent(message.trim())}` : ""}` : "";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6" aria-label="Number and message">
        <h2 className="font-semibold">Who do you want to message?</h2>
        <SelectField label="Country" value={country} onChange={(v) => setCountry(v as CountryCode)} options={options} />
        <TextField label="Phone number" type="tel" inputMode="tel" value={phone} onChange={setPhone} placeholder="98200 12345" error={error} hint="Spaces, dashes and a leading 0 are fine. A number starting with + uses its own country code." />
        <TextAreaField label="Message (optional)" value={message} onChange={setMessage} rows={4} placeholder="Hi! I got your number from…" hint="Pre-fills the chat; you can still edit it before sending." />
      </section>
      <section className="space-y-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6" aria-label="Your link" aria-live="polite">
        <h2 className="font-semibold">Your WhatsApp link</h2>
        {valid ? (
          <>
            <p className="text-sm text-muted-foreground">Chat with <span className="font-medium text-foreground">{parsed!.formatInternational()}</span></p>
            <p className="break-all rounded-lg bg-muted px-3 py-2 font-mono text-sm">{link}</p>
            <div className="flex flex-wrap gap-2">
              <a href={link} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ size: "lg" }), "bg-[#25D366] text-white hover:bg-[#1ebe5b]")}><ExternalLink /> Open chat</a>
              <CopyButton text={link} label="Copy link" saveable={false} />
            </div>
            <div className="flex flex-col items-center gap-2 rounded-lg border p-4">
              <QrSvg value={link} size={180} label="QR code for the WhatsApp chat link" />
              <p className="text-xs text-muted-foreground">Scan with a phone camera to open the chat</p>
            </div>
          </>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">Enter a phone number to create a click-to-chat link. You don&apos;t need to save the number to your contacts.</p>
        )}
        <p className="text-xs text-muted-foreground">The link is built in your browser; nothing is sent to us. The person must have a WhatsApp account on that number.</p>
      </section>
    </div>
  );
}
