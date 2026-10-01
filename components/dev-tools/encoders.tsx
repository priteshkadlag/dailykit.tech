"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, ImageUp } from "lucide-react";
import { base64Decode, base64Encode, base64ToBytes, decodeEntities, decodeJwt, encodeEntities, formatBytes, urlDecode, urlEncode } from "@/lib/dev-tools/code";
import { relativeTime } from "@/lib/dev-tools/convert";
import { downloadBlob } from "@/lib/files/download";
import { CheckboxField, SegmentedControl, TextField } from "@/components/shared/form-fields";
import { Button } from "@/components/ui/button";
import { CodeArea, CopyText, ErrorNote, Hint, OkNote, Panel, TwoPane, ValueRows } from "@/components/dev-tools/shared";

type Direction = "encode" | "decode";

function DirectionSwitch({ value, onChange }: { value: Direction; onChange: (value: Direction) => void }) {
  return <SegmentedControl label="Mode" value={value} onChange={onChange} options={[{ value: "encode", label: "Encode" }, { value: "decode", label: "Decode" }]} />;
}

/** Shared layout for text-in, text-out codecs, with a swap button. */
function Codec({ direction, setDirection, input, setInput, output, error, options, inputLabel, outputLabel }: {
  direction: Direction; setDirection: (d: Direction) => void; input: string; setInput: (s: string) => void; output: string; error?: string;
  options?: React.ReactNode; inputLabel: string; outputLabel: string;
}) {
  return (
    <div className="space-y-4">
      <Panel><div className="flex flex-wrap items-end gap-4"><DirectionSwitch value={direction} onChange={setDirection} />{options}</div></Panel>
      <TwoPane
        left={<Panel title={inputLabel} actions={<Button variant="ghost" size="lg" onClick={() => setInput("")}>Clear</Button>}><CodeArea label={inputLabel} hideLabel value={input} onChange={setInput} rows={12} placeholder="Type or paste here…" invalid={!!error} /></Panel>}
        right={<Panel title={outputLabel} actions={<><Button variant="ghost" size="lg" disabled={!output} onClick={() => { setInput(output); setDirection(direction === "encode" ? "decode" : "encode"); }}><ArrowDownUp /> Swap</Button><CopyText text={output} /></>}>
          <CodeArea label={outputLabel} hideLabel value={output} readOnly rows={12} />
          {error && <ErrorNote>{error}</ErrorNote>}
        </Panel>}
      />
    </div>
  );
}

export function UrlCodec() {
  const [direction, setDirection] = useState<Direction>("encode");
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"component" | "uri">("component");
  const [form, setForm] = useState(false);
  const decoded = direction === "decode" ? urlDecode(input, form) : null;
  const output = direction === "encode" ? urlEncode(input, mode, form) : decoded?.ok ? decoded.value : "";
  return <Codec direction={direction} setDirection={setDirection} input={input} setInput={setInput} output={output} error={decoded && !decoded.ok ? decoded.error : undefined}
    inputLabel={direction === "encode" ? "Text" : "Encoded URL"} outputLabel={direction === "encode" ? "Encoded" : "Decoded"}
    options={<>
      {direction === "encode" && <SegmentedControl label="Encode as" value={mode} onChange={setMode} options={[{ value: "component", label: "Query value / component" }, { value: "uri", label: "Full URL" }]} />}
      <CheckboxField label="Spaces as + (form data)" checked={form} onChange={setForm} className="pb-2" />
    </>} />;
}

export function Base64Codec() {
  const [direction, setDirection] = useState<Direction>("encode");
  const [input, setInput] = useState("");
  const [urlSafe, setUrlSafe] = useState(false);
  const decoded = direction === "decode" && input.trim() ? base64Decode(input) : null;
  const output = direction === "encode" ? (input ? base64Encode(input, urlSafe) : "") : decoded?.ok ? decoded.value : "";
  return <Codec direction={direction} setDirection={setDirection} input={input} setInput={setInput} output={output} error={decoded && !decoded.ok ? decoded.error : undefined}
    inputLabel={direction === "encode" ? "Text" : "Base64"} outputLabel={direction === "encode" ? "Base64" : "Text"}
    options={direction === "encode" ? <CheckboxField label="URL-safe (- and _, no padding)" checked={urlSafe} onChange={setUrlSafe} className="pb-2" /> : <Hint>Standard and URL-safe Base64 are both accepted; whitespace and a data: prefix are ignored.</Hint>} />;
}

