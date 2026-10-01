/** Data, number, size and color conversions for the developer tools. */

import type { Result } from "@/lib/dev-tools/code";

// ---- Timestamps

export type TimestampUnit = "s" | "ms" | "us";

/** Guess the unit from the number of digits: 10 → seconds, 13 → milliseconds, 16 → microseconds. */
export function guessTimestampUnit(value: string): TimestampUnit {
  const digits = value.replace(/^-/, "").split(".")[0].length;
  return digits >= 15 ? "us" : digits >= 12 ? "ms" : "s";
}

export function timestampToDate(value: string, unit: TimestampUnit): Date | null {
  if (!/^-?\d+(\.\d+)?$/.test(value.trim())) return null;
  const n = Number(value);
  const ms = unit === "s" ? n * 1000 : unit === "us" ? n / 1000 : n;
  const date = new Date(ms);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "3 hours ago" / "in 2 days". */
export function relativeTime(date: Date, now = Date.now()) {
  const seconds = Math.round((date.getTime() - now) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60], ["second", 1]];
  const [unit, size] = units.find(([, s]) => Math.abs(seconds) >= s) ?? ["second", 1];
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(Math.round(seconds / size), unit);
}

// ---- Number bases

const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";

export function parseBigInt(input: string, base: number): Result<bigint> {
  let text = input.trim().toLowerCase().replace(/[\s_]/g, "");
  const negative = text.startsWith("-");
  if (negative) text = text.slice(1);
  const prefix = { 2: "0b", 8: "0o", 16: "0x" }[base as 2 | 8 | 16];
  if (prefix && text.startsWith(prefix)) text = text.slice(2);
  if (!text) return { ok: false, error: "Enter a number." };
  let value = BigInt(0);
  const big = BigInt(base);
  for (const ch of text) {
    const digit = DIGITS.indexOf(ch);
    if (digit < 0 || digit >= base) return { ok: false, error: `"${ch}" isn't a valid digit in base ${base}.` };
    value = value * big + BigInt(digit);
  }
  return { ok: true, value: negative ? -value : value };
}

export function toBase(value: bigint, base: number) {
  return value.toString(base);
}

/** Groups digits for readability: binary in 4s, hex in 2s/4s, decimal in thousands. */
export function groupDigits(text: string, size: number, separator = " ") {
  const negative = text.startsWith("-");
  const digits = negative ? text.slice(1) : text;
  const grouped = digits.replace(new RegExp(`\\B(?=(.{${size}})+$)`, "g"), separator);
  return negative ? `-${grouped}` : grouped;
}

// ---- File sizes

export const SIZE_UNITS = [
  { id: "B", label: "Bytes (B)", factor: 1 },
  { id: "KB", label: "Kilobytes (KB)", factor: 1e3 },
  { id: "MB", label: "Megabytes (MB)", factor: 1e6 },
  { id: "GB", label: "Gigabytes (GB)", factor: 1e9 },
  { id: "TB", label: "Terabytes (TB)", factor: 1e12 },
  { id: "PB", label: "Petabytes (PB)", factor: 1e15 },
  { id: "KiB", label: "Kibibytes (KiB)", factor: 1024 },
  { id: "MiB", label: "Mebibytes (MiB)", factor: 1024 ** 2 },
  { id: "GiB", label: "Gibibytes (GiB)", factor: 1024 ** 3 },
  { id: "TiB", label: "Tebibytes (TiB)", factor: 1024 ** 4 },
  { id: "PiB", label: "Pebibytes (PiB)", factor: 1024 ** 5 },
  { id: "bit", label: "Bits (b)", factor: 1 / 8 },
] as const;
export type SizeUnit = (typeof SIZE_UNITS)[number]["id"];

export function convertSize(value: number, from: SizeUnit) {
  const bytes = value * SIZE_UNITS.find((u) => u.id === from)!.factor;
  return SIZE_UNITS.map((unit) => ({ ...unit, value: bytes / unit.factor }));
}

/** Up to 6 significant digits without trailing zeros or scientific notation for everyday sizes. */
export function formatSize(value: number) {
  if (value === 0) return "0";
  if (Math.abs(value) >= 1e15 || Math.abs(value) < 1e-6) return value.toExponential(4);
  return Number(value.toPrecision(10)).toLocaleString("en-US", { maximumFractionDigits: 6 });
}

// ---- CSV

