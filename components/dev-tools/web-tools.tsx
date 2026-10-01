"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, CameraOff, ExternalLink, ImageUp, Loader2, Search } from "lucide-react";
import { HTTP_STATUSES, MIME_TYPES, STATUS_CLASSES, inspectIp, parseUserAgent } from "@/lib/dev-tools/web";
import { cn } from "@/lib/utils";
import { SegmentedControl, SelectField, TextField } from "@/components/shared/form-fields";
import { Button } from "@/components/ui/button";
import { CodeArea, CopyText, ErrorNote, Hint, OkNote, Panel, TwoPane, ValueRows } from "@/components/dev-tools/shared";

// ---- IP

function IpDetails({ ip }: { ip: string }) {
  const info = inspectIp(ip);
  if (!info) return <ErrorNote>&ldquo;{ip}&rdquo; isn&apos;t a valid IPv4 or IPv6 address.</ErrorNote>;
  return (
    <ValueRows rows={[
      { label: "Version", value: `IPv${info.version}` },
      { label: "Type", value: info.kind },
      { label: "Reachable from the internet", value: info.isPublic ? "Yes — public address" : "No — only inside a private or special network" },
      { label: "Normalised", value: info.normalized, mono: true },
      ...(info.binary ? [{ label: "Binary", value: info.binary, mono: true }] : []),
      { label: "As an integer", value: info.integer, mono: true },
    ]} />
  );
}

export function IpChecker() {
  const [mine, setMine] = useState<{ ip: string | null } | "loading" | "error">("loading");
  const [lookup, setLookup] = useState("");
  useEffect(() => {
    fetch("/api/ip", { cache: "no-store" }).then((r) => r.json()).then(setMine).catch(() => setMine("error"));
  }, []);
  return (
    <TwoPane
      left={<Panel title="Your public IP address">
        {mine === "loading" ? <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Checking…</p>
          : mine === "error" || !mine.ip ? <ErrorNote>Couldn&apos;t detect your IP address from here.</ErrorNote>
            : <><p className="font-mono text-3xl font-bold break-all">{mine.ip}</p><CopyText text={mine.ip} label="Copy IP" /><IpDetails ip={mine.ip} /></>}
        <Hint>This is the address websites see. With a VPN, proxy or mobile data it&apos;s the address of that network, not your device.</Hint>
      </Panel>}
      right={<Panel title="Check any IP address">
        <TextField label="IP address" value={lookup} onChange={setLookup} placeholder="192.168.1.10 or 2001:db8::1" />
        {lookup.trim() ? <IpDetails ip={lookup.trim()} /> : <Hint>Find out whether an address is public, private (like 192.168.x.x), loopback or reserved.</Hint>}
      </Panel>}
    />
  );
}

// ---- User agent

export function UserAgentParser() {
  const [ua, setUa] = useState(() => (typeof navigator === "undefined" ? "" : navigator.userAgent));
  const parsed = ua.trim() ? parseUserAgent(ua) : null;
  const fmt = (part: { name: string; version: string }) => [part.name, part.version].filter(Boolean).join(" ");
  return (
    <div className="space-y-4">
      <Panel title="User agent string" actions={<Button variant="outline" onClick={() => setUa(navigator.userAgent)}>Use mine</Button>}>
        <CodeArea label="User agent" hideLabel value={ua} onChange={setUa} rows={3} />
      </Panel>
      {parsed && <Panel title="Details">
        <ValueRows rows={[
          { label: "Browser", value: fmt(parsed.browser) },
          { label: "Rendering engine", value: fmt(parsed.engine) },
          { label: "Operating system", value: fmt(parsed.os) },
          { label: "Device type", value: parsed.device },
          { label: "Bot or crawler", value: parsed.bot ? "Yes" : "No" },
        ]} />
        <Hint>Browsers increasingly freeze parts of the user agent for privacy (for example the macOS version shows as 10.15.7), so exact versions can be out of date.</Hint>
      </Panel>}
    </div>
  );
}

// ---- HTTP status codes

// ---- HTTP status

interface StatusHop { url: string; status: number; statusText: string; address: string; timeMs: number; location?: string; headers: Record<string, string> }
type StatusResponse = { ok: true; hops: StatusHop[]; redirectLimitHit: boolean } | { ok: false; error: string; hops: StatusHop[] };

