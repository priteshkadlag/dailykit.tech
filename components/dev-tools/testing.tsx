"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { formatBytes, parseJson } from "@/lib/dev-tools/code";
import { buildCurl, buildFetch, type HttpRequestSpec } from "@/lib/dev-tools/generate";
import { checkEmail, diffLines, diffWords, type DiffOp, type EmailCheck } from "@/lib/dev-tools/web";
import { cn } from "@/lib/utils";
import { CheckboxField, SegmentedControl, SelectField, TextField } from "@/components/shared/form-fields";
import { Button } from "@/components/ui/button";
import { CodeArea, CopyText, DownloadText, ErrorNote, Hint, OkNote, Panel, TwoPane, ValueRows } from "@/components/dev-tools/shared";
import { RequestFields } from "@/components/dev-tools/request-fields";

// ---- Regex tester

const FLAGS = [
  { flag: "g", label: "global" }, { flag: "i", label: "ignore case" }, { flag: "m", label: "multiline" }, { flag: "s", label: "dot matches newline" }, { flag: "u", label: "unicode" }, { flag: "y", label: "sticky" },
];

export function RegexTester({ initialPattern = "\\b(\\w+)@(\\w+)\\.com\\b", initialFlags = "g", initialText = "Contact asha@example.com or ravi@test.com today." }: { initialPattern?: string; initialFlags?: string; initialText?: string }) {
  const [pattern, setPattern] = useState(initialPattern);
  const [flags, setFlags] = useState(initialFlags);
  const [text, setText] = useState(initialText);
  const [replacement, setReplacement] = useState("");
  const compiled = useMemo(() => {
    if (!pattern) return null;
    try { return { regex: new RegExp(pattern, flags) }; } catch (error) { return { error: error instanceof Error ? error.message.replace(/^Invalid regular expression: /, "") : String(error) }; }
  }, [pattern, flags]);
  const matches = useMemo(() => {
    if (!compiled || !("regex" in compiled) || !compiled.regex) return [];
    const regex = new RegExp(compiled.regex.source, compiled.regex.flags.includes("g") ? compiled.regex.flags : `${compiled.regex.flags}g`);
    const found: RegExpExecArray[] = [];
    for (let match = regex.exec(text); match && found.length < 1000; match = regex.exec(text)) {
      found.push(match);
      if (match[0] === "") regex.lastIndex++;
      if (!compiled.regex.flags.includes("g")) break;
    }
    return found;
  }, [compiled, text]);
  const highlighted = useMemo(() => {
    const parts: React.ReactNode[] = [];
    let at = 0;
    matches.forEach((m, i) => {
      if (m.index > at) parts.push(text.slice(at, m.index));
      parts.push(<mark key={i} className={cn("rounded-sm px-px", i % 2 ? "bg-sky-200 dark:bg-sky-800" : "bg-amber-200 dark:bg-amber-700")}>{m[0] || "​"}</mark>);
      at = m.index + m[0].length;
    });
    parts.push(text.slice(at));
    return parts;
  }, [matches, text]);
  const replaced = compiled && "regex" in compiled && compiled.regex && replacement !== "" ? text.replace(compiled.regex, replacement) : "";
  const toggleFlag = (flag: string) => (on: boolean) => setFlags((f) => (on ? `${f}${flag}` : f.replace(flag, "")));
  return (
    <div className="space-y-4">
      <Panel title="Regular expression">
        <div className="flex items-center gap-1 rounded-lg border bg-background px-3 font-mono text-sm focus-within:ring-3 focus-within:ring-ring/50">
          <span className="text-muted-foreground">/</span>
          <input aria-label="Pattern" value={pattern} onChange={(e) => setPattern(e.target.value)} spellCheck={false} className="h-11 min-w-0 flex-1 bg-transparent outline-none" />
          <span className="text-muted-foreground">/{flags}</span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">{FLAGS.map(({ flag, label }) => <CheckboxField key={flag} label={`${flag} · ${label}`} checked={flags.includes(flag)} onChange={toggleFlag(flag)} />)}</div>
        {compiled && "error" in compiled && <ErrorNote>{compiled.error}</ErrorNote>}
      </Panel>
      <TwoPane
        left={<Panel title="Test text"><CodeArea label="Test text" hideLabel value={text} onChange={setText} rows={10} /></Panel>}
        right={<Panel title={`${matches.length} match${matches.length === 1 ? "" : "es"}`}>
          <div className="max-h-60 min-h-24 overflow-auto rounded-lg border bg-muted/30 p-3 font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-words">{highlighted}</div>
          {matches.length > 0 && <div className="max-h-56 overflow-auto rounded-lg border"><table className="w-full text-left text-xs"><thead className="bg-muted/60"><tr><th className="px-2 py-1.5">#</th><th className="px-2 py-1.5">Match</th><th className="px-2 py-1.5">Index</th><th className="px-2 py-1.5">Groups</th></tr></thead>
            <tbody>{matches.slice(0, 200).map((m, i) => <tr key={i} className="border-t align-top"><td className="px-2 py-1.5 text-muted-foreground">{i + 1}</td><td className="px-2 py-1.5 font-mono break-all">{m[0]}</td><td className="px-2 py-1.5 tabular-nums">{m.index}</td>
              <td className="px-2 py-1.5 font-mono break-all">{[...m.slice(1).map((g, j) => `$${j + 1}: ${g ?? "—"}`), ...Object.entries(m.groups ?? {}).map(([k, g]) => `${k}: ${g ?? "—"}`)].join("  ·  ") || "—"}</td></tr>)}</tbody></table></div>}
        </Panel>}
      />
      <Panel title="Replace">
        <TextField label="Replacement" value={replacement} onChange={setReplacement} placeholder="$2 → $1  (use $1, $2 or $<name> for groups)" />
        {replaced && <CodeArea label="Result" readOnly value={replaced} rows={5} />}
      </Panel>
    </div>
  );
}

