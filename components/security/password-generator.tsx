"use client";

import { useState } from "react";
import { Check, Copy, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  CHARSETS,
  generatePassword,
  MAX_LENGTH,
  MIN_LENGTH,
  passwordEntropy,
  strengthOf,
  type CharsetKey,
  type PasswordOptions,
  type Strength,
} from "@/lib/security/password";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/shared/form-fields";

const SET_LABEL: Record<CharsetKey, string> = {
  uppercase: "Uppercase (A–Z)",
  lowercase: "Lowercase (a–z)",
  numbers: "Numbers (0–9)",
  symbols: "Symbols (!@#$…)",
};

const STRENGTH: Record<Strength, { label: string; bar: string; text: string; width: string }> = {
  weak: { label: "Weak", bar: "bg-red-500", text: "text-red-700", width: "w-1/3" },
  medium: { label: "Medium", bar: "bg-amber-500", text: "text-amber-700", width: "w-2/3" },
  strong: { label: "Strong", bar: "bg-emerald-600", text: "text-emerald-700", width: "w-full" },
};

const DEFAULTS: PasswordOptions = { length: 16, sets: { uppercase: true, lowercase: true, numbers: true, symbols: true }, excludeAmbiguous: false };

/**
 * Rendered client-only (see the page): passwords come from the browser's crypto.getRandomValues,
 * are never sent to a server, never saved, and never appear in server-rendered HTML.
 */
export function PasswordGenerator() {
  const [options, setOptions] = useState<PasswordOptions>(DEFAULTS);
  const [password, setPassword] = useState(() => generatePassword(DEFAULTS));
  const [copied, setCopied] = useState(false);

  const bits = passwordEntropy(options);
  const strength = STRENGTH[strengthOf(bits)];
  const noneSelected = !Object.values(options.sets).some(Boolean);

  /** Options change → a fresh password with those options, straight away. */
  const update = (next: PasswordOptions) => {
    setOptions(next);
    setCopied(false);
    if (Object.values(next.sets).some(Boolean)) setPassword(generatePassword(next));
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      toast.success("Password copied. Paste it somewhere safe, like a password manager.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select the password and copy it manually.");
    }
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <section aria-label="Generated password" className="space-y-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
        <div className="rounded-lg bg-muted/60 p-4">
          <output aria-live="polite" aria-label="Generated password" className="block min-h-9 font-mono text-xl break-all select-all sm:text-2xl">
            {noneSelected ? <span className="font-sans text-base text-muted-foreground">Select at least one character type.</span> : <ColoredPassword value={password} />}
          </output>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">
              Strength: <span className={strength.text}>{strength.label}</span>
            </span>
            <span className="text-muted-foreground tabular-nums">{Math.round(bits)} bits of entropy</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
            <div className={cn("h-full rounded-full transition-all", strength.bar, strength.width)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button className="h-12 text-base" onClick={copy} disabled={noneSelected}>
            {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            variant="outline"
            className="h-12 text-base"
            disabled={noneSelected}
            onClick={() => {
              setPassword(generatePassword(options));
              setCopied(false);
            }}
          >
            <RefreshCw /> Generate
          </Button>
        </div>

        <p className="flex gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
          Created on your device with a cryptographically secure random generator. Never sent or stored.
        </p>
      </section>

      <aside aria-label="Password options" className="space-y-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="pw-length" className="text-sm font-medium">
              Length
            </label>
            <input
              type="number"
              min={MIN_LENGTH}
              max={MAX_LENGTH}
              value={options.length}
              aria-label="Password length"
              onChange={(e) => {
                const n = Math.round(Number(e.target.value));
                if (Number.isFinite(n)) update({ ...options, length: Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, n)) });
              }}
              className="h-10 w-20 rounded-lg border bg-background px-2 text-center text-base tabular-nums"
            />
          </div>
          <input
            id="pw-length"
            type="range"
            min={MIN_LENGTH}
            max={64}
            value={Math.min(options.length, 64)}
            onChange={(e) => update({ ...options, length: Number(e.target.value) })}
            className="w-full accent-primary"
          />
          <p className="text-xs text-muted-foreground">16+ characters is recommended for important accounts.</p>
        </div>
        <fieldset className="space-y-3">
          <legend className="mb-2 text-sm font-medium">Include</legend>
          {(Object.keys(CHARSETS) as CharsetKey[]).map((key) => (
            <CheckboxField key={key} label={SET_LABEL[key]} checked={options.sets[key]} onChange={(checked) => update({ ...options, sets: { ...options.sets, [key]: checked } })} />
          ))}
        </fieldset>
        <CheckboxField
          label="Avoid look-alike characters"
          hint="Leaves out I, l, 1, O, 0 and o — easier to read and type"
          checked={options.excludeAmbiguous}
          onChange={(excludeAmbiguous) => update({ ...options, excludeAmbiguous })}
        />
      </aside>
    </div>
  );
}

/** Digits and symbols get their own colour so similar-looking characters are easier to tell apart. */
function ColoredPassword({ value }: { value: string }) {
  return (
    <>
      {[...value].map((c, i) => (
        <span key={i} className={/[0-9]/.test(c) ? "text-sky-700" : /[A-Za-z]/.test(c) ? "" : "text-rose-700"}>
          {c}
        </span>
      ))}
    </>
  );
}