const statusTone = (code: number) => code < 200 ? "bg-muted" : code < 300 ? "bg-accent text-accent-foreground" : code < 400 ? "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200" : code < 500 ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200" : "bg-destructive/10 text-destructive";

function StatusBadge({ code }: { code: number }) {
  return <span className={cn("rounded-md px-2 py-0.5 font-mono text-sm font-bold", statusTone(code))}>{code}</span>;
}

/** Checks a live URL through /api/status-check and shows each hop of the redirect chain. */
function UrlStatusChecker({ onExplain }: { onExplain: (code: number) => void }) {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<StatusResponse | "loading" | null>(null);
  const check = async () => {
    if (!url.trim()) return;
    setState("loading");
    try {
      const response = await fetch("/api/status-check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) });
      setState((await response.json()) as StatusResponse);
    } catch {
      setState({ ok: false, error: "Couldn't reach the checker. Check your connection and try again.", hops: [] });
    }
  };
  const result = state === "loading" ? null : state;
  const final = result?.hops.at(-1);
  const finalInfo = final ? HTTP_STATUSES.find((s) => s.code === final.status) : undefined;
  return (
    <Panel>
      <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={(e) => { e.preventDefault(); void check(); }}>
        <TextField className="flex-1" label="Check a URL's status code" value={url} onChange={setUrl} placeholder="example.com/page" inputMode="url" />
        <Button type="submit" className="h-11" disabled={state === "loading" || !url.trim()}>{state === "loading" ? <Loader2 className="animate-spin" aria-hidden /> : <Search aria-hidden />} Check status</Button>
      </form>
      <Hint>Our server requests the address (headers only — the page itself isn&apos;t downloaded) and follows up to 5 redirects. Private and local network addresses are refused.</Hint>
      {result && !result.ok && <ErrorNote>{result.error}</ErrorNote>}
      {result && result.hops.length > 0 && (
        <ol className="space-y-2" aria-label="Redirect chain">
          {result.hops.map((hop, index) => (
            <li key={index} className="space-y-2 rounded-lg bg-muted/50 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => onExplain(hop.status)} title="Explain this status code"><StatusBadge code={hop.status} /></button>
                <span className="font-medium">{hop.statusText || HTTP_STATUSES.find((s) => s.code === hop.status)?.name}</span>
                <span className="text-xs text-muted-foreground">{hop.timeMs} ms{hop.address && ` · ${hop.address}`}</span>
              </div>
              <p className="break-all font-mono text-xs">{hop.url}</p>
              {hop.location && <p className="break-all text-xs text-muted-foreground">→ redirects to <span className="font-mono">{hop.location}</span></p>}
              {Object.keys(hop.headers).length > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground">Response headers</summary>
                  <dl className="mt-2 grid gap-x-3 gap-y-1 sm:grid-cols-[auto_1fr]">
                    {Object.entries(hop.headers).map(([name, value]) => <div key={name} className="contents"><dt className="font-mono text-muted-foreground">{name}</dt><dd className="break-all font-mono">{value}</dd></div>)}
                  </dl>
                </details>
              )}
            </li>
          ))}
        </ol>
      )}
      {result?.ok && final && (
        result.redirectLimitHit
          ? <ErrorNote>Stopped after 5 redirects — this may be a redirect loop.</ErrorNote>
          : <OkNote>Final status {final.status}{finalInfo ? ` ${finalInfo.name}` : ""}{result.hops.length > 1 ? ` after ${result.hops.length - 1} redirect${result.hops.length > 2 ? "s" : ""}` : ""}.{finalInfo ? ` ${finalInfo.meaning}` : ""}</OkNote>
      )}
    </Panel>
  );
}