export function EntityCodec() {
  const [direction, setDirection] = useState<Direction>("encode");
  const [input, setInput] = useState("");
  const [nonAscii, setNonAscii] = useState(false);
  const output = direction === "encode" ? encodeEntities(input, { nonAscii }) : decodeEntities(input);
  return <Codec direction={direction} setDirection={setDirection} input={input} setInput={setInput} output={output}
    inputLabel={direction === "encode" ? "Text or HTML" : "Text with entities"} outputLabel={direction === "encode" ? "Escaped" : "Decoded"}
    options={direction === "encode" && <CheckboxField label="Also encode non-ASCII characters (é, ₹, emoji)" checked={nonAscii} onChange={setNonAscii} className="pb-2" />} />;
}

// ---- JWT

const CLAIM_NAMES: Record<string, string> = { iss: "Issuer", sub: "Subject", aud: "Audience", exp: "Expires", nbf: "Not before", iat: "Issued at", jti: "Token ID" };

export function JwtDecoder() {
  const [token, setToken] = useState("");
  const [now] = useState(() => Date.now());
  const result = token.trim() ? decodeJwt(token, now) : null;
  const decoded = result?.ok ? result.value : null;
  return (
    <div className="space-y-4">
      <Panel title="Token">
        <CodeArea label="JSON Web Token" hideLabel value={token} onChange={setToken} rows={5} placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFzaGEiLCJpYXQiOjE3MDAwMDAwMDB9.signature" invalid={result?.ok === false} />
        {result && !result.ok && <ErrorNote>{result.error}</ErrorNote>}
        {decoded && (decoded.expired === true ? <ErrorNote>This token expired {relativeTime(new Date((decoded.payload.exp as number) * 1000), now)}.</ErrorNote>
          : decoded.expired === false ? <OkNote>Not expired — expires {relativeTime(new Date((decoded.payload.exp as number) * 1000), now)}.</OkNote>
            : <Hint>This token has no expiry (exp) claim.</Hint>)}
        <Hint>Decoding reads the token without checking its signature. Verify signatures on your server with the signing key.</Hint>
      </Panel>
      {decoded && <>
        <TwoPane
          left={<Panel title={<>Header <span className="font-normal text-muted-foreground">· {String(decoded.header.alg ?? "")}</span></>} actions={<CopyText text={JSON.stringify(decoded.header, null, 2)} />}><CodeArea label="Header" hideLabel readOnly value={JSON.stringify(decoded.header, null, 2)} rows={6} /></Panel>}
          right={<Panel title="Payload" actions={<CopyText text={JSON.stringify(decoded.payload, null, 2)} />}><CodeArea label="Payload" hideLabel readOnly value={JSON.stringify(decoded.payload, null, 2)} rows={10} /></Panel>}
        />
        <Panel title="Claims">
          <ValueRows rows={Object.entries(decoded.payload).filter(([key]) => CLAIM_NAMES[key]).map(([key, value]) => ({
            label: `${CLAIM_NAMES[key]} (${key})`,
            value: typeof value === "number" && ["exp", "nbf", "iat"].includes(key) ? `${new Date(value * 1000).toLocaleString()} (${relativeTime(new Date(value * 1000), now)})` : Array.isArray(value) ? value.join(", ") : String(value),
          }))} />
          <ValueRows rows={[{ label: "Signature", value: decoded.signature, mono: true }]} />
        </Panel>
      </>}
    </div>
  );
}

// ---- Images

function useObjectUrl(blob: Blob | null) {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : ""), [blob]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  return url;
}