export function detectDelimiter(text: string) {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const candidates = [",", ";", "\t", "|"];
  return candidates.map((d) => ({ d, count: firstLine.split(d).length })).sort((a, b) => b.count - a.count)[0].d;
}

/** RFC 4180 CSV parsing: quoted fields, escaped quotes and line breaks inside quotes. */
export function parseCsv(text: string, delimiter = ","): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === "\"" && text[i + 1] === "\"") { field += "\""; i++; }
      else if (ch === "\"") quoted = false;
      else field += ch;
    } else if (ch === "\"" && field === "") quoted = true;
    else if (ch === delimiter) { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += ch;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 1 || r[0] !== "");
}

function typed(value: string): unknown {
  if (value === "") return value;
  if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(value) && Number.isFinite(Number(value))) return Number(value);
  if (value === "true" || value === "false") return value === "true";
  if (value === "null") return null;
  return value;
}

export function csvToJson(text: string, options: { delimiter?: string; header?: boolean; types?: boolean } = {}): Result<unknown[]> {
  const delimiter = options.delimiter ?? detectDelimiter(text);
  const rows = parseCsv(text, delimiter);
  if (!rows.length) return { ok: false, error: "No rows found." };
  const value = (v: string) => (options.types === false ? v : typed(v));
  if (options.header === false) return { ok: true, value: rows.map((r) => r.map(value)) };
  const [head, ...body] = rows;
  const keys = head.map((key, i) => key.trim() || `column${i + 1}`);
  return { ok: true, value: body.map((r) => Object.fromEntries(keys.map((key, i) => [key, value(r[i] ?? "")]))) };
}

/** Flattens nested objects into dotted keys: { a: { b: 1 } } → { "a.b": 1 }. */
export function flatten(value: unknown, prefix = "", out: Record<string, unknown> = {}) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const entries = Object.entries(value);
    if (!entries.length && prefix) out[prefix] = "";
    for (const [key, v] of entries) flatten(v, prefix ? `${prefix}.${key}` : key, out);
  } else if (prefix) out[prefix] = Array.isArray(value) ? JSON.stringify(value) : value;
  return out;
}

function csvCell(value: unknown, delimiter: string) {
  const text = value === null || value === undefined ? "" : String(value);
  return new RegExp(`["\\r\\n${delimiter === "\t" ? "\\t" : delimiter.replace(/[|]/g, "\\|")}]`).test(text) || /^\s|\s$/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
}

export function jsonToCsv(input: unknown, delimiter = ","): Result {
  const list = Array.isArray(input) ? input : input && typeof input === "object" ? [input] : null;
  if (!list) return { ok: false, error: "The JSON must be an array of objects (or a single object)." };
  const rows: Record<string, unknown>[] = list.map((item) => (item && typeof item === "object" && !Array.isArray(item) ? flatten(item) : { value: Array.isArray(item) ? JSON.stringify(item) : item }));
  const columns: string[] = [];
  for (const row of rows) for (const key of Object.keys(row)) if (!columns.includes(key)) columns.push(key);
  const lines = [columns.map((c) => csvCell(c, delimiter)).join(delimiter), ...rows.map((row) => columns.map((c) => csvCell(row[c], delimiter)).join(delimiter))];
  return { ok: true, value: lines.join("\r\n") };
}

// ---- Color