export function HttpStatusLookup() {
  const [query, setQuery] = useState("");
  const [klass, setKlass] = useState("all");
  const needle = query.trim().toLowerCase();
  const list = HTTP_STATUSES.filter((s) => (klass === "all" || String(s.code)[0] === klass) && (!needle || String(s.code).startsWith(needle) || s.name.toLowerCase().includes(needle) || s.meaning.toLowerCase().includes(needle)));
  const exact = /^\d{3}$/.test(needle) ? HTTP_STATUSES.find((s) => String(s.code) === needle) : undefined;
  return (
    <div className="space-y-4">
      <UrlStatusChecker onExplain={(code) => { setQuery(String(code)); setKlass("all"); }} />
      <Panel>
        <div className="grid gap-4 sm:grid-cols-[1fr_14rem]">
          <TextField label="Status code or keyword" value={query} onChange={setQuery} placeholder="404, redirect, timeout…" />
          <SelectField label="Class" value={klass} onChange={setKlass} options={[{ value: "all", label: "All classes" }, ...Object.entries(STATUS_CLASSES).map(([k, v]) => ({ value: k, label: `${k}xx ${v}` }))]} />
        </div>
        {/^\d{3}$/.test(needle) && !exact && <ErrorNote>{needle} isn&apos;t a standard HTTP status code. {Number(needle[0]) >= 1 && Number(needle[0]) <= 5 ? `Codes starting with ${needle[0]} are ${STATUS_CLASSES[Number(needle[0])].toLowerCase()} responses.` : "Valid codes run from 100 to 599."}</ErrorNote>}
      </Panel>
      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((s) => (
          <article key={s.code} className={cn("space-y-1.5 rounded-xl bg-card p-4 ring-1 ring-foreground/10", exact?.code === s.code && "ring-2 ring-primary")}>
            <h2 className="flex flex-wrap items-baseline gap-2"><StatusBadge code={s.code} /><span className="font-semibold">{s.name}</span></h2>
            <p className="text-sm text-muted-foreground">{s.meaning}</p>
            {s.fix && <p className="text-sm"><b>Fix:</b> {s.fix}</p>}
          </article>
        ))}
      </div>
      {!list.length && <Hint>No status codes match &ldquo;{query}&rdquo;.</Hint>}
    </div>
  );
}

// ---- MIME types

export function MimeLookup() {
  const [query, setQuery] = useState("");
  const [fileInfo, setFileInfo] = useState<{ name: string; type: string } | null>(null);
  const needle = query.trim().toLowerCase().replace(/^\*?\./, "");
  const rows = MIME_TYPES.filter(([ext, mime]) => !needle || ext.startsWith(needle) || mime.includes(needle));
  return (
    <div className="space-y-4">
      <Panel>
        <TextField label="Extension or MIME type" value={query} onChange={setQuery} placeholder=".webp, pdf, application/json…" />
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-primary hover:underline">
          <ImageUp className="size-4" aria-hidden /> Or check a file on your device
          <input type="file" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFileInfo({ name: f.name, type: f.type }); e.target.value = ""; }} />
        </label>
        {fileInfo && <OkNote>{fileInfo.name}: {fileInfo.type || "your browser doesn't know this type — use application/octet-stream"}</OkNote>}
      </Panel>
      <Panel title={`${rows.length} type${rows.length === 1 ? "" : "s"}`}>
        <div className="max-h-128 overflow-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-muted"><tr><th className="px-3 py-2">Extension</th><th className="px-3 py-2">MIME type</th><th className="px-3 py-2"><span className="sr-only">Copy</span></th></tr></thead>
            <tbody>{rows.map(([ext, mime]) => <tr key={ext} className="border-t"><td className="px-3 py-1.5 font-mono">.{ext}</td><td className="px-3 py-1.5 font-mono break-all">{mime}</td><td className="px-3 py-1.5 text-right"><CopyText text={mime} size="sm" /></td></tr>)}</tbody>
          </table>
        </div>
        {!rows.length && <Hint>Not in the list. For unknown binary files use application/octet-stream.</Hint>}
      </Panel>
    </div>
  );
}

// ---- DNS

const RECORD_TYPES = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SOA", "CAA", "SRV", "PTR"] as const;
const TYPE_CODES: Record<number, string> = { 1: "A", 2: "NS", 5: "CNAME", 6: "SOA", 12: "PTR", 15: "MX", 16: "TXT", 28: "AAAA", 33: "SRV", 257: "CAA" };
const DNS_STATUS: Record<number, string> = { 1: "The query was malformed.", 2: "The DNS server failed to answer (SERVFAIL).", 3: "This domain doesn't exist (NXDOMAIN).", 5: "The DNS server refused the query." };

