"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { format } from "date-fns";
import { Pause, Play, Plus, RotateCcw, X } from "lucide-react";
import { parseDateInput } from "@/lib/calculations/age";
import {
  POPULAR_ZONES, addBusinessDays, clockDifference, dateDifference, dayShift, formatDuration, formatOffset, instantToZonedInput,
  parseClock, shiftDate, splitSeconds, zoneOffset, zonedTimeToInstant,
} from "@/lib/calculations/datetime";
import { formatNumber, parseNumber } from "@/lib/format";
import { useTodayInputValue } from "@/lib/hooks/use-client-values";
import { cn } from "@/lib/utils";
import { CheckboxField, DateField, NumberField, SegmentedControl, SelectField, TextField } from "@/components/shared/form-fields";
import { CopyButton, ResetButton } from "@/components/shared/result-actions";
import { CalculatorLayout, EmptyResult, ErrorResult, InputCard, ResultCard, ResultRows } from "@/components/shared/result-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const plural = (n: number, word: string) => `${formatNumber(n)} ${word}${n === 1 ? "" : "s"}`;
const noopSubscribe = () => () => {};
const longDate = (d: Date) => format(d, "EEEE, d MMMM yyyy");

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return <label htmlFor={htmlFor} className="text-sm font-medium">{children}</label>;
}

// ---- Date difference

export function DateDifferenceCalculator() {
  const today = useTodayInputValue();
  const [mode, setMode] = useState<"between" | "shift">("between");
  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState("");
  const [includeEnd, setIncludeEnd] = useState(false);
  const [amounts, setAmounts] = useState({ years: "", months: "", weeks: "", days: "30" });
  const [direction, setDirection] = useState<"add" | "subtract">("add");
  const [businessOnly, setBusinessOnly] = useState(false);
  const startValue = start ?? today;
  const startDate = parseDateInput(startValue);
  const endDate = parseDateInput(end);

  const diff = mode === "between" && startDate && endDate ? dateDifference(startDate, endDate, { includeEnd }) : null;
  const n = (v: string) => (v.trim() ? parseNumber(v) : 0);
  const shiftValues = { years: n(amounts.years), months: n(amounts.months), weeks: n(amounts.weeks), days: n(amounts.days) };
  const shiftError = Object.values(shiftValues).some((v) => !Number.isInteger(v) || v < 0) ? "Use whole numbers of 0 or more." : undefined;
  const sign = direction === "add" ? 1 : -1;
  const shifted = mode === "shift" && startDate && !shiftError
    ? businessOnly ? addBusinessDays(startDate, sign * shiftValues.days) : shiftDate(startDate, shiftValues, sign)
    : null;
  const parts = diff ? [diff.years && plural(diff.years, "year"), diff.months && plural(diff.months, "month"), plural(diff.days, "day")].filter(Boolean).join(", ") : "";

  return (
    <CalculatorLayout
      inputs={<InputCard title="Dates">
        <SegmentedControl label="Calculate" value={mode} onChange={setMode} options={[{ value: "between", label: "Days between dates" }, { value: "shift", label: "Add or subtract days" }]} />
        <DateField label="Start date" value={startValue} onChange={setStart} error={startValue && !startDate ? "Enter a valid date" : undefined} />
        {mode === "between" ? (
          <>
            <DateField label="End date" value={end} onChange={setEnd} error={end && !endDate ? "Enter a valid date" : undefined} />
            <CheckboxField label="Include the end date" checked={includeEnd} onChange={setIncludeEnd} hint="Adds one day — useful for leave, hotel nights or event days" />
          </>
        ) : (
          <>
            <SegmentedControl label="Direction" value={direction} onChange={setDirection} options={[{ value: "add", label: "Add" }, { value: "subtract", label: "Subtract" }]} />
            <CheckboxField label="Count business days only (Mon–Fri)" checked={businessOnly} onChange={setBusinessOnly} />
            <div className="grid grid-cols-2 gap-4">
              {(businessOnly ? (["days"] as const) : (["years", "months", "weeks", "days"] as const)).map((k) => (
                <NumberField key={k} label={businessOnly ? "Business days" : k[0].toUpperCase() + k.slice(1)} value={amounts[k]} onChange={(v) => setAmounts((a) => ({ ...a, [k]: v }))} />
              ))}
            </div>
          </>
        )}
      </InputCard>}
      result={diff ? (
        <ResultCard highlightLabel={diff.reversed ? "The end date is before the start date by" : "Time between the dates"} highlightValue={plural(diff.totalDays, "day")} highlightCaption={parts}
          actions={<><CopyButton text={`${startValue} to ${end}${includeEnd ? " (inclusive)" : ""}: ${plural(diff.totalDays, "day")} (${parts}).`} /><ResetButton onReset={() => { setStart(null); setEnd(""); }} /></>}>
          <ResultRows rows={[
            { label: "Years, months, days", value: parts },
            { label: "Total months", value: plural(diff.totalMonths, "month") },
            { label: "Weeks", value: `${plural(diff.weeks, "week")}${diff.weekRemainder ? `, ${plural(diff.weekRemainder, "day")}` : ""}` },
            { label: "Total days", value: plural(diff.totalDays, "day"), emphasis: true },
            { label: "Weekdays (Mon–Fri)", value: plural(diff.businessDays, "day") },
            { label: "Weekend days", value: plural(diff.weekendDays, "day") },
            { label: "Hours", value: formatNumber(diff.totalDays * 24) },
          ]} />
          <p className="mt-3 text-xs text-muted-foreground">Weekday counts don&apos;t skip public holidays.</p>
        </ResultCard>
      ) : shifted ? (
        <ResultCard highlightLabel={`${direction === "add" ? "Adding to" : "Subtracting from"} ${startValue}`} highlightValue={format(shifted, "d MMM yyyy")} highlightCaption={format(shifted, "EEEE")}
          actions={<CopyButton text={longDate(shifted)} saveable={false} />}>
          <ResultRows rows={[{ label: "Result", value: longDate(shifted), emphasis: true }, { label: "Days from the start date", value: plural(Math.abs(dateDifference(startDate!, shifted).totalDays), "day") }]} />
        </ResultCard>
      ) : shiftError ? <ErrorResult message={shiftError} /> : <EmptyResult message={mode === "between" ? "Pick an end date to count the days between." : "Enter how much time to add or subtract."} />}
    />
  );
}