export interface Rgba { r: number; g: number; b: number; a: number }
export interface Hsla { h: number; s: number; l: number; a: number }

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function parseHex(input: string): Rgba | null {
  const h = input.trim().replace(/^#/, "");
  if (!/^([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(h)) return null;
  const full = h.length <= 4 ? [...h].map((c) => c + c).join("") : h;
  const n = (i: number) => parseInt(full.slice(i, i + 2), 16);
  return { r: n(0), g: n(2), b: n(4), a: full.length === 8 ? Math.round((n(6) / 255) * 1000) / 1000 : 1 };
}

export function toHex({ r, g, b, a }: Rgba) {
  const h = (v: number) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}${a < 1 ? h(a * 255) : ""}`;
}

/** Parses rgb(), rgba(), and bare "r, g, b" or "r g b / a" lists. */
export function parseRgb(input: string): Rgba | null {
  const inner = input.trim().replace(/^rgba?\(/i, "").replace(/\)$/, "");
  const parts = inner.split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3 || parts.length > 4) return null;
  const channel = (p: string) => (p.endsWith("%") ? (parseFloat(p) / 100) * 255 : parseFloat(p));
  const [r, g, b] = parts.slice(0, 3).map(channel);
  const a = parts[3] === undefined ? 1 : parts[3].endsWith("%") ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
  if ([r, g, b, a].some((v) => Number.isNaN(v)) || [r, g, b].some((v) => v < 0 || v > 255) || a < 0 || a > 1) return null;
  return { r, g, b, a };
}

export function parseHsl(input: string): Hsla | null {
  const inner = input.trim().replace(/^hsla?\(/i, "").replace(/\)$/, "");
  const parts = inner.split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3 || parts.length > 4) return null;
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]);
  const l = parseFloat(parts[2]);
  const a = parts[3] === undefined ? 1 : parts[3].endsWith("%") ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
  if ([h, s, l, a].some((v) => Number.isNaN(v)) || s < 0 || s > 100 || l < 0 || l > 100 || a < 0 || a > 1) return null;
  return { h: ((h % 360) + 360) % 360, s, l, a };
}

export function hslToRgb({ h, s, l, a }: Hsla): Rgba {
  const sat = s / 100;
  const light = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const f = (n: number) => light - sat * Math.min(light, 1 - light) * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255), a };
}

export function rgbToHsl({ r, g, b, a }: Rgba): Hsla {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  if (d) h = max === rn ? ((gn - bn) / d) % 6 : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  return { h: Math.round(((h * 60) + 360) % 360), s: Math.round(s * 1000) / 10, l: Math.round(l * 1000) / 10, a };
}

export function formatRgb({ r, g, b, a }: Rgba) {
  const [R, G, B] = [r, g, b].map((v) => Math.round(v));
  return a < 1 ? `rgba(${R}, ${G}, ${B}, ${a})` : `rgb(${R}, ${G}, ${B})`;
}

export function formatHsl({ h, s, l, a }: Hsla) {
  return a < 1 ? `hsla(${h}, ${s}%, ${l}%, ${a})` : `hsl(${h}, ${s}%, ${l}%)`;
}

/** Any CSS color notation this module understands. */
export function parseColor(input: string): Rgba | null {
  const text = input.trim();
  if (/^hsla?\(/i.test(text)) { const hsl = parseHsl(text); return hsl ? hslToRgb(hsl) : null; }
  if (/^rgba?\(/i.test(text)) return parseRgb(text);
  return parseHex(text);
}

/** WCAG 2 relative luminance and contrast ratio. */
export function luminance({ r, g, b }: Rgba) {
  const lin = (v: number) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(fg: Rgba, bg: Rgba) {
  // Blend a translucent foreground over the background first.
  const blended = { r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 };
  const [l1, l2] = [luminance(blended), luminance(bg)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

export function wcagResults(ratio: number) {
  return [
    { level: "AA", size: "Normal text", pass: ratio >= 4.5, needed: 4.5 },
    { level: "AA", size: "Large text", pass: ratio >= 3, needed: 3 },
    { level: "AAA", size: "Normal text", pass: ratio >= 7, needed: 7 },
    { level: "AAA", size: "Large text", pass: ratio >= 4.5, needed: 4.5 },
    { level: "AA", size: "UI components & graphics", pass: ratio >= 3, needed: 3 },
  ];
}

/* ---------- Programming cases ---------- */

export type CodeCase = "camel" | "pascal" | "snake" | "constant" | "kebab" | "dot" | "path";

/** Splits an identifier or phrase into words: "parseHTTPResponse_v2" → parse, http, response, v2. */
export function splitIdentifier(text: string): string[] {
  return text
    .replace(/(\p{Ll}|\p{N})(\p{Lu})/gu, "$1 $2")
    .replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, "$1 $2")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map((word) => word.toLocaleLowerCase());
}

const capitalise = (word: string) => word.charAt(0).toLocaleUpperCase() + word.slice(1);

export function toCodeCase(text: string, mode: CodeCase): string {
  const words = splitIdentifier(text);
  switch (mode) {
    case "camel": return words.map((word, index) => (index ? capitalise(word) : word)).join("");
    case "pascal": return words.map(capitalise).join("");
    case "snake": return words.join("_");
    case "constant": return words.join("_").toLocaleUpperCase();
    case "kebab": return words.join("-");
    case "dot": return words.join(".");
    case "path": return words.join("/");
  }
}
