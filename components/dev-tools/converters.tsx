"use client";

import { useEffect, useMemo, useState } from "react";
import { parseJson, xmlToJson, type Result } from "@/lib/dev-tools/code";
import {
  SIZE_UNITS, convertSize, csvToJson, formatSize, groupDigits, guessTimestampUnit, jsonToCsv, parseBigInt, relativeTime, timestampToDate, toBase,
  type SizeUnit, type TimestampUnit,
} from "@/lib/dev-tools/convert";
import { CheckboxField, NumberField, SegmentedControl, SelectField, TextField } from "@/components/shared/form-fields";
import { Button } from "@/components/ui/button";
import { CodeArea, CopyText, DownloadText, ErrorNote, Hint, OpenFileButton, Panel, TwoPane, ValueRows } from "@/components/dev-tools/shared";

// ---- Timestamp

const ZONES = ["UTC", "Asia/Kolkata", "America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Berlin", "Asia/Dubai", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney"];

export function TimestampConverter() {
  const [input, setInput] = useState(() => String(Math.floor(Date.now() / 1000)));
  const [unit, setUnit] = useState<TimestampUnit | "auto">("auto");
  const [dateInput, setDateInput] = useState("");
  const [now] = useState(() => Date.now());
  const effectiveUnit = unit === "auto" ? guessTimestampUnit(input.trim()) : unit;
  const date = input.trim() ? timestampToDate(input.trim(), effectiveUnit) : null;
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const fmt = (zone: string) => date!.toLocaleString("en-GB", { timeZone: zone, weekday: "short", year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZoneName: "short" });
  const parsedDate = dateInput.trim() ? new Date(dateInput.trim()) : null;
  return (
    <div className="space-y-4">
      <TwoPane
        left={<Panel title="Timestamp to date">
          <TextField label="Unix timestamp" value={input} onChange={setInput} placeholder="1700000000" />
          <SegmentedControl label="Unit" value={unit} onChange={setUnit} options={[{ value: "auto", label: `Auto (${effectiveUnit === "s" ? "seconds" : effectiveUnit === "ms" ? "milliseconds" : "microseconds"})` }, { value: "s", label: "Seconds" }, { value: "ms", label: "Milliseconds" }, { value: "us", label: "Microseconds" }]} />
          {input.trim() && !date && <ErrorNote>Enter a whole number of seconds, milliseconds or microseconds since 1 January 1970 (UTC).</ErrorNote>}
          <Button variant="outline" onClick={() => { setInput(String(Math.floor(Date.now() / 1000))); setUnit("auto"); }}>Use current time</Button>
        </Panel>}
        right={<Panel title="Date to timestamp">
          <TextField label="Date and time" value={dateInput} onChange={setDateInput} placeholder="2025-08-15 14:30 or 2025-08-15T09:00:00Z" hint="ISO 8601 or a common date format. Without a zone, your local time is used." />
          {parsedDate && (Number.isNaN(parsedDate.getTime()) ? <ErrorNote>That date couldn&apos;t be read. Try YYYY-MM-DD HH:MM.</ErrorNote>
            : <ValueRows rows={[{ label: "Seconds", value: String(Math.floor(parsedDate.getTime() / 1000)), mono: true }, { label: "Milliseconds", value: String(parsedDate.getTime()), mono: true }]} />)}
        </Panel>}
      />
      {date && <Panel title="Date">
        <ValueRows rows={[
          { label: "Relative", value: relativeTime(date, now) },
          { label: `Your time (${localZone})`, value: fmt(localZone) },
          { label: "ISO 8601 (UTC)", value: date.toISOString(), mono: true },
          { label: "RFC 2822", value: date.toUTCString(), mono: true },
          { label: "Seconds", value: String(Math.floor(date.getTime() / 1000)), mono: true },
          { label: "Milliseconds", value: String(date.getTime()), mono: true },
          ...ZONES.filter((zone) => zone !== localZone).map((zone) => ({ label: zone, value: fmt(zone) })),
        ]} />
      </Panel>}
    </div>
  );
}

// ---- Number base

const BASES = [
  { base: 2, label: "Binary", group: 4 }, { base: 8, label: "Octal", group: 3 }, { base: 10, label: "Decimal", group: 3 }, { base: 16, label: "Hexadecimal", group: 4 },
];

export function NumberBaseConverter() {
  const [value, setValue] = useState("255");
  const [from, setFrom] = useState(10);
  const [custom, setCustom] = useState("36");
  const [grouped, setGrouped] = useState(true);
  const parsed = value.trim() ? parseBigInt(value, from) : null;
  const customBase = Math.min(36, Math.max(2, Number.parseInt(custom, 10) || 36));
  const show = (base: number, size: number) => {
    if (!parsed?.ok) return "";
    const text = toBase(parsed.value, base);
    return grouped ? groupDigits(text, size, base === 10 ? "," : " ") : text;
  };
  return (
    <div className="space-y-4">
      <Panel>
        <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
          <TextField label="Number" value={value} onChange={setValue} placeholder="255" />
          <SelectField label="Input base" value={String(from)} onChange={(v) => setFrom(Number(v))} options={[...BASES.map((b) => ({ value: String(b.base), label: `${b.label} (${b.base})` })), ...Array.from({ length: 35 }, (_, i) => i + 2).filter((b) => ![2, 8, 10, 16].includes(b)).map((b) => ({ value: String(b), label: `Base ${b}` }))]} />
        </div>
        <CheckboxField label="Group digits for readability" checked={grouped} onChange={setGrouped} />
        {parsed && !parsed.ok && <ErrorNote>{parsed.error}</ErrorNote>}
      </Panel>
      {parsed?.ok && <Panel title="Converted">
        <ValueRows rows={[
          ...BASES.map((b) => ({ label: `${b.label} (${b.base})`, value: show(b.base, b.group), mono: true })),
          { label: `Base ${customBase}`, value: show(customBase, 4), mono: true },
          { label: "Bits needed", value: String(parsed.value < BigInt(0) ? toBase(-parsed.value, 2).length + 1 : toBase(parsed.value, 2).length) },
        ]} />
        <div className="max-w-40"><NumberField label="Custom base (2–36)" value={custom} onChange={setCustom} /></div>
      </Panel>}
    </div>
  );
}

// ---- File size

export function FileSizeConverter() {
  const [value, setValue] = useState("1");
  const [unit, setUnit] = useState<SizeUnit>("GB");
  const amount = Number(value);
  const valid = value.trim() !== "" && Number.isFinite(amount) && amount >= 0;
  const results = valid ? convertSize(amount, unit) : [];
  return (
    <div className="space-y-4">
      <Panel>
        <div className="grid gap-4 sm:grid-cols-[1fr_14rem]">
          <NumberField label="Size" value={value} onChange={setValue} />
          <SelectField label="Unit" value={unit} onChange={setUnit} options={SIZE_UNITS.map((u) => ({ value: u.id, label: u.label }))} />
        </div>
        {!valid && value.trim() && <ErrorNote>Enter a number of zero or more.</ErrorNote>}
      </Panel>
      {valid && <TwoPane
        left={<Panel title="Decimal (SI, 1 KB = 1000 B)"><ValueRows rows={results.filter((r) => ["B", "KB", "MB", "GB", "TB", "PB", "bit"].includes(r.id)).map((r) => ({ label: r.label, value: formatSize(r.value), mono: true }))} /></Panel>}
        right={<Panel title="Binary (IEC, 1 KiB = 1024 B)"><ValueRows rows={results.filter((r) => ["KiB", "MiB", "GiB", "TiB", "PiB"].includes(r.id)).map((r) => ({ label: r.label, value: formatSize(r.value), mono: true }))} /><Hint>Windows shows binary sizes but labels them KB, MB and GB — which is why a 1 TB drive appears as about 931 GB.</Hint></Panel>}
      />}
    </div>
  );
}

// ---- Data formats

export type DataFormat = "csv" | "json" | "yaml" | "xml";

const DATA_SAMPLES: Record<DataFormat, string> = {
  csv: "name,age,city,active\nAsha,31,Pune,true\nRavi,27,\"Mumbai, MH\",false\n",
  json: '[\n  { "name": "Asha", "age": 31, "address": { "city": "Pune" }, "active": true },\n  { "name": "Ravi", "age": 27, "address": { "city": "Mumbai" }, "active": false }\n]',
  yaml: "service:\n  name: api\n  replicas: 3\n  ports:\n    - 80\n    - 443\n  env:\n    NODE_ENV: production\n",
  xml: '<?xml version="1.0"?>\n<catalog>\n  <book id="bk101" available="true">\n    <title>XML Developer&apos;s Guide</title>\n    <price currency="INR">499</price>\n  </book>\n  <book id="bk102" available="false">\n    <title>Midnight Rain</title>\n    <price currency="INR">299</price>\n  </book>\n</catalog>\n',
};
const MIME: Record<DataFormat, string> = { csv: "text/csv", json: "application/json", yaml: "application/yaml", xml: "application/xml" };

export function DataConverter({ from, to }: { from: DataFormat; to: DataFormat }) {
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState("2");
  const [delimiter, setDelimiter] = useState("auto");
  const [header, setHeader] = useState(true);
  const [types, setTypes] = useState(true);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async (): Promise<Result | null> => {
      if (!input.trim()) return null;
      const spaces = Number(indent);
      if (from === "csv") {
        const data = csvToJson(input, { delimiter: delimiter === "auto" ? undefined : delimiter === "tab" ? "\t" : delimiter, header, types });
        return data.ok ? { ok: true, value: JSON.stringify(data.value, null, spaces) } : data;
      }
      if (from === "xml") {
        const data = xmlToJson(input, { types });
        return data.ok ? { ok: true, value: JSON.stringify(data.value, null, spaces) } : data;
      }
      if (from === "json") {
        const data = parseJson(input);
        if (!data.ok) return data;
        if (to === "csv") return jsonToCsv(data.value, delimiter === "tab" ? "\t" : delimiter === "auto" ? "," : delimiter);
        const { dump } = await import("js-yaml");
        return { ok: true, value: dump(data.value, { indent: spaces, lineWidth: -1, noRefs: true }) };
      }
      const { loadAll } = await import("js-yaml");
      try {
        const docs = loadAll(input);
        return { ok: true, value: JSON.stringify(docs.length === 1 ? docs[0] : docs, null, spaces) };
      } catch (error) {
        const message = error instanceof Error ? error.message.split("\n")[0] : String(error);
        return { ok: false, error: message.replace(/\((\d+):(\d+)\)$/, "— line $1, column $2") };
      }
    };
    const timer = setTimeout(() => run().then((r) => { if (!cancelled) setResult(r); }), 150);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [input, from, to, indent, delimiter, header, types]);

  const output = result?.ok ? result.value : "";
  const label = { csv: "CSV", json: "JSON", yaml: "YAML", xml: "XML" };
  const rows = useMemo(() => (from === "csv" && output ? (JSON.parse(output) as unknown[]).length : null), [from, output]);
  return (
    <div className="space-y-4">
      <Panel>
        <div className="flex flex-wrap items-end gap-4">
          {to !== "csv" && <SelectField label="Indentation" value={indent} onChange={setIndent} options={[{ value: "2", label: "2 spaces" }, { value: "4", label: "4 spaces" }]} className="w-40" />}
          {(from === "csv" || to === "csv") && <SelectField label="Delimiter" value={delimiter} onChange={setDelimiter} className="w-44" options={[...(from === "csv" ? [{ value: "auto", label: "Auto-detect" }] : [{ value: "auto", label: "Comma ," }]), { value: ",", label: "Comma ," }, { value: ";", label: "Semicolon ;" }, { value: "tab", label: "Tab" }, { value: "|", label: "Pipe |" }]} />}
          {from === "xml" && <CheckboxField label="Detect numbers and true/false" checked={types} onChange={setTypes} className="pb-2" />}
          {from === "csv" && <><CheckboxField label="First row is headers" checked={header} onChange={setHeader} className="pb-2" /><CheckboxField label="Detect numbers and true/false" checked={types} onChange={setTypes} className="pb-2" /></>}
        </div>
      </Panel>
      <TwoPane
        left={<Panel title={label[from]} actions={<><OpenFileButton accept={from === "yaml" ? ".yaml,.yml" : `.${from}`} onText={setInput} /><Button variant="ghost" size="lg" onClick={() => setInput(DATA_SAMPLES[from])}>Sample</Button></>}>
          <CodeArea label={`${label[from]} input`} hideLabel value={input} onChange={setInput} rows={18} placeholder={`Paste ${label[from]} here…`} invalid={result?.ok === false} />
        </Panel>}
        right={<Panel title={label[to]} actions={<><CopyText text={output} /><DownloadText text={output} fileName={`converted.${to === "yaml" ? "yaml" : to}`} type={MIME[to]} /></>}>
          <CodeArea label={`${label[to]} output`} hideLabel value={output} readOnly rows={18} placeholder="The result appears as you type." />
          {result?.ok === false && <ErrorNote>{result.error}</ErrorNote>}
          {rows !== null && <Hint>{rows} {rows === 1 ? "row" : "rows"} converted.</Hint>}
        </Panel>}
      />
    </div>
  );
}
