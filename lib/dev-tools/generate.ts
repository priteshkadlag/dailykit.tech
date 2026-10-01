/** Generators for the developer tools: IDs, random strings, hashes, cron schedules and cURL commands. */

// ---- UUID

const hex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
const dashed = (h: string) => `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;

export function uuidV4() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return dashed(hex(bytes));
}

/** RFC 9562 version 7: 48-bit Unix milliseconds, then random bits. */
export function uuidV7(now = Date.now()) {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let ms = now;
  for (let i = 5; i >= 0; i--) {
    bytes[i] = ms % 256;
    ms = Math.floor(ms / 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return dashed(hex(bytes));
}

export type UuidFormat = "lower" | "upper" | "braces" | "no-dashes";
export function formatUuid(uuid: string, format: UuidFormat) {
  if (format === "upper") return uuid.toUpperCase();
  if (format === "braces") return `{${uuid}}`;
  if (format === "no-dashes") return uuid.replace(/-/g, "");
  return uuid;
}

// ---- Random strings

export const CHARSETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.<>?/~",
  hex: "0123456789abcdef",
} as const;
/** Characters that are easy to mix up when read aloud or copied by hand. */
const AMBIGUOUS = /[Il1O0o]/g;

/** Uniform random characters from `alphabet`, using rejection sampling to avoid modulo bias. */
export function randomString(length: number, alphabet: string) {
  const chars = [...new Set(alphabet)];
  if (!chars.length || length <= 0) return "";
  const limit = 256 - (256 % chars.length);
  let out = "";
  while (out.length < length) {
    for (const byte of crypto.getRandomValues(new Uint8Array(length * 2))) {
      if (byte < limit) out += chars[byte % chars.length];
      if (out.length === length) break;
    }
  }
  return out;
}

export function buildAlphabet(sets: (keyof typeof CHARSETS)[], extra = "", excludeAmbiguous = false) {
  const alphabet = sets.map((set) => CHARSETS[set]).join("") + extra;
  return excludeAmbiguous ? alphabet.replace(AMBIGUOUS, "") : alphabet;
}

// ---- Hashes

/** MD5 (RFC 1321). Web Crypto doesn't offer it, so it's implemented here. */
export function md5(bytes: Uint8Array): string {
  const s = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
  const k = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0);
  const length = bytes.length;
  const padded = new Uint8Array(((length + 8) >> 6 << 6) + 64);
  padded.set(bytes);
  padded[length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, (length * 8) >>> 0, true);
  view.setUint32(padded.length - 4, Math.floor((length * 8) / 2 ** 32), true);
  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  for (let offset = 0; offset < padded.length; offset += 64) {
    const m = Array.from({ length: 16 }, (_, i) => view.getUint32(offset + i * 4, true));
    let a = a0, b = b0, c = c0, d = d0;
    for (let i = 0; i < 64; i++) {
      let f: number, g: number;
      if (i < 16) { f = (b & c) | (~b & d); g = i; }
      else if (i < 32) { f = (d & b) | (~d & c); g = (5 * i + 1) % 16; }
      else if (i < 48) { f = b ^ c ^ d; g = (3 * i + 5) % 16; }
      else { f = c ^ (b | ~d); g = (7 * i) % 16; }
      const sum = (a + f + k[i] + m[g]) >>> 0;
      a = d; d = c; c = b;
      b = (b + ((sum << s[i]) | (sum >>> (32 - s[i])))) >>> 0;
    }
    a0 = (a0 + a) >>> 0; b0 = (b0 + b) >>> 0; c0 = (c0 + c) >>> 0; d0 = (d0 + d) >>> 0;
  }
  const out = new DataView(new ArrayBuffer(16));
  [a0, b0, c0, d0].forEach((word, i) => out.setUint32(i * 4, word, true));
  return hex(new Uint8Array(out.buffer));
}

export type HashAlgorithm = "MD5" | "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";
export const HASH_ALGORITHMS: HashAlgorithm[] = ["MD5", "SHA-1", "SHA-256", "SHA-384", "SHA-512"];

export async function hashBytes(algorithm: HashAlgorithm, bytes: Uint8Array): Promise<string> {
  if (algorithm === "MD5") return md5(bytes);
  return hex(new Uint8Array(await crypto.subtle.digest(algorithm, bytes as BufferSource)));
}

export function hexToBase64(value: string) {
  return btoa(String.fromCharCode(...(value.match(/../g) ?? []).map((pair) => parseInt(pair, 16))));
}

// ---- Cron

const FIELDS = [
  { name: "minute", min: 0, max: 59 },
  { name: "hour", min: 0, max: 23 },
  { name: "day of month", min: 1, max: 31 },
  { name: "month", min: 1, max: 12, names: ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"] },
  { name: "day of week", min: 0, max: 6, names: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] },
] as const;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MACROS: Record<string, string> = {
  "@yearly": "0 0 1 1 *", "@annually": "0 0 1 1 *", "@monthly": "0 0 1 * *", "@weekly": "0 0 * * 0", "@daily": "0 0 * * *", "@midnight": "0 0 * * *", "@hourly": "0 * * * *",
};

export interface CronSchedule {
  fields: string[];
  values: number[][];
  /** Whether the day-of-month and day-of-week fields are restricted (not *). */
  domStar: boolean;
  dowStar: boolean;
}

type CronResult = { ok: true; value: CronSchedule } | { ok: false; error: string };

export function parseCron(expression: string): CronResult {
  const text = MACROS[expression.trim().toLowerCase()] ?? expression.trim();
  const fields = text.split(/\s+/);
  if (fields.length !== 5) return { ok: false, error: `A cron expression has 5 fields (minute hour day month weekday); this has ${fields.length}.` };
  const values: number[][] = [];
  for (let i = 0; i < 5; i++) {
    const spec = FIELDS[i];
    const set = new Set<number>();
    const named = (token: string) => {
      const upper = token.toUpperCase();
      const index = "names" in spec ? (spec.names as readonly string[]).indexOf(upper) : -1;
      if (index >= 0) return index + spec.min;
      return /^\d+$/.test(token) ? Number(token) : NaN;
    };
    for (const part of fields[i].split(",")) {
      const match = /^(\*|[\w]+(?:-[\w]+)?)(?:\/(\d+))?$/.exec(part);
      if (!match) return { ok: false, error: `"${part}" isn't valid in the ${spec.name} field.` };
      const step = match[2] ? Number(match[2]) : 1;
      if (step < 1) return { ok: false, error: `The step in "${part}" must be at least 1.` };
      let from: number = spec.min;
      let to: number = spec.max;
      if (match[1] !== "*") {
        const [a, b] = match[1].split("-");
        from = named(a);
        to = b === undefined ? (match[2] ? spec.max : from) : named(b);
        // Day of week 7 is also Sunday.
        if (i === 4) { if (from === 7) from = 0; if (to === 7 && b !== undefined) to = 6; }
      }
      if (Number.isNaN(from) || Number.isNaN(to) || from < spec.min || to > spec.max || from > to) {
        return { ok: false, error: `"${part}" is out of range for the ${spec.name} field (${spec.min}–${spec.max}).` };
      }
      for (let v = from; v <= to; v += step) set.add(v);
      if (i === 4 && match[1] !== "*" && match[1].split("-")[1] === "7") set.add(0);
    }
    values.push([...set].sort((a, b) => a - b));
  }
  return { ok: true, value: { fields, values, domStar: fields[2] === "*", dowStar: fields[4] === "*" } };
}