// ---- Diff checker

type Row = { left?: string; right?: string; type: "same" | "change" | "add" | "remove"; leftNo?: number; rightNo?: number };

function toRows(ops: DiffOp[]): Row[] {
  const rows: Row[] = [];
  let l = 0;
  let r = 0;
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    if (op.type === "same") { rows.push({ left: op.text, right: op.text, type: "same", leftNo: ++l, rightNo: ++r }); continue; }
    // Pair a run of removals with the following run of additions as changed lines.
    const removed: string[] = [];
    const added: string[] = [];
    while (i < ops.length && ops[i].type === "remove") removed.push(ops[i++].text);
    while (i < ops.length && ops[i].type === "add") added.push(ops[i++].text);
    i--;
    for (let k = 0; k < Math.max(removed.length, added.length); k++) {
      const left = removed[k];
      const right = added[k];
      rows.push({ left, right, type: left !== undefined && right !== undefined ? "change" : left !== undefined ? "remove" : "add", leftNo: left !== undefined ? ++l : undefined, rightNo: right !== undefined ? ++r : undefined });
    }
  }
  return rows;
}

function WordHighlight({ from, to, side }: { from: string; to: string; side: "left" | "right" }) {
  const ops = diffWords(from, to);
  return <>{ops.filter((op) => op.type === "same" || op.type === (side === "left" ? "remove" : "add")).map((op, i) => op.type === "same" ? op.text : <mark key={i} className={side === "left" ? "rounded-sm bg-red-300/70 dark:bg-red-800" : "rounded-sm bg-emerald-300/70 dark:bg-emerald-800"}>{op.text}</mark>)}</>;
}

