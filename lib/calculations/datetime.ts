import { addDays, addMonths, addWeeks, addYears, differenceInCalendarDays, differenceInMonths, differenceInYears } from "date-fns";

/* ---------- Date difference ---------- */

export interface DateDifference {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  weeks: number;
  weekRemainder: number;
  totalMonths: number;
  businessDays: number;
  weekendDays: number;
  /** True when the end date is before the start date (the dates were swapped to measure). */
  reversed: boolean;
}

/** Calendar difference between two dates. With includeEnd, the end date itself is counted (adds one day). */
export function dateDifference(start: Date, end: Date, { includeEnd = false } = {}): DateDifference {
  const reversed = end < start;
  const from = reversed ? end : start;
  const to = addDays(reversed ? start : end, includeEnd ? 1 : 0);
  const years = differenceInYears(to, from);
  const afterYears = addYears(from, years);
  const months = differenceInMonths(to, afterYears);
  const days = differenceInCalendarDays(to, addMonths(afterYears, months));
  const totalDays = differenceInCalendarDays(to, from);
  // Weekdays in [from, to): whole weeks have 5, then count the leftover days one by one.
  const fullWeeks = Math.floor(totalDays / 7);
  let businessDays = fullWeeks * 5;
  for (let i = 0; i < totalDays % 7; i++) {
    const day = (from.getDay() + i) % 7;
    if (day !== 0 && day !== 6) businessDays++;
  }
  return { years, months, days, totalDays, weeks: fullWeeks, weekRemainder: totalDays % 7, totalMonths: differenceInMonths(to, from), businessDays, weekendDays: totalDays - businessDays, reversed };
}

export function shiftDate(date: Date, { years = 0, months = 0, weeks = 0, days = 0 }, direction: 1 | -1 = 1) {
  return addDays(addWeeks(addMonths(addYears(date, years * direction), months * direction), weeks * direction), days * direction);
}

/** Adds n business days (Mon–Fri), skipping weekends. */
export function addBusinessDays(date: Date, n: number) {
  let result = date;
  let left = Math.abs(n);
  const step = n < 0 ? -1 : 1;
  while (left > 0) {
    result = addDays(result, step);
    if (result.getDay() !== 0 && result.getDay() !== 6) left--;
  }
  return result;
}

/* ---------- Time difference ---------- */

/** Parses "HH:MM" or "HH:MM:SS" (24-hour) into seconds after midnight. */
export function parseClock(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!m) return null;
  const [h, min, s] = [Number(m[1]), Number(m[2]), Number(m[3] ?? 0)];
  if (h > 23 || min > 59 || s > 59) return null;
  return h * 3600 + min * 60 + s;
}

export function splitSeconds(total: number) {
  const sign = total < 0 ? -1 : 1;
  let rest = Math.abs(Math.round(total));
  const days = Math.floor(rest / 86_400);
  rest -= days * 86_400;
  const hours = Math.floor(rest / 3600);
  rest -= hours * 3600;
  const minutes = Math.floor(rest / 60);
  return { sign, days, hours, minutes, seconds: rest - minutes * 60 };
}

/** Seconds from start to end on a clock; an end earlier than the start is taken as the next day. */
export function clockDifference(start: number, end: number, breakSeconds = 0) {
  const raw = end - start;
  const overnight = raw < 0;
  return { seconds: Math.max(0, (overnight ? raw + 86_400 : raw) - breakSeconds), overnight };
}

export function formatDuration(totalSeconds: number, { showSeconds = true } = {}) {
  const { days, hours, minutes, seconds } = splitSeconds(totalSeconds);
  const parts = [days && `${days} ${days === 1 ? "day" : "days"}`, hours && `${hours} ${hours === 1 ? "hour" : "hours"}`, minutes && `${minutes} ${minutes === 1 ? "minute" : "minutes"}`, showSeconds && seconds && `${seconds} ${seconds === 1 ? "second" : "seconds"}`].filter(Boolean);
  return parts.length ? parts.join(", ") : showSeconds ? "0 seconds" : "0 minutes";
}

/* ---------- Time zones ---------- */

const formatters = new Map<string, Intl.DateTimeFormat>();
function partsIn(zone: string, date: Date) {
  let f = formatters.get(zone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", { timeZone: zone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    formatters.set(zone, f);
  }
  const p = Object.fromEntries(f.formatToParts(date).map((x) => [x.type, x.value]));
  return { year: +p.year, month: +p.month, day: +p.day, hour: +p.hour, minute: +p.minute, second: +p.second };
}

/** The zone's offset from UTC at that instant, in minutes (IST → 330). */
export function zoneOffset(zone: string, date: Date) {
  const p = partsIn(zone, date);
  return Math.round((Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(date.getTime() / 1000) * 1000) / 60_000);
}

/** The instant when a zone's wall clock shows the given local date and time ("2026-10-01T09:30"). */
export function zonedTimeToInstant(local: string, zone: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) return null;
  const wall = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  // Two passes settle the offset even when the guess lands on the other side of a DST change.
  let instant = wall - zoneOffset(zone, new Date(wall)) * 60_000;
  instant = wall - zoneOffset(zone, new Date(instant)) * 60_000;
  return new Date(instant);
}

export function formatOffset(minutes: number) {
  const sign = minutes < 0 ? "−" : "+";
  const abs = Math.abs(minutes);
  return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

/** Local wall-clock value ("YYYY-MM-DDTHH:MM") of an instant in a zone, for datetime-local inputs. */
export function instantToZonedInput(date: Date, zone: string) {
  const p = partsIn(zone, date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/** Calendar-day difference of the wall clocks in two zones (−1, 0 or +1). */
export function dayShift(date: Date, fromZone: string, toZone: string) {
  const a = partsIn(fromZone, date);
  const b = partsIn(toZone, date);
  return Math.round((Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / 86_400_000);
}

export const POPULAR_ZONES = [
  { zone: "Asia/Kolkata", label: "India (IST)" }, { zone: "UTC", label: "UTC" }, { zone: "Europe/London", label: "London" },
  { zone: "America/New_York", label: "New York" }, { zone: "America/Los_Angeles", label: "Los Angeles" }, { zone: "America/Chicago", label: "Chicago" },
  { zone: "America/Toronto", label: "Toronto" }, { zone: "Europe/Berlin", label: "Berlin" }, { zone: "Europe/Paris", label: "Paris" },
  { zone: "Asia/Dubai", label: "Dubai" }, { zone: "Asia/Riyadh", label: "Riyadh" }, { zone: "Asia/Singapore", label: "Singapore" },
  { zone: "Asia/Hong_Kong", label: "Hong Kong" }, { zone: "Asia/Shanghai", label: "China" }, { zone: "Asia/Tokyo", label: "Tokyo" },
  { zone: "Asia/Dhaka", label: "Dhaka" }, { zone: "Asia/Kathmandu", label: "Kathmandu" }, { zone: "Asia/Karachi", label: "Karachi" },
  { zone: "Asia/Colombo", label: "Colombo" }, { zone: "Australia/Sydney", label: "Sydney" }, { zone: "Pacific/Auckland", label: "Auckland" },
  { zone: "Africa/Johannesburg", label: "Johannesburg" }, { zone: "Africa/Nairobi", label: "Nairobi" }, { zone: "America/Sao_Paulo", label: "São Paulo" },
];