const pad = (n: number) => String(n).padStart(2, "0");
function listWords(items: string[]) {
  return items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function describeField(field: string, values: number[], index: number, name: (v: number) => string) {
  const spec = FIELDS[index];
  if (field === "*") return null;
  const step = /^\*\/(\d+)$/.exec(field);
  if (step) return `every ${step[1]} ${index === 0 ? "minutes" : index === 1 ? "hours" : index === 2 ? "days" : index === 3 ? "months" : "days of the week"}`;
  const range = /^(\w+)-(\w+)$/.exec(field);
  if (range && values.length === values[values.length - 1] - values[0] + 1) return `${name(values[0])} through ${name(values[values.length - 1])}`;
  if (values.length === spec.max - spec.min + 1) return null;
  return listWords(values.map(name));
}

/** A plain-English description of a cron schedule. */
export function describeCron(schedule: CronSchedule): string {
  const [minF, hourF, domF, monF, dowF] = schedule.fields;
  const [mins, hours, doms, months, dows] = schedule.values;
  let time: string;
  if (minF === "*" && hourF === "*") time = "Every minute";
  else if (hourF === "*") time = /^\*\/\d+$/.test(minF) ? `Every ${minF.slice(2)} minutes` : `At minute ${listWords(mins.map(String))} past every hour`;
  else if (minF === "*") time = `Every minute during ${listWords(hours.map((h) => `${pad(h)}:00`))}`;
  else if (mins.length === 1 && hours.length <= 6) time = `At ${listWords(hours.map((h) => `${pad(h)}:${pad(mins[0])}`))}`;
  else {
    const hourText = describeField(hourF, hours, 1, (h) => `${pad(h)}:00`);
    time = `At minute ${listWords(mins.map(String))}${hourText ? `, ${/^every/.test(hourText) ? hourText : `during ${hourText}`}` : ""}`;
  }
  const parts = [time];
  const dom = describeField(domF, doms, 2, (d) => ordinal(d));
  const dow = describeField(dowF, dows, 4, (d) => DAYS[d]);
  if (dom && dow) parts.push(`on the ${dom} of the month, or on ${dow}`);
  else if (dom) parts.push(/^every/.test(dom) ? dom : `on the ${dom} of the month`);
  else if (dow) parts.push(/^every/.test(dow) ? dow : `on ${dow}`);
  const month = describeField(monF, months, 3, (m) => MONTHS[m - 1]);
  if (month) parts.push(/^every/.test(month) ? month : `in ${month}`);
  return `${parts.join(", ")}.`;
}

function ordinal(n: number) {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th";
  return `${n}${suffix}`;
}

/** The next `count` run times after `from`, following cron's day-of-month OR day-of-week rule. */
export function nextCronRuns(schedule: CronSchedule, from: Date, count = 5): Date[] {
  const [mins, hours, doms, months, dows] = schedule.values.map((list) => new Set(list));
  const runs: Date[] = [];
  const date = new Date(from);
  date.setSeconds(0, 0);
  date.setMinutes(date.getMinutes() + 1);
  const dayMatches = (d: Date) => {
    const domOk = doms.has(d.getDate());
    const dowOk = dows.has(d.getDay());
    if (schedule.domStar && schedule.dowStar) return true;
    if (schedule.domStar) return dowOk;
    if (schedule.dowStar) return domOk;
    return domOk || dowOk;
  };
  // Walk day by day, then minute by minute within matching days; bounded to ~5 years.
  for (let guard = 0; runs.length < count && guard < 366 * 5; guard++) {
    if (months.has(date.getMonth() + 1) && dayMatches(date)) {
      for (let h = date.getHours(); h < 24 && runs.length < count; h++) {
        if (!hours.has(h)) continue;
        for (let m = h === date.getHours() ? date.getMinutes() : 0; m < 60 && runs.length < count; m++) {
          if (mins.has(m)) runs.push(new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m));
        }
      }
    }
    date.setDate(date.getDate() + 1);
    date.setHours(0, 0, 0, 0);
  }
  return runs;
}

