"use client";

import { useEffect, useMemo, useState } from "react";
import { FileUp, RefreshCw } from "lucide-react";
import { formatBytes } from "@/lib/dev-tools/code";
import {
  CHARSETS, HASH_ALGORITHMS, buildAlphabet, buildCurl, describeCron, formatUuid, hashBytes, hexToBase64, nextCronRuns, parseCron, randomString, uuidV4, uuidV7,
  type HashAlgorithm, type HttpRequestSpec, type UuidFormat,
} from "@/lib/dev-tools/generate";
import { REGEX_PRESETS } from "@/lib/dev-tools/web";
import { CheckboxField, DateField, NumberField, SegmentedControl, SelectField, TextField } from "@/components/shared/form-fields";
import { Button } from "@/components/ui/button";
import { CodeArea, CopyText, DownloadText, ErrorNote, Hint, OkNote, Panel, TwoPane, ValueRows } from "@/components/dev-tools/shared";
import { RegexTester } from "@/components/dev-tools/testing";
import { RequestFields } from "@/components/dev-tools/request-fields";

const clampInt = (value: string, min: number, max: number, fallback: number) => Math.min(max, Math.max(min, Number.parseInt(value, 10) || fallback));

// ---- UUID

export function UuidGenerator() {
  const [version, setVersion] = useState<"4" | "7">("4");
  const [format, setFormat] = useState<UuidFormat>("lower");
  const [count, setCount] = useState("10");
  const [seed, setSeed] = useState(0);
  const amount = clampInt(count, 1, 1000, 1);
  // Regenerated on demand; the seed only forces a new batch.
  const ids = useMemo(() => Array.from({ length: amount }, () => formatUuid(version === "4" ? uuidV4() : uuidV7(), format)), [amount, version, format, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const text = ids.join("\n");
  return (
    <div className="space-y-4">
      <Panel>
        <div className="grid gap-4 sm:grid-cols-3">
          <SegmentedControl label="Version" value={version} onChange={setVersion} options={[{ value: "4", label: "v4 (random)" }, { value: "7", label: "v7 (time-ordered)" }]} />
          <SelectField label="Format" value={format} onChange={setFormat} options={[{ value: "lower", label: "lowercase" }, { value: "upper", label: "UPPERCASE" }, { value: "braces", label: "{with braces}" }, { value: "no-dashes", label: "No dashes" }]} />
          <NumberField label="How many" value={count} onChange={setCount} hint="1 to 1,000" />
        </div>
      </Panel>
      <Panel title={`${amount} UUID${amount === 1 ? "" : "s"}`} actions={<><Button variant="outline" onClick={() => setSeed((s) => s + 1)}><RefreshCw /> Regenerate</Button><CopyText text={text} label="Copy all" /><DownloadText text={text} fileName="uuids.txt" /></>}>
        <CodeArea label="Generated UUIDs" hideLabel readOnly value={text} rows={Math.min(16, amount + 1)} />
      </Panel>
    </div>
  );
}

// ---- Random strings

export function RandomStringGenerator() {
  const [length, setLength] = useState("32");
  const [count, setCount] = useState("5");
  const [sets, setSets] = useState<(keyof typeof CHARSETS)[]>(["lower", "upper", "digits"]);
  const [custom, setCustom] = useState("");
  const [noAmbiguous, setNoAmbiguous] = useState(false);
  const [prefix, setPrefix] = useState("");
  const [seed, setSeed] = useState(0);
  const size = clampInt(length, 1, 4096, 32);
  const amount = clampInt(count, 1, 500, 1);
  const alphabet = buildAlphabet(sets, custom, noAmbiguous);
  const strings = useMemo(() => (alphabet ? Array.from({ length: amount }, () => prefix + randomString(size, alphabet)) : []), [alphabet, amount, size, prefix, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const text = strings.join("\n");
  const bits = alphabet ? Math.floor(size * Math.log2(new Set(alphabet).size)) : 0;
  const toggle = (set: keyof typeof CHARSETS) => (checked: boolean) => setSets((current) => (checked ? [...current, set] : current.filter((s) => s !== set)));
  const labels: Record<keyof typeof CHARSETS, string> = { lower: "Lowercase a–z", upper: "Uppercase A–Z", digits: "Digits 0–9", symbols: "Symbols !@#…", hex: "Hex 0–9 a–f" };
  return (
    <div className="space-y-4">
      <Panel title="Options">
        <div className="grid gap-4 sm:grid-cols-3"><NumberField label="Length" value={length} onChange={setLength} hint="1 to 4,096" /><NumberField label="How many" value={count} onChange={setCount} hint="1 to 500" /><TextField label="Prefix (optional)" value={prefix} onChange={setPrefix} placeholder="sk_live_" /></div>
        <div className="grid gap-3 sm:grid-cols-3">{(Object.keys(CHARSETS) as (keyof typeof CHARSETS)[]).map((set) => <CheckboxField key={set} label={labels[set]} checked={sets.includes(set)} onChange={toggle(set)} />)}<CheckboxField label="Leave out look-alikes (I l 1 O 0 o)" checked={noAmbiguous} onChange={setNoAmbiguous} /></div>
        <TextField label="Extra characters" value={custom} onChange={setCustom} placeholder="e.g. -_." />
      </Panel>
      {!alphabet ? <ErrorNote>Choose at least one set of characters.</ErrorNote> : (
        <Panel title="Random strings" actions={<><Button variant="outline" onClick={() => setSeed((s) => s + 1)}><RefreshCw /> Regenerate</Button><CopyText text={text} label="Copy all" /></>}>
          <CodeArea label="Generated strings" hideLabel readOnly value={text} rows={Math.min(14, amount + 1)} />
          <Hint>About {bits} bits of entropy per string ({new Set(alphabet).size} possible characters). 128 bits or more is plenty for API keys and tokens.</Hint>
        </Panel>
      )}
    </div>
  );
}

// ---- Hashes

export function HashGenerator() {
  const [source, setSource] = useState<"text" | "file">("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [output, setOutput] = useState<"hex" | "HEX" | "base64">("hex");
  const [hashes, setHashes] = useState<Partial<Record<HashAlgorithm, string>>>({});
  const [busy, setBusy] = useState(false);
  const [compare, setCompare] = useState("");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const bytes = source === "text" ? new TextEncoder().encode(text) : file ? new Uint8Array(await file.arrayBuffer()) : null;
      if (!bytes || (source === "text" && !text)) { setHashes({}); return; }
      setBusy(true);
      const entries = await Promise.all(HASH_ALGORITHMS.map(async (algorithm) => [algorithm, await hashBytes(algorithm, bytes)] as const));
      if (!cancelled) { setHashes(Object.fromEntries(entries)); setBusy(false); }
    };
    const timer = setTimeout(run, 120);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [source, text, file]);

  const show = (hex: string) => (output === "HEX" ? hex.toUpperCase() : output === "base64" ? hexToBase64(hex) : hex);
  const needle = compare.trim().toLowerCase();
  const match = needle ? HASH_ALGORITHMS.find((a) => hashes[a] && (hashes[a] === needle || hexToBase64(hashes[a]!).toLowerCase() === needle)) : undefined;
  return (
    <div className="space-y-4">
      <Panel>
        <div className="flex flex-wrap items-end gap-4">
          <SegmentedControl label="Hash" value={source} onChange={setSource} options={[{ value: "text", label: "Text" }, { value: "file", label: "File" }]} />
          <SegmentedControl label="Output" value={output} onChange={setOutput} options={[{ value: "hex", label: "hex" }, { value: "HEX", label: "HEX" }, { value: "base64", label: "Base64" }]} />
        </div>
        {source === "text"
          ? <CodeArea label="Text to hash" value={text} onChange={setText} rows={5} placeholder="Type or paste text… (hashed as UTF-8)" />
          : <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed p-5 text-center hover:border-primary/50">
            <FileUp className="size-6 text-muted-foreground" aria-hidden />
            <span className="font-medium">{file ? `${file.name} (${formatBytes(file.size)})` : "Choose a file to hash"}</span>
            <span className="text-xs text-muted-foreground">Hashed on your device — the file isn&apos;t uploaded.</span>
            <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>}
      </Panel>
      <Panel title={busy ? "Hashing…" : "Hashes"}>
        <ValueRows rows={HASH_ALGORITHMS.map((algorithm) => ({ label: algorithm, value: hashes[algorithm] ? show(hashes[algorithm]!) : "", mono: true }))} />
        <TextField label="Compare with a checksum" value={compare} onChange={setCompare} placeholder="Paste the expected hash" />
        {needle && Object.keys(hashes).length > 0 && (match ? <OkNote>Matches the {match} hash.</OkNote> : <ErrorNote>Doesn&apos;t match any of the hashes above.</ErrorNote>)}
        <Hint>MD5 and SHA-1 are fine for checksums but broken for security. Use SHA-256 or better, and bcrypt or Argon2 for passwords.</Hint>
      </Panel>
    </div>
  );
}

// ---- Unix timestamps

function pad(n: number) { return String(n).padStart(2, "0"); }
function localInputValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function UnixTimestampGenerator() {
  const [now, setNow] = useState(() => Date.now());
  const [date, setDate] = useState(() => localInputValue(new Date()));
  const [time, setTime] = useState("00:00:00");
  const [zone, setZone] = useState<"local" | "utc">("local");
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const picked = useMemo(() => {
    const [y, m, d] = date.split("-").map(Number);
    const [hh = 0, mm = 0, ss = 0] = time.split(":").map(Number);
    if (!y || !m || !d) return null;
    return zone === "utc" ? new Date(Date.UTC(y, m - 1, d, hh, mm, ss)) : new Date(y, m - 1, d, hh, mm, ss);
  }, [date, time, zone]);
  const seconds = Math.floor(now / 1000);
  const pickedSeconds = picked ? Math.floor(picked.getTime() / 1000) : null;
  const presets = [
    { label: "Now", value: seconds }, { label: "+1 hour", value: seconds + 3600 }, { label: "+1 day", value: seconds + 86400 }, { label: "+7 days", value: seconds + 604800 },
    { label: "+30 days", value: seconds + 2592000 }, { label: "Start of today (UTC)", value: Math.floor(Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth(), new Date(now).getUTCDate()) / 1000) },
  ];
  return (
    <div className="space-y-4">
      <Panel title="Current Unix time">
        <p className="font-mono text-4xl font-bold tabular-nums">{seconds}</p>
        <div className="flex flex-wrap gap-2"><CopyText text={String(seconds)} label="Copy seconds" /><CopyText text={String(now)} label="Copy milliseconds" /></div>
        <p className="text-sm text-muted-foreground">{new Date(now).toUTCString()}</p>
      </Panel>
      <TwoPane
        left={<Panel title="Date to timestamp">
          <div className="grid gap-4 sm:grid-cols-2"><DateField label="Date" value={date} onChange={setDate} /><TextField label="Time (HH:MM:SS)" value={time} onChange={setTime} placeholder="14:30:00" /></div>
          <SegmentedControl label="Time zone" value={zone} onChange={setZone} options={[{ value: "local", label: `Local (${Intl.DateTimeFormat().resolvedOptions().timeZone})` }, { value: "utc", label: "UTC" }]} />
          {pickedSeconds !== null && !Number.isNaN(pickedSeconds)
            ? <ValueRows rows={[{ label: "Seconds", value: String(pickedSeconds), mono: true }, { label: "Milliseconds", value: String(picked!.getTime()), mono: true }, { label: "ISO 8601 (UTC)", value: picked!.toISOString(), mono: true }]} />
            : <ErrorNote>Enter a valid date and time.</ErrorNote>}
        </Panel>}
        right={<Panel title="Quick timestamps">
          <ValueRows rows={presets.map((p) => ({ label: p.label, value: String(p.value), mono: true }))} />
          <Hint>Code: JavaScript Math.floor(Date.now() / 1000) · Python int(time.time()) · PHP time() · SQL UNIX_TIMESTAMP() · Bash date +%s</Hint>
        </Panel>}
      />
    </div>
  );
}

// ---- Cron

const CRON_PRESETS = [
  { value: "* * * * *", label: "Every minute" }, { value: "*/5 * * * *", label: "Every 5 minutes" }, { value: "*/15 * * * *", label: "Every 15 minutes" },
  { value: "0 * * * *", label: "Every hour" }, { value: "0 */6 * * *", label: "Every 6 hours" }, { value: "0 0 * * *", label: "Every day at midnight" },
  { value: "30 9 * * 1-5", label: "Weekdays at 09:30" }, { value: "0 18 * * 5", label: "Fridays at 18:00" }, { value: "0 0 * * 0", label: "Every Sunday" },
  { value: "0 0 1 * *", label: "First of every month" }, { value: "0 9 1 1,4,7,10 *", label: "Quarterly (1st, 09:00)" }, { value: "0 0 1 1 *", label: "Every year on 1 January" },
];
const FIELD_LABELS = ["Minute", "Hour", "Day of month", "Month", "Day of week"];
const FIELD_HINTS = ["0–59", "0–23", "1–31", "1–12 or JAN–DEC", "0–6 or SUN–SAT"];

export function CronGenerator() {
  const [expression, setExpression] = useState("30 9 * * 1-5");
  const [now] = useState(() => new Date());
  const parts = expression.trim().split(/\s+/);
  const fields = parts.length === 5 ? parts : ["*", "*", "*", "*", "*"];
  const parsed = parseCron(expression);
  const setField = (index: number) => (value: string) => { const next = [...fields]; next[index] = value.replace(/\s+/g, "") || "*"; setExpression(next.join(" ")); };
  const runs = parsed.ok ? nextCronRuns(parsed.value, now, 8) : [];
  return (
    <div className="space-y-4">
      <Panel title="Cron expression">
        <TextField label="Expression" value={expression} onChange={setExpression} placeholder="*/5 * * * *" />
        <div className="grid gap-3 sm:grid-cols-5">{FIELD_LABELS.map((label, i) => <TextField key={label} label={label} value={fields[i]} onChange={setField(i)} hint={FIELD_HINTS[i]} />)}</div>
        <SelectField label="Start from a preset" value={(CRON_PRESETS.find((p) => p.value === expression.trim())?.value ?? "") as string} onChange={setExpression} options={[{ value: "", label: "Choose a common schedule…" }, ...CRON_PRESETS]} />
      </Panel>
      {parsed.ok
        ? <TwoPane
          left={<Panel title="Meaning" actions={<CopyText text={expression.trim()} label="Copy expression" />}><p className="text-lg font-medium">{describeCron(parsed.value)}</p><Hint>Times are in the server&apos;s time zone where the job runs. Syntax: * any · */n every n · a-b range · a,b list. Also accepts @hourly, @daily, @weekly, @monthly and @yearly.</Hint></Panel>}
          right={<Panel title="Next runs (your local time)"><ol className="space-y-1.5 text-sm">{runs.map((run) => <li key={run.getTime()} className="font-mono tabular-nums">{run.toLocaleString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</li>)}</ol>{runs.length === 0 && <Hint>This schedule doesn&apos;t run in the next five years (e.g. 31 February).</Hint>}</Panel>}
        />
        : <ErrorNote>{parsed.error}</ErrorNote>}
    </div>
  );
}

// ---- Regex generator

export function RegexGenerator() {
  const [presetId, setPresetId] = useState(REGEX_PRESETS[0].id);
  const [anchor, setAnchor] = useState(false);
  const [caseless, setCaseless] = useState(false);
  const preset = REGEX_PRESETS.find((p) => p.id === presetId)!;
  const anchored = preset.pattern.startsWith("^") || !anchor ? preset.pattern : `^(?:${preset.pattern})$`;
  const flags = [...new Set((preset.flags + (caseless ? "i" : "")).split(""))].filter((f) => !(anchor && f === "g" && !preset.pattern.startsWith("^"))).join("");
  const literal = `/${anchored.replace(/\//g, "\\/")}/${flags}`;
  return (
    <div className="space-y-4">
      <Panel title="Pattern">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="What should it match?" value={presetId} onChange={setPresetId} options={REGEX_PRESETS.map((p) => ({ value: p.id, label: p.name }))} />
          <div className="flex flex-col justify-end gap-2"><CheckboxField label="Match the whole input only (^…$)" checked={anchor || preset.pattern.startsWith("^")} onChange={setAnchor} /><CheckboxField label="Ignore case (i)" checked={caseless || preset.flags.includes("i")} onChange={setCaseless} /></div>
        </div>
        {preset.note && <Hint>{preset.note}</Hint>}
        <ValueRows rows={[{ label: "JavaScript", value: literal, mono: true }, { label: "Pattern only", value: anchored, mono: true }, { label: "Python", value: `re.compile(r"${anchored.replace(/"/g, "\\\"")}"${flags.includes("i") ? ", re.IGNORECASE" : ""})`, mono: true }]} />
      </Panel>
      <RegexTester key={`${presetId}-${anchored}-${flags}`} initialPattern={anchored} initialFlags={flags || ""} initialText={preset.sample} />
    </div>
  );
}

// ---- cURL

export function CurlGenerator() {
  const [spec, setSpecState] = useState<HttpRequestSpec>({ method: "POST", url: "https://api.example.com/users", headers: [{ name: "Content-Type", value: "application/json" }, { name: "Accept", value: "application/json" }], body: '{\n  "name": "Asha",\n  "email": "asha@example.com"\n}', auth: { type: "bearer", token: "YOUR_TOKEN" } });
  const [shell, setShell] = useState<"posix" | "cmd">("posix");
  const [flags, setFlags] = useState({ followRedirects: true, insecure: false, verbose: false });
  const setSpec = (update: (s: HttpRequestSpec) => HttpRequestSpec) => setSpecState(update);
  const command = buildCurl({ ...spec, ...flags, body: ["GET", "HEAD"].includes(spec.method) ? "" : spec.body }, shell);
  return (
    <TwoPane
      left={<Panel title="Request"><RequestFields spec={spec} setSpec={setSpec} />
        <div className="grid gap-2 sm:grid-cols-3"><CheckboxField label="Follow redirects (-L)" checked={flags.followRedirects} onChange={(v) => setFlags((f) => ({ ...f, followRedirects: v }))} /><CheckboxField label="Skip TLS checks (-k)" checked={flags.insecure} onChange={(v) => setFlags((f) => ({ ...f, insecure: v }))} /><CheckboxField label="Verbose (-v)" checked={flags.verbose} onChange={(v) => setFlags((f) => ({ ...f, verbose: v }))} /></div>
      </Panel>}
      right={<Panel title="cURL command" actions={<CopyText text={command} />}>
        <SegmentedControl label="Shell" value={shell} onChange={setShell} options={[{ value: "posix", label: "Linux / macOS / Git Bash" }, { value: "cmd", label: "Windows cmd" }]} />
        <CodeArea label="Command" hideLabel readOnly value={command} rows={14} />
        {!/^https?:\/\//i.test(spec.url.trim()) && <ErrorNote>The URL should start with http:// or https://.</ErrorNote>}
      </Panel>}
    />
  );
}