// ---- Time difference

export function TimeDifferenceCalculator() {
  const [mode, setMode] = useState<"clock" | "datetime">("clock");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:30");
  const [breakMinutes, setBreakMinutes] = useState("");
  const [startDt, setStartDt] = useState("");
  const [endDt, setEndDt] = useState("");
  const breakSeconds = breakMinutes.trim() ? parseNumber(breakMinutes) * 60 : 0;
  const breakError = !Number.isFinite(breakSeconds) || breakSeconds < 0 ? "Enter minutes as a positive number" : undefined;

  let seconds: number | null = null;
  let note = "";
  if (mode === "clock") {
    const a = parseClock(startTime);
    const b = parseClock(endTime);
    if (a !== null && b !== null && !breakError) {
      const r = clockDifference(a, b, breakSeconds);
      seconds = r.seconds;
      if (r.overnight) note = "The end time is earlier than the start, so it's counted as the next day.";
    }
  } else if (startDt && endDt) {
    const a = new Date(startDt).getTime();
    const b = new Date(endDt).getTime();
    if (Number.isFinite(a) && Number.isFinite(b)) {
      seconds = (b - a) / 1000;
      if (seconds < 0) note = "The end is before the start; the difference is shown as a positive duration.";
      seconds = Math.abs(seconds);
    }
  }
  const s = seconds !== null ? splitSeconds(seconds) : null;
  const hhmm = s ? `${String(s.days * 24 + s.hours).padStart(2, "0")}:${String(s.minutes).padStart(2, "0")}` : "";

  return (
    <CalculatorLayout
      inputs={<InputCard title="Times">
        <SegmentedControl label="Measure" value={mode} onChange={setMode} options={[{ value: "clock", label: "Between two times" }, { value: "datetime", label: "Between dates and times" }]} />
        {mode === "clock" ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><FieldLabel htmlFor="td-start">Start time</FieldLabel><Input id="td-start" type="time" step={1} value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-11 text-base" /></div>
              <div className="space-y-1.5"><FieldLabel htmlFor="td-end">End time</FieldLabel><Input id="td-end" type="time" step={1} value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-11 text-base" /></div>
            </div>
            <NumberField label="Break to subtract" suffix="minutes" value={breakMinutes} onChange={setBreakMinutes} error={breakError} hint="Optional — e.g. a lunch break when working out hours worked" />
          </>
        ) : (
          <>
            <div className="space-y-1.5"><FieldLabel htmlFor="td-start-dt">Start</FieldLabel><Input id="td-start-dt" type="datetime-local" value={startDt} onChange={(e) => setStartDt(e.target.value)} className="h-11 text-base" /></div>
            <div className="space-y-1.5"><FieldLabel htmlFor="td-end-dt">End</FieldLabel><Input id="td-end-dt" type="datetime-local" value={endDt} onChange={(e) => setEndDt(e.target.value)} className="h-11 text-base" /></div>
          </>
        )}
      </InputCard>}
      result={seconds !== null && s ? (
        <ResultCard highlightLabel="Time difference" highlightValue={hhmm} highlightCaption={formatDuration(seconds)}
          actions={<><CopyButton text={`${formatDuration(seconds)} (${hhmm} hours)`} saveable={false} /><ResetButton onReset={() => { setStartTime("09:00"); setEndTime("17:30"); setBreakMinutes(""); setStartDt(""); setEndDt(""); }} /></>}>
          <ResultRows rows={[
            { label: "Duration", value: formatDuration(seconds), emphasis: true },
            { label: "Decimal hours", value: formatNumber(Math.round((seconds / 3600) * 100) / 100) },
            { label: "Total minutes", value: formatNumber(Math.round((seconds / 60) * 100) / 100) },
            { label: "Total seconds", value: formatNumber(Math.round(seconds)) },
          ]} />
          {note && <p className="mt-3 text-xs text-muted-foreground">{note}</p>}
        </ResultCard>
      ) : <EmptyResult message={mode === "clock" ? "Enter a start and end time." : "Pick a start and end date and time."} />}
    />
  );
}