// ---- cURL

export interface HttpRequestSpec {
  method: string;
  url: string;
  headers: { name: string; value: string }[];
  body: string;
  auth?: { type: "none" | "bearer" | "basic"; token?: string; username?: string; password?: string };
  followRedirects?: boolean;
  insecure?: boolean;
  verbose?: boolean;
}

function quote(value: string, shell: "posix" | "cmd") {
  if (shell === "cmd") return `"${value.replace(/"/g, "\\\"")}"`;
  return /^[\w@%+=:,./-]+$/.test(value) ? value : `'${value.replace(/'/g, "'\\''")}'`;
}

export function buildCurl(request: HttpRequestSpec, shell: "posix" | "cmd" = "posix", multiline = true) {
  const q = (value: string) => quote(value, shell);
  const args: string[] = [];
  if (request.method !== "GET" || (request.body && request.method === "GET")) args.push(`-X ${request.method}`);
  for (const header of request.headers.filter((h) => h.name.trim())) args.push(`-H ${q(`${header.name.trim()}: ${header.value}`)}`);
  if (request.auth?.type === "bearer" && request.auth.token) args.push(`-H ${q(`Authorization: Bearer ${request.auth.token}`)}`);
  if (request.auth?.type === "basic" && request.auth.username) args.push(`-u ${q(`${request.auth.username}:${request.auth.password ?? ""}`)}`);
  if (request.body) args.push(`--data-raw ${q(request.body)}`);
  if (request.followRedirects) args.push("-L");
  if (request.insecure) args.push("-k");
  if (request.verbose) args.push("-v");
  const continuation = shell === "cmd" ? " ^\n  " : " \\\n  ";
  return ["curl", q(request.url), ...args].join(multiline && args.length ? continuation : " ");
}

export function buildFetch(request: HttpRequestSpec) {
  const headers: Record<string, string> = {};
  for (const header of request.headers.filter((h) => h.name.trim())) headers[header.name.trim()] = header.value;
  if (request.auth?.type === "bearer" && request.auth.token) headers.Authorization = `Bearer ${request.auth.token}`;
  if (request.auth?.type === "basic" && request.auth.username) headers.Authorization = `Basic ${btoa(`${request.auth.username}:${request.auth.password ?? ""}`)}`;
  const options: string[] = [`  method: ${JSON.stringify(request.method)},`];
  if (Object.keys(headers).length) options.push(`  headers: ${JSON.stringify(headers, null, 2).replace(/\n/g, "\n  ")},`);
  if (request.body) options.push(`  body: ${JSON.stringify(request.body)},`);
  return `const response = await fetch(${JSON.stringify(request.url)}, {\n${options.join("\n")}\n});\nconst data = await response.text();`;
}
