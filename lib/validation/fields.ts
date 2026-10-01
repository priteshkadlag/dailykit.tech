import { z } from "zod";
import { parseNumber } from "@/lib/format";

interface NumberFieldOptions {
  min?: number;
  max?: number;
  /** Require the value to be strictly greater than `min`. */
  exclusiveMin?: boolean;
  integer?: boolean;
}

/** A form field typed as a string that must parse to a finite number within bounds. */
export function numberString({ min, max, exclusiveMin, integer }: NumberFieldOptions = {}) {
  let num = z.number({ error: "Enter a valid number" });
  if (min !== undefined) {
    num = exclusiveMin
      ? num.gt(min, { error: `Must be greater than ${min}` })
      : num.gte(min, { error: `Must be at least ${min}` });
  }
  if (max !== undefined) num = num.lte(max, { error: `Must be at most ${max.toLocaleString("en-IN")}` });
  if (integer) num = num.int({ error: "Must be a whole number" });
  return z.string().transform(parseNumber).pipe(num);
}

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export type ValidationResult<S extends z.ZodType> =
  | { ok: true; data: z.output<S>; errors: FieldErrors<z.input<S>>; incomplete: false }
  | { ok: false; data: null; errors: FieldErrors<z.input<S>>; incomplete: boolean };

/**
 * Validates raw string inputs. Empty fields are treated as "not filled in yet" rather than
 * errors, so a calculator shows its empty state instead of shouting at a fresh form.
 */
export function validateInputs<S extends z.ZodObject>(schema: S, values: z.input<S>): ValidationResult<S> {
  const incomplete = Object.values(values as Record<string, unknown>).some(
    (v) => typeof v === "string" && v.trim() === "",
  );
  const parsed = schema.safeParse(values);
  if (parsed.success) return { ok: true, data: parsed.data, errors: {}, incomplete: false };

  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "");
    const raw = (values as Record<string, unknown>)[key];
    if (typeof raw === "string" && raw.trim() === "") continue;
    errors[key] ??= issue.message;
  }
  return { ok: false, data: null, errors: errors as FieldErrors<z.input<S>>, incomplete };
}