export function DiffChecker() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [view, setView] = useState<"split" | "unified">("split");
  const [hideSame, setHideSame] = useState(false);
  const rows = useMemo(() => (left || right ? toRows(diffLines(left, right, { ignoreWhitespace, ignoreCase })) : []), [left, right, ignoreWhitespace, ignoreCase]);
  const stats = { add: rows.filter((r) => r.type === "add" || r.type === "change").length, remove: rows.filter((r) => r.type === "remove" || r.type === "change").length };
  const shown = hideSame ? rows.filter((r) => r.type !== "same") : rows;
  const cell = "px-2 py-0.5 align-top font-mono text-[12.5px] whitespace-pre-wrap break-all";
  const num = "w-10 select-none px-2 py-0.5 text-right align-top font-mono text-[11px] text-muted-foreground";
  return (
    <div className="space-y-4">
      <TwoPane
        left={<Panel title="Original"><CodeArea label="Original text" hideLabel value={left} onChange={setLeft} rows={12} placeholder="Paste the original text…" /></Panel>}
        right={<Panel title="Changed"><CodeArea label="Changed text" hideLabel value={right} onChange={setRight} rows={12} placeholder="Paste the changed text…" /></Panel>}
      />
      <Panel title={rows.length ? <>Differences <span className="font-normal text-muted-foreground">· <span className="text-emerald-600 dark:text-emerald-400">+{stats.add}</span> <span className="text-red-600 dark:text-red-400">−{stats.remove}</span></span></> : "Differences"}>
        <div className="flex flex-wrap items-end gap-4">
          <SegmentedControl label="View" value={view} onChange={setView} options={[{ value: "split", label: "Side by side" }, { value: "unified", label: "Inline" }]} />
          <CheckboxField label="Ignore whitespace" checked={ignoreWhitespace} onChange={setIgnoreWhitespace} className="pb-2" />
          <CheckboxField label="Ignore case" checked={ignoreCase} onChange={setIgnoreCase} className="pb-2" />
          <CheckboxField label="Only show changes" checked={hideSame} onChange={setHideSame} className="pb-2" />
        </div>
        {!rows.length ? <Hint>Paste text in both boxes to compare them.</Hint> : stats.add + stats.remove === 0 ? <OkNote>The texts are identical{ignoreWhitespace || ignoreCase ? " (with the ignore options)" : ""}.</OkNote> : (
          <div className="max-h-[36rem] overflow-auto rounded-lg border">
            <table className="w-full border-collapse">
              <tbody>
                {view === "split" ? shown.map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className={num}>{row.leftNo}</td>
                    <td className={cn(cell, "w-1/2", (row.type === "remove" || row.type === "change") && "bg-red-50 dark:bg-red-950/40")}>{row.type === "change" ? <WordHighlight from={row.left!} to={row.right!} side="left" /> : row.left}</td>
                    <td className={num}>{row.rightNo}</td>
                    <td className={cn(cell, "w-1/2 border-l", (row.type === "add" || row.type === "change") && "bg-emerald-50 dark:bg-emerald-950/40")}>{row.type === "change" ? <WordHighlight from={row.left!} to={row.right!} side="right" /> : row.right}</td>
                  </tr>
                )) : shown.flatMap((row, i) => {
                  const line = (text: string, kind: "same" | "add" | "remove", no?: number) => (
                    <tr key={`${i}-${kind}`} className={cn(kind === "add" && "bg-emerald-50 dark:bg-emerald-950/40", kind === "remove" && "bg-red-50 dark:bg-red-950/40")}>
                      <td className={num}>{no}</td><td className={cn(num, "w-5")}>{kind === "add" ? "+" : kind === "remove" ? "−" : ""}</td><td className={cell}>{text}</td>
                    </tr>
                  );
                  if (row.type === "same") return [line(row.left!, "same", row.leftNo)];
                  return [...(row.left !== undefined ? [line(row.left, "remove", row.leftNo)] : []), ...(row.right !== undefined ? [line(row.right, "add", row.rightNo)] : [])];
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

// ---- Markdown

const MARKDOWN_SAMPLE = `# Project title

A short description with **bold**, _italic_ and \`inline code\`.

## Features

- [x] Live preview
- [ ] Export to HTML
- Tables and code blocks

| Command | What it does |
| ------- | ------------ |
| \`npm run dev\` | Start the dev server |
| \`npm test\` | Run the tests |

\`\`\`js
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

> Tip: everything stays in your browser.

[Visit DailyKit](https://example.com)
`;

async function renderMarkdown(markdown: string) {
  const [{ marked }, { default: DOMPurify }] = await Promise.all([import("marked"), import("dompurify")]);
  const html = await marked.parse(markdown, { gfm: true, breaks: false });
  return DOMPurify.sanitize(html);
}

/** Readable default styles for rendered Markdown. */
const PROSE = "min-w-0 text-sm leading-relaxed [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:font-mono [&_code]:text-[12.5px] [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:font-semibold [&_hr]:my-4 [&_img]:max-w-full [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2.5 [&_pre]:my-3 [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_ul]:list-disc [&_ul]:pl-6 [&_input]:mr-1.5";

const DRAFT_KEY = "dailykit:markdown-draft";

export function MarkdownEditor() {
  const [markdown, setMarkdown] = useState(() => {
    try { return typeof window === "undefined" ? MARKDOWN_SAMPLE : window.localStorage.getItem(DRAFT_KEY) ?? MARKDOWN_SAMPLE; } catch { return MARKDOWN_SAMPLE; }
  });
  const [html, setHtml] = useState("");
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      renderMarkdown(markdown).then((out) => { if (!cancelled) setHtml(out); });
      try { window.localStorage.setItem(DRAFT_KEY, markdown); } catch { /* storage unavailable: nothing to keep */ }
    }, 120);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [markdown]);
  const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  return (
    <TwoPane
      left={<Panel title="Markdown" actions={<><DownloadText text={markdown} fileName="document.md" type="text/markdown" label=".md" /><Button variant="ghost" size="lg" onClick={() => setMarkdown("")}>Clear</Button></>}>
        <CodeArea label="Markdown" hideLabel value={markdown} onChange={setMarkdown} rows={24} />
        <Hint>{words} words · saved in this browser as you type</Hint>
      </Panel>}
      right={<Panel title="Preview" actions={<><CopyText text={html} label="Copy HTML" /><DownloadText text={`<!doctype html>\n<html><head><meta charset="utf-8"><title>Document</title></head><body>\n${html}</body></html>\n`} fileName="document.html" type="text/html" label=".html" /></>}>
        <div className={cn(PROSE, "max-h-[40rem] overflow-auto")} dangerouslySetInnerHTML={{ __html: html }} />
      </Panel>}
    />
  );
}

export function MarkdownToHtml() {
  const [markdown, setMarkdown] = useState("");
  const [html, setHtml] = useState("");
  const [view, setView] = useState<"code" | "preview">("code");
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => renderMarkdown(markdown).then((out) => { if (!cancelled) setHtml(out); }), 120);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [markdown]);
  return (
    <TwoPane
      left={<Panel title="Markdown" actions={<Button variant="ghost" size="lg" onClick={() => setMarkdown(MARKDOWN_SAMPLE)}>Sample</Button>}><CodeArea label="Markdown" hideLabel value={markdown} onChange={setMarkdown} rows={20} placeholder="# Paste Markdown here" /></Panel>}
      right={<Panel title="HTML" actions={<><CopyText text={html} /><DownloadText text={html} fileName="converted.html" type="text/html" /></>}>
        <SegmentedControl label="Show" hideLabel value={view} onChange={setView} options={[{ value: "code", label: "HTML code" }, { value: "preview", label: "Preview" }]} />
        {view === "code" ? <CodeArea label="HTML" hideLabel readOnly value={html} rows={18} /> : <div className={cn(PROSE, "max-h-[34rem] overflow-auto rounded-lg border p-4")} dangerouslySetInnerHTML={{ __html: html }} />}
        <Hint>The HTML is sanitised: scripts and event-handler attributes are removed.</Hint>
      </Panel>}
    />
  );
}