// ---- Time zone converter

const localZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const POPULAR_ZONE_IDS = POPULAR_ZONES.map((z) => z.zone);
let zoneCache: string[] | null = null;
// The browser’s zone list can differ from the server’s, so the full list is only read on the client.
const allZones = () => (zoneCache ??= typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : POPULAR_ZONE_IDS);
const popularZones = () => POPULAR_ZONE_IDS;
const zoneLabel = (zone: string) => POPULAR_ZONES.find((z) => z.zone === zone)?.label ?? zone.split("/").pop()!.replace(/_/g, " ");
const DEFAULT_TARGETS = ["America/New_York", "Europe/London", "Asia/Dubai", "Asia/Singapore", "Australia/Sydney"];

export function TimeZoneConverter() {
  const myZone = useSyncExternalStore(noopSubscribe, localZone, () => "Asia/Kolkata");
  const [fromOverride, setFrom] = useState<string | null>(null);
  const from = fromOverride ?? myZone;
  const nowInput = useSyncExternalStore(noopSubscribe, () => instantToZonedInput(new Date(Math.floor(Date.now() / 60_000) * 60_000), localZone()), () => "");
  const [whenOverride, setWhen] = useState<string | null>(null);
  const [targets, setTargets] = useState<string[]>(DEFAULT_TARGETS);
  const [adding, setAdding] = useState("");
  const zones = useSyncExternalStore(noopSubscribe, allZones, popularZones);
  // "Now" is captured in the visitor's own zone; shift it into the chosen "from" zone.
  const when = whenOverride ?? (nowInput ? instantToZonedInput(zonedTimeToInstant(nowInput, myZone) ?? new Date(), from) : "");
  const instant = when ? zonedTimeToInstant(when, from) : null;
  const zoneOptions = [...POPULAR_ZONES.map((z) => ({ value: z.zone, label: `${z.label} — ${z.zone}` })), ...zones.filter((z) => !POPULAR_ZONES.some((p) => p.zone === z)).map((z) => ({ value: z, label: z.replace(/_/g, " ") }))];
  const list = [from, ...targets.filter((z) => z !== from)];
  const copy = instant ? list.map((z) => `${zoneLabel(z)}: ${format(new Date(instantToZonedInput(instant, z)), "EEE d MMM, h:mm a")} (${formatOffset(zoneOffset(z, instant))})`).join("\n") : "";

  return (
    <div className="space-y-6">
      <InputCard title="Time to convert">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="From time zone" value={from} onChange={setFrom} options={zoneOptions.some((o) => o.value === from) ? zoneOptions : [{ value: from, label: from }, ...zoneOptions]} />
          <div className="space-y-1.5">
            <FieldLabel htmlFor="tz-when">Date and time there</FieldLabel>
            <div className="flex gap-2">
              <Input id="tz-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="h-11 flex-1 text-base" />
              <Button variant="outline" className="h-11" onClick={() => setWhen(null)}>Now</Button>
            </div>
          </div>
        </div>
      </InputCard>
      {instant ? (
        <section aria-label="Converted times" className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
          <ul className="divide-y">
            {list.map((zone, index) => {
              const local = new Date(instantToZonedInput(instant, zone));
              const shift = dayShift(instant, from, zone);
              const hour = local.getHours();
              return (
                <li key={zone} className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 sm:px-6", index === 0 && "bg-accent/40")}>
                  <div className="min-w-40 flex-1">
                    <p className="font-medium">{zoneLabel(zone)}{index === 0 && <span className="ml-2 text-xs text-muted-foreground">(from)</span>}</p>
                    <p className="text-xs text-muted-foreground">{zone} · {formatOffset(zoneOffset(zone, instant))}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-semibold tabular-nums">{format(local, "h:mm a")}</p>
                    <p className="text-xs text-muted-foreground">{format(local, "EEE, d MMM yyyy")}{shift !== 0 && <span className="ml-1 font-medium text-foreground">{shift > 0 ? `+${shift}` : shift} day</span>}{(hour < 8 || hour >= 21) && " · outside usual hours"}</p>
                  </div>
                  {index > 0 && <Button variant="ghost" size="icon-sm" aria-label={`Remove ${zoneLabel(zone)}`} onClick={() => setTargets((t) => t.filter((z) => z !== zone))}><X /></Button>}
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap items-end gap-2 border-t bg-muted/40 px-5 py-4 sm:px-6">
            <SelectField label="Add a time zone" value={adding} onChange={setAdding} className="min-w-0 flex-1" options={[{ value: "", label: "Choose a city or zone…" }, ...zoneOptions.filter((o) => !list.includes(o.value))]} />
            <Button className="h-11" disabled={!adding} onClick={() => { setTargets((t) => [...t, adding]); setAdding(""); }}><Plus /> Add</Button>
            <CopyButton text={copy} label="Copy all" saveable={false} />
          </div>
        </section>
      ) : <EmptyResult message="Pick a date and time to convert." />}
    </div>
  );
}

// ---- Countdown timer

function useNow(active: boolean, interval = 250) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), interval);
    return () => window.clearInterval(timer);
  }, [active, interval]);
  return now;
}