export function ImageToBase64() {
  const [file, setFile] = useState<File | null>(null);
  const [dataUri, setDataUri] = useState("");
  const [dragging, setDragging] = useState(false);
  const read = (next: File | undefined) => {
    if (!next) return;
    if (!next.type.startsWith("image/")) return;
    setFile(next);
    const reader = new FileReader();
    reader.onload = () => setDataUri(String(reader.result));
    reader.readAsDataURL(next);
  };
  const base64 = dataUri.replace(/^data:[^,]*,/, "");
  return (
    <div className="space-y-4">
      <Panel>
        <label
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); read(e.dataTransfer.files[0]); }}
          className={`flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${dragging ? "border-primary bg-primary/5" : "hover:border-primary/50"}`}
        >
          <ImageUp className="size-8 text-muted-foreground" aria-hidden />
          <span className="font-medium">Choose an image or drop it here</span>
          <span className="text-sm text-muted-foreground">PNG, JPG, GIF, WebP, SVG or ICO</span>
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => { read(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
      </Panel>
      {file && dataUri && <>
        <Panel title="Image">
          <div className="flex flex-wrap items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- a local data URI preview */}
            <img src={dataUri} alt={file.name} className="max-h-40 max-w-full rounded-md bg-[repeating-conic-gradient(#e5e7eb_0_25%,#fff_0_50%)] bg-[length:16px_16px] object-contain ring-1 ring-foreground/10" />
            <p className="text-sm text-muted-foreground">{file.name} · {file.type} · {formatBytes(file.size)} → {formatBytes(base64.length)} as Base64</p>
          </div>
          {file.size > 100 * 1024 && <Hint>This image is over 100 KB. Inlining it as Base64 makes the page bigger and stops the browser caching it separately; a normal image file is usually better.</Hint>}
        </Panel>
        {[
          { label: "Data URI", value: dataUri },
          { label: "Base64 only", value: base64 },
          { label: "HTML <img>", value: `<img src="${dataUri}" alt="">` },
          { label: "CSS background", value: `background-image: url("${dataUri}");` },
        ].map((item) => <Panel key={item.label} title={item.label} actions={<CopyText text={item.value} />}><CodeArea label={item.label} hideLabel readOnly value={item.value.length > 200_000 ? `${item.value.slice(0, 200_000)}… (copy to get all ${item.value.length.toLocaleString()} characters)` : item.value} rows={4} /></Panel>)}
      </>}
    </div>
  );
}

/** Image type from the first bytes of the file. */
function sniffImage(bytes: Uint8Array): { mime: string; ext: string } | null {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (starts(0x89, 0x50, 0x4e, 0x47)) return { mime: "image/png", ext: "png" };
  if (starts(0xff, 0xd8, 0xff)) return { mime: "image/jpeg", ext: "jpg" };
  if (starts(0x47, 0x49, 0x46, 0x38)) return { mime: "image/gif", ext: "gif" };
  if (starts(0x52, 0x49, 0x46, 0x46) && bytes[8] === 0x57 && bytes[9] === 0x45) return { mime: "image/webp", ext: "webp" };
  if (starts(0x00, 0x00, 0x01, 0x00)) return { mime: "image/x-icon", ext: "ico" };
  if (starts(0x42, 0x4d)) return { mime: "image/bmp", ext: "bmp" };
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) return { mime: "image/avif", ext: "avif" };
  const head = new TextDecoder().decode(bytes.slice(0, 256));
  if (/<svg[\s>]/i.test(head) || (/^\s*<\?xml/.test(head) && /<svg/i.test(new TextDecoder().decode(bytes.slice(0, 2048))))) return { mime: "image/svg+xml", ext: "svg" };
  return null;
}