interface DnsAnswer { name: string; type: number; TTL: number; data: string }

export function DnsLookup() {
  const [domain, setDomain] = useState("");
  const [type, setType] = useState<(typeof RECORD_TYPES)[number] | "ALL">("ALL");
  const [results, setResults] = useState<{ type: string; answers: DnsAnswer[]; error?: string }[] | null>(null);
  const [busy, setBusy] = useState(false);
  const clean = domain.trim().replace(/^[a-z]+:\/\//i, "").replace(/[/?#].*$/, "").replace(/\.$/, "").toLowerCase();
  const lookup = async () => {
    if (!clean) return;
    setBusy(true);
    const types = type === "ALL" ? RECORD_TYPES.filter((t) => t !== "PTR" && t !== "SRV") : [type];
    const name = type === "PTR" && inspectIp(clean)?.version === 4 ? `${clean.split(".").reverse().join(".")}.in-addr.arpa` : clean;
    const out = await Promise.all(types.map(async (t) => {
      try {
        const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${t}`, { headers: { accept: "application/dns-json" } });
        const data = (await response.json()) as { Status: number; Answer?: DnsAnswer[] };
        if (data.Status !== 0) return { type: t, answers: [], error: DNS_STATUS[data.Status] ?? `DNS error ${data.Status}.` };
        return { type: t, answers: (data.Answer ?? []).filter((a) => TYPE_CODES[a.type] === t || t === "CNAME") };
      } catch {
        return { type: t, answers: [], error: "The lookup failed — check your connection." };
      }
    }));
    setResults(out);
    setBusy(false);
  };
  const nxdomain = results?.every((r) => r.error?.includes("NXDOMAIN"));
  return (
    <div className="space-y-4">
      <Panel>
        <form className="grid items-end gap-3 sm:grid-cols-[1fr_12rem_auto]" onSubmit={(e) => { e.preventDefault(); lookup(); }}>
          <TextField label="Domain" value={domain} onChange={setDomain} placeholder="example.com" />
          <SelectField label="Record type" value={type} onChange={setType} options={[{ value: "ALL", label: "All common types" }, ...RECORD_TYPES.map((t) => ({ value: t, label: t === "PTR" ? "PTR (reverse, enter an IP)" : t }))]} />
          <Button type="submit" className="h-11" disabled={busy || !clean}>{busy ? <Loader2 className="animate-spin" /> : <Search />} Look up</Button>
        </form>
        <Hint>Answers come from Cloudflare&apos;s public resolver (1.1.1.1) over DNS-over-HTTPS; only the domain name is sent.</Hint>
      </Panel>
      {results && (nxdomain ? <ErrorNote>{clean} doesn&apos;t exist in DNS (NXDOMAIN). Check the spelling.</ErrorNote> : results.map((r) => (
        <Panel key={r.type} title={<>{r.type} <span className="font-normal text-muted-foreground">· {r.answers.length} record{r.answers.length === 1 ? "" : "s"}</span></>}>
          {r.error ? <ErrorNote>{r.error}</ErrorNote> : r.answers.length ? (
            <div className="overflow-x-auto rounded-lg border"><table className="w-full text-left text-sm"><thead className="bg-muted/60"><tr><th className="px-3 py-1.5">Name</th><th className="px-3 py-1.5">Type</th><th className="px-3 py-1.5">TTL</th><th className="px-3 py-1.5">Value</th></tr></thead>
              <tbody>{r.answers.map((a, i) => <tr key={i} className="border-t align-top"><td className="px-3 py-1.5 font-mono text-xs">{a.name}</td><td className="px-3 py-1.5">{TYPE_CODES[a.type] ?? a.type}</td><td className="px-3 py-1.5 tabular-nums">{a.TTL}s</td><td className="px-3 py-1.5 font-mono text-xs break-all">{a.data}</td></tr>)}</tbody></table></div>
          ) : <Hint>No {r.type} records.</Hint>}
        </Panel>
      )))}
    </div>
  );
}

// ---- QR scanner

type JsQR = typeof import("jsqr").default;

function describeQr(text: string) {
  if (/^https?:\/\//i.test(text)) return { kind: "Link", link: text };
  if (/^WIFI:/i.test(text)) {
    const field = (key: string) => new RegExp(`${key}:((?:\\\\.|[^;])*)`, "i").exec(text)?.[1]?.replace(/\\(.)/g, "$1") ?? "";
    return { kind: "WiFi network", details: [{ label: "Network (SSID)", value: field("S") }, { label: "Password", value: field("P") }, { label: "Security", value: field("T") || "None" }] };
  }
  if (/^upi:\/\//i.test(text)) {
    const params = new URLSearchParams(text.split("?")[1] ?? "");
    return { kind: "UPI payment", details: [{ label: "Pay to (VPA)", value: params.get("pa") ?? "" }, { label: "Name", value: params.get("pn") ?? "" }, { label: "Amount", value: params.get("am") ?? "" }] };
  }
  if (/^mailto:/i.test(text)) return { kind: "Email", link: text };
  if (/^tel:/i.test(text)) return { kind: "Phone number", link: text };
  if (/^BEGIN:VCARD/i.test(text)) return { kind: "Contact card (vCard)" };
  return { kind: "Text" };
}

export function QrScanner() {
  const [mode, setMode] = useState<"image" | "camera">("image");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const jsqrRef = useRef<JsQR | null>(null);
  const loadJsqr = async () => (jsqrRef.current ??= (await import("jsqr")).default);

  const decodeImageData = async (data: ImageData) => (await loadJsqr())(data.data, data.width, data.height, { inversionAttempts: "attemptBoth" })?.data ?? null;

  const scanFile = async (file: File | undefined) => {
    if (!file) return;
    setError(""); setResult(null);
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const text = await decodeImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
      if (text === null) setError("No QR code found. Try a sharper image with the whole code visible.");
      else setResult(text);
    } catch {
      setError("That file couldn't be read as an image.");
    }
  };

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  const start = async () => {
    setError(""); setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      setScanning(true);
      await loadJsqr();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      const tick = async () => {
        if (!streamRef.current) return;
        if (video.readyState >= 2 && video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          const text = await decodeImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
          if (text !== null) { setResult(text); stop(); return; }
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch {
      setError("Couldn't open the camera. Allow camera access for this site, or upload an image instead.");
      stop();
    }
  };

  useEffect(() => stop, [stop]);

  const info = useMemo(() => (result === null ? null : describeQr(result)), [result]);
  return (
    <div className="space-y-4">
      <Panel>
        <SegmentedControl label="Scan from" value={mode} onChange={(m) => { stop(); setMode(m); }} options={[{ value: "image", label: "Image or screenshot" }, { value: "camera", label: "Camera" }]} />
        {mode === "image" ? (
          <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center hover:border-primary/50"
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); scanFile(e.dataTransfer.files[0]); }}>
            <ImageUp className="size-8 text-muted-foreground" aria-hidden />
            <span className="font-medium">Choose an image with a QR code, or drop it here</span>
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => { scanFile(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
        ) : (
          <div className="space-y-3">
            <video ref={videoRef} muted playsInline className={cn("mx-auto aspect-video w-full max-w-md rounded-xl bg-black object-cover", !scanning && "hidden")} />
            {scanning ? <Button variant="outline" onClick={stop}><CameraOff /> Stop camera</Button> : <Button onClick={start}><Camera /> Start camera</Button>}
            <Hint>Point the camera at a QR code. Frames are decoded on your device; nothing is recorded or uploaded.</Hint>
          </div>
        )}
        {error && <ErrorNote>{error}</ErrorNote>}
      </Panel>
      {result !== null && info && <Panel title={`Found: ${info.kind}`} actions={<CopyText text={result} />}>
        <CodeArea label="Decoded content" hideLabel readOnly value={result} rows={3} />
        {info.details && <ValueRows rows={info.details} />}
        {info.link && <div className="space-y-2"><p className="text-sm">Check the address before opening it: <span className="font-mono break-all">{info.link}</span></p><a href={info.link} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">Open <ExternalLink className="size-3.5" /></a></div>}
      </Panel>}
    </div>
  );
}