// ---- Email validator

async function mxRecords(domain: string): Promise<string[] | null> {
  try {
    const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`, { headers: { accept: "application/dns-json" } });
    const data = (await response.json()) as { Status: number; Answer?: { type: number; data: string }[] };
    if (data.Status !== 0) return [];
    return (data.Answer ?? []).filter((a) => a.type === 15).map((a) => a.data.replace(/\.$/, ""));
  } catch {
    return null;
  }
}

export function EmailValidator() {
  const [input, setInput] = useState("");
  const [checkMx, setCheckMx] = useState(true);
  const [mx, setMx] = useState<Record<string, string[] | null | "loading">>({});
  const results: EmailCheck[] = useMemo(() => input.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean).slice(0, 500).map(checkEmail), [input]);
  const domains = useMemo(() => [...new Set(results.filter((r) => r.valid && r.domain).map((r) => r.domain!))].slice(0, 50), [results]);
  useEffect(() => {
    if (!checkMx) return;
    const missing = domains.filter((d) => !(d in mx));
    if (!missing.length) return;
    const timer = setTimeout(() => {
      setMx((current) => ({ ...current, ...Object.fromEntries(missing.map((d) => [d, "loading"])) }));
      missing.forEach((domain) => mxRecords(domain).then((records) => setMx((current) => ({ ...current, [domain]: records }))));
    }, 500);
    return () => clearTimeout(timer);
  }, [domains, checkMx, mx]);
  const valid = results.filter((r) => r.valid).length;
  return (
    <div className="space-y-4">
      <Panel title="Email addresses">
        <CodeArea label="Email addresses" hideLabel value={input} onChange={setInput} rows={6} placeholder={"one@example.com\ntwo@gmial.com"} />
        <CheckboxField label="Check the domain has mail servers (MX lookup)" hint="Sends only the domain names to Cloudflare's public DNS (1.1.1.1)." checked={checkMx} onChange={setCheckMx} />
      </Panel>
      {results.length > 0 && <Panel title={`${valid} of ${results.length} valid`} actions={<CopyText text={results.filter((r) => r.valid && (!checkMx || (Array.isArray(mx[r.domain!]) && (mx[r.domain!] as string[]).length > 0))).map((r) => r.email).join("\n")} label="Copy valid" />}>
        <ul className="divide-y rounded-lg border">
          {results.map((r, i) => {
            const records = r.domain ? mx[r.domain] : undefined;
            return (
              <li key={i} className="space-y-1 px-3 py-2.5 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="min-w-0 flex-1 font-mono break-all">{r.email}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", r.valid ? "bg-accent text-accent-foreground" : "bg-destructive/10 text-destructive")}>{r.valid ? "Valid syntax" : "Invalid"}</span>
                  {r.valid && checkMx && (records === "loading" ? <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Checking mail servers" />
                    : records === null ? <span className="text-xs text-muted-foreground">MX lookup failed</span>
                      : Array.isArray(records) && <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", records.length ? "bg-accent text-accent-foreground" : "bg-destructive/10 text-destructive")}>{records.length ? "Accepts mail" : "No mail servers"}</span>)}
                </div>
                {r.reason && <p className="text-xs text-destructive">{r.reason}</p>}
                {r.suggestion && <p className="text-xs text-muted-foreground">Did you mean <b>{r.suggestion}</b>?</p>}
              </li>
            );
          })}
        </ul>
      </Panel>}
    </div>
  );
}

// ---- Phone numbers

type PhoneLib = typeof import("libphonenumber-js/max");

export function PhoneFormatter() {
  const [lib, setLib] = useState<PhoneLib | null>(null);
  const [country, setCountry] = useState("IN");
  const [input, setInput] = useState("");
  useEffect(() => { import("libphonenumber-js/max").then(setLib); }, []);
  const countries = useMemo(() => {
    if (!lib) return [];
    const names = new Intl.DisplayNames(["en"], { type: "region" });
    return lib.getCountries().map((code) => ({ value: code, label: `${names.of(code) ?? code} (+${lib.getCountryCallingCode(code)})` })).sort((a, b) => a.label.localeCompare(b.label));
  }, [lib]);
  const lines = input.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 200);
  const TYPE_NAMES: Record<string, string> = { MOBILE: "Mobile", FIXED_LINE: "Landline", FIXED_LINE_OR_MOBILE: "Landline or mobile", TOLL_FREE: "Toll-free", PREMIUM_RATE: "Premium rate", SHARED_COST: "Shared cost", VOIP: "VoIP", PERSONAL_NUMBER: "Personal number", PAGER: "Pager", UAN: "UAN", VOICEMAIL: "Voicemail" };
  return (
    <div className="space-y-4">
      <Panel title="Phone numbers">
        <div className="grid gap-4 sm:grid-cols-[1fr_16rem]">
          <CodeArea label="Numbers (one per line)" value={input} onChange={setInput} rows={5} placeholder={"98765 43210\n+1 415 555 2671\n020 7946 0958"} />
          <SelectField label="Default country" value={country} onChange={setCountry} options={countries.length ? countries : [{ value: "IN", label: "India (+91)" }]} hint="Used for numbers without a + country code." />
        </div>
      </Panel>
      {!lib && lines.length > 0 && <Hint>Loading phone number data…</Hint>}
      {lib && lines.map((line, i) => {
        const number = lib.parsePhoneNumberFromString(line, country as Parameters<PhoneLib["parsePhoneNumberFromString"]>[1]);
        if (!number) return <Panel key={i} title={line}><ErrorNote>This doesn&apos;t look like a phone number.</ErrorNote></Panel>;
        const valid = number.isValid();
        const type = number.getType();
        return (
          <Panel key={i} title={<span className="font-mono">{line}</span>}>
            {valid ? <OkNote>Valid {type ? TYPE_NAMES[type]?.toLowerCase() ?? "" : ""} number for {new Intl.DisplayNames(["en"], { type: "region" }).of(number.country ?? "") ?? number.country}.</OkNote>
              : <ErrorNote>{number.isPossible() ? "The length is right but the number isn't in use in this country's numbering plan." : "Wrong length for this country."}</ErrorNote>}
            <ValueRows rows={[
              { label: "E.164", value: number.number, mono: true },
              { label: "International", value: number.formatInternational(), mono: true },
              { label: "National", value: number.formatNational(), mono: true },
              { label: "tel: link", value: number.getURI(), mono: true },
              { label: "Country code", value: `+${number.countryCallingCode}${number.country ? ` (${number.country})` : ""}` },
            ]} />
          </Panel>
        );
      })}
    </div>
  );
}

// ---- API request builder

interface ApiResponse { status: number; statusText: string; ms: number; headers: [string, string][]; body: string; size: number; type: string }

export function ApiRequestBuilder() {
  const [spec, setSpecState] = useState<HttpRequestSpec>({ method: "GET", url: "https://jsonplaceholder.typicode.com/todos/1", headers: [{ name: "Accept", value: "application/json" }], body: "", auth: { type: "none" } });
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"body" | "headers" | "curl" | "fetch">("body");
  const setSpec = (update: (s: HttpRequestSpec) => HttpRequestSpec) => setSpecState(update);

  const send = async () => {
    setBusy(true); setError(""); setResponse(null);
    const headers = new Headers();
    try {
      for (const h of spec.headers.filter((h) => h.name.trim())) headers.set(h.name.trim(), h.value);
      if (spec.auth?.type === "bearer" && spec.auth.token) headers.set("Authorization", `Bearer ${spec.auth.token}`);
      if (spec.auth?.type === "basic" && spec.auth.username) headers.set("Authorization", `Basic ${btoa(`${spec.auth.username}:${spec.auth.password ?? ""}`)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "A header name or value isn't valid."); setBusy(false); return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    const started = performance.now();
    try {
      const res = await fetch(spec.url.trim(), { method: spec.method, headers, body: ["GET", "HEAD"].includes(spec.method) || !spec.body ? undefined : spec.body, signal: controller.signal, credentials: "omit" });
      const text = spec.method === "HEAD" ? "" : await res.text();
      const type = res.headers.get("content-type") ?? "";
      const json = /json/.test(type) ? parseJson(text) : null;
      setResponse({ status: res.status, statusText: res.statusText, ms: Math.round(performance.now() - started), headers: [...res.headers], body: json?.ok ? JSON.stringify(json.value, null, 2) : text, size: new TextEncoder().encode(text).length, type });
      setTab("body");
    } catch (e) {
      setError(controller.signal.aborted ? "The request timed out after 30 seconds."
        : `The request couldn't be completed. Usually this is CORS: the API doesn't allow browser requests from other sites. Copy the cURL command and run it in a terminal instead. (${e instanceof Error ? e.message : e})`);
    } finally {
      clearTimeout(timeout); setBusy(false);
    }
  };

  const tone = !response ? "" : response.status < 300 ? "bg-accent text-accent-foreground" : response.status < 400 ? "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200" : "bg-destructive/10 text-destructive";
  return (
    <div className="space-y-4">
      <Panel title="Request">
        <RequestFields spec={spec} setSpec={setSpec} />
        <Button className="h-10" onClick={send} disabled={busy || !/^https?:\/\//i.test(spec.url.trim())}>{busy ? <Loader2 className="animate-spin" /> : <Send />} Send request</Button>
        <Hint>Requests go straight from your browser to the API — not through our servers. Cookies aren&apos;t sent.</Hint>
      </Panel>
      {error && <ErrorNote>{error}</ErrorNote>}
      <Panel title={response ? <span className="flex flex-wrap items-center gap-2">Response <span className={cn("rounded-full px-2 py-0.5 text-sm", tone)}>{response.status} {response.statusText}</span><span className="text-sm font-normal text-muted-foreground">{response.ms} ms · {formatBytes(response.size)}</span></span> : "Response & code"}>
        <SegmentedControl label="Show" hideLabel value={tab} onChange={setTab} options={[{ value: "body", label: "Body" }, { value: "headers", label: "Headers" }, { value: "curl", label: "cURL" }, { value: "fetch", label: "fetch()" }]} />
        {tab === "body" && (response ? <><CodeArea label="Response body" hideLabel readOnly value={response.body} rows={16} /><CopyText text={response.body} /></> : <Hint>Send the request to see the response.</Hint>)}
        {tab === "headers" && (response ? <ValueRows rows={response.headers.map(([name, value]) => ({ label: name, value, mono: true }))} /> : <Hint>Send the request to see the response headers. Browsers only expose headers the API lists in Access-Control-Expose-Headers.</Hint>)}
        {tab === "curl" && <><CodeArea label="cURL" hideLabel readOnly value={buildCurl({ ...spec, body: ["GET", "HEAD"].includes(spec.method) ? "" : spec.body })} rows={8} /><CopyText text={buildCurl({ ...spec, body: ["GET", "HEAD"].includes(spec.method) ? "" : spec.body })} /></>}
        {tab === "fetch" && <><CodeArea label="fetch" hideLabel readOnly value={buildFetch({ ...spec, body: ["GET", "HEAD"].includes(spec.method) ? "" : spec.body })} rows={10} /><CopyText text={buildFetch({ ...spec, body: ["GET", "HEAD"].includes(spec.method) ? "" : spec.body })} /></>}
      </Panel>
    </div>
  );
}