export function Base64ToImage() {
  const [input, setInput] = useState("");
  const parsed = useMemo(() => {
    if (!input.trim()) return null;
    const bytes = base64ToBytes(input);
    if (!bytes.ok) return { error: bytes.error };
    const declared = /^data:([^;,]+)/.exec(input.trim())?.[1];
    const kind = sniffImage(bytes.value) ?? (declared?.startsWith("image/") ? { mime: declared, ext: declared.split("/")[1].replace("+xml", "") } : null);
    if (!kind) return { error: "The data decodes, but it isn't a recognised image (PNG, JPG, GIF, WebP, SVG, ICO, BMP or AVIF)." };
    return { blob: new Blob([bytes.value as BlobPart], { type: kind.mime }), ...kind, size: bytes.value.length };
  }, [input]);
  const url = useObjectUrl(parsed && "blob" in parsed ? parsed.blob ?? null : null);
  return (
    <TwoPane
      left={<Panel title="Base64 or data URI" actions={<Button variant="ghost" size="lg" onClick={() => setInput("")}>Clear</Button>}><CodeArea label="Base64 input" hideLabel value={input} onChange={setInput} rows={16} placeholder="data:image/png;base64,iVBORw0KGgo… or just the Base64" invalid={!!parsed && "error" in parsed} /></Panel>}
      right={<Panel title="Image">
        {parsed && "error" in parsed && <ErrorNote>{parsed.error}</ErrorNote>}
        {url && parsed && "blob" in parsed ? <>
          {/* eslint-disable-next-line @next/next/no-img-element -- local preview of decoded data */}
          <img src={url} alt="Decoded" className="max-h-80 max-w-full rounded-md bg-[repeating-conic-gradient(#e5e7eb_0_25%,#fff_0_50%)] bg-[length:16px_16px] object-contain ring-1 ring-foreground/10" />
          <p className="text-sm text-muted-foreground">{parsed.mime} · {formatBytes(parsed.size!)}</p>
          <Button onClick={() => downloadBlob(parsed.blob!, `image.${parsed.ext}`)}>Download image</Button>
        </> : !parsed && <Hint>Paste Base64 to preview the image.</Hint>}
      </Panel>}
    />
  );
}

// ---- URL parser

export function UrlParser() {
  const [input, setInput] = useState("https://user:pass@shop.example.com:8080/products/shoes?color=red&size=9&size=10#reviews");
  const parsed = useMemo(() => {
    const text = input.trim();
    if (!text) return null;
    try {
      return new URL(/^[a-z][a-z\d+.-]*:/i.test(text) ? text : `https://${text}`);
    } catch {
      return "invalid" as const;
    }
  }, [input]);
  return (
    <div className="space-y-4">
      <Panel><TextField label="URL" value={input} onChange={setInput} placeholder="https://example.com/path?query=1" /></Panel>
      {parsed === "invalid" && <ErrorNote>That isn&apos;t a valid URL.</ErrorNote>}
      {parsed && parsed !== "invalid" && <>
        <Panel title="Parts">
          <ValueRows rows={[
            { label: "Protocol", value: parsed.protocol.replace(/:$/, "") },
            { label: "Username", value: decodeURIComponent(parsed.username) },
            { label: "Password", value: decodeURIComponent(parsed.password) },
            { label: "Host name", value: parsed.hostname },
            { label: "Port", value: parsed.port || `${parsed.protocol === "https:" ? "443" : parsed.protocol === "http:" ? "80" : ""}${parsed.port ? "" : " (default)"}` },
            { label: "Origin", value: parsed.origin === "null" ? "" : parsed.origin, mono: true },
            { label: "Path", value: decodeURIComponent(parsed.pathname), mono: true },
            { label: "Query string", value: parsed.search, mono: true },
            { label: "Fragment", value: decodeURIComponent(parsed.hash.replace(/^#/, "")) },
          ]} />
        </Panel>
        <Panel title={`Query parameters (${[...parsed.searchParams].length})`}>
          {[...parsed.searchParams].length ? <ValueRows rows={[...parsed.searchParams].map(([key, value], i) => ({ label: `${key}${[...parsed.searchParams.keys()].filter((k) => k === key).length > 1 ? ` [${i}]` : ""}`, value, mono: true }))} /> : <Hint>No query parameters.</Hint>}
        </Panel>
      </>}
    </div>
  );
}
