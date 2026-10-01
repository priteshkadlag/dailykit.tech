"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

function FieldShell({ id, label, hint, error, children, className }: FieldShellProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-msg`} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-msg`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const inputClass = "h-11 bg-background text-base md:text-base";

interface NumberFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

/** Numeric input with optional ₹ / % adornments. Uses a text input with a decimal keypad so commas can be pasted. */
export function NumberField({ label, value, onChange, error, hint, prefix, suffix, placeholder, className, autoFocus }: NumberFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className}>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
            {prefix}
          </span>
        )}
        <Input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          autoFocus={autoFocus}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${id}-msg` : undefined}
          className={cn(inputClass, prefix && "pl-8", suffix && "pr-12")}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </FieldShell>
  );
}

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  max?: string;
  className?: string;
}

export function DateField({ label, value, onChange, error, hint, max, className }: DateFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className}>
      <Input
        id={id}
        type="date"
        value={value}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-msg` : undefined}
        className={inputClass}
      />
    </FieldShell>
  );
}

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  hideLabel?: boolean;
}

/** Touch-friendly single choice (radio group) for modes and presets. */
export function SegmentedControl<T extends string>({ label, value, options, onChange, className, hideLabel }: SegmentedControlProps<T>) {
  const id = useId();
  return (
    <div className={cn("space-y-1.5", className)}>
      <div id={id} className={cn("text-sm font-medium", hideLabel && "sr-only")}>
        {label}
      </div>
      <div role="radiogroup" aria-labelledby={id} className="flex flex-wrap gap-1.5 rounded-lg bg-muted p-1">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={cn(
                "min-h-10 flex-1 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected ? "bg-card text-foreground shadow-sm ring-1 ring-foreground/10" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Quick-pick chips, e.g. GST slabs. Selecting a chip sets the linked input's value. */
export function ChipPicker({
  label,
  options,
  value,
  onSelect,
  format = (v) => v,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onSelect: (value: string) => void;
  format?: (value: string) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map((option) => {
        const selected = option === value.trim();
        return (
          <button
            key={option}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(option)}
            className={cn(
              "min-h-9 rounded-full border px-3.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected
                ? "border-transparent bg-brand text-white shadow-sm"
                : "border-border bg-background hover:border-primary/40 hover:bg-accent",
            )}
          >
            {format(option)}
          </button>
        );
      })}
    </div>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "password";
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  maxLength?: number;
  uppercase?: boolean;
  className?: string;
}

export function TextField({ label, value, onChange, error, hint, placeholder, type = "text", inputMode, autoComplete = "off", maxLength, uppercase, className }: TextFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className}>
      <Input
        id={id}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        maxLength={maxLength}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-msg` : undefined}
        className={inputClass}
      />
    </FieldShell>
  );
}

export function TextAreaField({ label, value, onChange, error, hint, placeholder, rows = 3, maxLength, className }: Omit<TextFieldProps, "type" | "inputMode" | "uppercase" | "autoComplete"> & { rows?: number }) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className}>
      <textarea
        id={id}
        rows={rows}
        maxLength={maxLength}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-msg` : undefined}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
      />
    </FieldShell>
  );
}

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
  hint?: string;
  error?: string;
  className?: string;
}

/** Native select: best-in-class on mobile (system picker) and fully accessible. */
export function SelectField<T extends string>({ label, value, onChange, options, hint, error, className }: SelectFieldProps<T>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        aria-invalid={error ? true : undefined}
        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function CheckboxField({ label, checked, onChange, hint, className }: { label: string; checked: boolean; onChange: (checked: boolean) => void; hint?: string; className?: string }) {
  const id = useId();
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-5 shrink-0 accent-primary"
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
      <div>
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {hint && (
          <p id={`${id}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