function beep() {
  try {
    const ctx = new AudioContext();
    [0, 0.35, 0.7].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.25, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.3);
    });
    window.setTimeout(() => void ctx.close(), 1500);
  } catch {
    // Audio unavailable — the visual alert still shows.
  }
}

function BigTime({ seconds, showDays = false }: { seconds: number; showDays?: boolean }) {
  const { days, hours, minutes, seconds: secs } = splitSeconds(Math.max(0, seconds));
  const cells = [...(showDays ? [[days, "days"]] : []), [showDays ? hours : days * 24 + hours, "hours"], [minutes, "minutes"], [secs, "seconds"]] as [number, string][];
  return (
    <div className="flex justify-center gap-2 sm:gap-4" role="timer" aria-live="off">
      {cells.map(([value, label]) => (
        <div key={label} className="min-w-16 rounded-xl bg-muted px-2 py-3 text-center sm:min-w-24 sm:px-4">
          <p className="text-4xl font-bold tabular-nums sm:text-6xl">{String(value).padStart(2, "0")}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  );
}

const PRESETS = [1, 3, 5, 10, 15, 25, 30, 60];

function TimerMode() {
  const [duration, setDuration] = useState({ h: "0", m: "5", s: "0" });
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [remainingWhenPaused, setRemainingWhenPaused] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const now = useNow(endsAt !== null);
  const total = (Number(duration.h) || 0) * 3600 + (Number(duration.m) || 0) * 60 + (Number(duration.s) || 0);
  const remaining = endsAt !== null ? Math.max(0, Math.ceil((endsAt - now) / 1000)) : remainingWhenPaused ?? total;
  const finished = useRef(false);

  useEffect(() => {
    if (endsAt === null || remaining > 0 || finished.current) return;
    finished.current = true;
    beep();
    const timer = window.setTimeout(() => { setEndsAt(null); setRemainingWhenPaused(null); setDone(true); }, 0);
    return () => window.clearTimeout(timer);
  }, [endsAt, remaining]);

  useEffect(() => {
    const original = document.title;
    if (endsAt !== null) document.title = `⏱ ${formatClock(remaining)} — Countdown`;
    return () => { document.title = original; };
  }, [endsAt, remaining]);

  const start = () => {
    const secs = remainingWhenPaused ?? total;
    if (secs <= 0) return;
    finished.current = false;
    setDone(false);
    setEndsAt(Date.now() + secs * 1000);
    setRemainingWhenPaused(null);
  };
  const pause = () => { setRemainingWhenPaused(remaining); setEndsAt(null); };
  const reset = () => { setEndsAt(null); setRemainingWhenPaused(null); setDone(false); };
  const running = endsAt !== null;
  const progress = total > 0 ? 1 - remaining / total : 0;

  return (
    <div className="space-y-6">
      <div className={cn("space-y-4 rounded-xl p-5 ring-1 ring-foreground/10 sm:p-8", done ? "animate-pulse bg-primary/10" : "bg-card")}>
        <BigTime seconds={remaining} />
        <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden><div className="h-full bg-primary transition-[width]" style={{ width: `${Math.min(100, progress * 100)}%` }} /></div>
        {done && <p className="text-center text-lg font-semibold" role="alert">Time&apos;s up!</p>}
        <div className="flex flex-wrap justify-center gap-2">
          {running ? <Button size="lg" onClick={pause}><Pause /> Pause</Button> : <Button size="lg" onClick={start} disabled={(remainingWhenPaused ?? total) <= 0}><Play /> {remainingWhenPaused !== null ? "Resume" : "Start"}</Button>}
          <Button size="lg" variant="outline" onClick={reset}><RotateCcw /> Reset</Button>
        </div>
      </div>
      {!running && (
        <InputCard title="Set the timer">
          <div className="grid grid-cols-3 gap-3">
            {(["h", "m", "s"] as const).map((k) => <NumberField key={k} label={{ h: "Hours", m: "Minutes", s: "Seconds" }[k]} value={duration[k]} onChange={(v) => { setDuration((d) => ({ ...d, [k]: v })); setRemainingWhenPaused(null); setDone(false); }} />)}
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Presets">
            {PRESETS.map((m) => <button key={m} type="button" onClick={() => { setDuration({ h: String(Math.floor(m / 60)), m: String(m % 60), s: "0" }); setRemainingWhenPaused(null); setDone(false); }} className="min-h-9 rounded-full border bg-background px-3.5 text-sm font-medium hover:bg-accent">{m < 60 ? `${m} min` : "1 hour"}</button>)}
          </div>
          <p className="text-xs text-muted-foreground">A beep plays when the time is up. Keep this tab open; the timer keeps time correctly even in a background tab.</p>
        </InputCard>
      )}
    </div>
  );
}

function formatClock(seconds: number) {
  const { days, hours, minutes, seconds: s } = splitSeconds(seconds);
  const h = days * 24 + hours;
  return `${h ? `${h}:` : ""}${String(minutes).padStart(h ? 2 : 1, "0")}:${String(s).padStart(2, "0")}`;
}

function EventMode() {
  const [name, setName] = useState("New Year");
  const nextYear = useSyncExternalStore(noopSubscribe, () => `${new Date().getFullYear() + 1}-01-01T00:00`, () => "");
  const [targetOverride, setTarget] = useState<string | null>(null);
  const target = targetOverride ?? nextYear;
  const targetTime = target ? new Date(target).getTime() : NaN;
  const now = useNow(Number.isFinite(targetTime), 1000);
  const seconds = Number.isFinite(targetTime) ? Math.round((targetTime - now) / 1000) : null;

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-8">
        <h2 className="text-center text-lg font-semibold">{seconds !== null && seconds <= 0 ? `${name || "The event"} has arrived!` : `Time until ${name || "the event"}`}</h2>
        {seconds !== null ? <BigTime seconds={seconds} showDays /> : <p className="text-center text-muted-foreground">Pick a date and time below.</p>}
        {seconds !== null && Number.isFinite(targetTime) && <p className="text-center text-sm text-muted-foreground">{format(new Date(targetTime), "EEEE, d MMMM yyyy 'at' h:mm a")}</p>}
      </div>
      <InputCard title="Event">
        <TextField label="Event name" value={name} onChange={setName} placeholder="Birthday, exam, launch…" />
        <div className="space-y-1.5">
          <FieldLabel htmlFor="cd-target">Date and time</FieldLabel>
          <Input id="cd-target" type="datetime-local" value={target} onChange={(e) => setTarget(e.target.value)} className="h-11 text-base" />
        </div>
      </InputCard>
    </div>
  );
}

export function CountdownTimer() {
  const [mode, setMode] = useState<"timer" | "event">("timer");
  return (
    <div className="space-y-6">
      <SegmentedControl label="Mode" hideLabel value={mode} onChange={setMode} options={[{ value: "timer", label: "Timer" }, { value: "event", label: "Countdown to a date" }]} />
      {mode === "timer" ? <TimerMode /> : <EventMode />}
    </div>
  );
}

