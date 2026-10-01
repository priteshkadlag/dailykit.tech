"use client";

import { useState } from "react";
import { ArrowRight, Download, Link2, Link2Off, Loader2, RotateCcw, Scaling } from "lucide-react";
import { toast } from "sonner";
import { downloadBlob } from "@/lib/files/download";
import { formatBytes, IMAGE_MIMES, MIME_LABEL, withExtension, type AcceptedFile, type SupportedMime } from "@/lib/files/validation";
import { parseNumber } from "@/lib/format";
import { useObjectUrls } from "@/lib/hooks/use-object-urls";
import { MAX_CANVAS, type FitMode } from "@/lib/image/geometry";
import { decodeImage, OUTPUT_EXT, renderImage, type OutputMime } from "@/lib/image/process";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NumberField, SegmentedControl, SelectField } from "@/components/shared/form-fields";
import { FileDropzone, PrivacyNote } from "./file-dropzone";

const RULES = { accept: IMAGE_MIMES, maxBytes: 25 * 1024 * 1024, maxCount: 1 };

const PRESETS = [
  { id: "ig-post", label: "Instagram Post", width: 1080, height: 1080 },
  { id: "ig-story", label: "Instagram Story", width: 1080, height: 1920 },
  { id: "yt-thumb", label: "YouTube Thumbnail", width: 1280, height: 720 },
  { id: "fb-post", label: "Facebook Post", width: 1200, height: 630 },
  { id: "website", label: "Website (Full HD)", width: 1920, height: 1080 },
  // 35 × 45 mm at 300 dpi, the Indian passport/visa photo size.
  { id: "passport", label: "Passport Photo", width: 413, height: 531 },
  // A4 at 300 dpi.
  { id: "a4", label: "A4 (300 dpi)", width: 2480, height: 3508 },
] as const;

interface Source {
  file: File;
  mime: SupportedMime;
  url: string;
  width: number;
  height: number;
}

interface Output {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  type: OutputMime;
}

export function ImageResizer() {
  const urls = useObjectUrls();
  const [source, setSource] = useState<Source | null>(null);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [locked, setLocked] = useState(true);
  const [preset, setPreset] = useState<string | null>(null);
  const [fit, setFit] = useState<FitMode>("cover");
  const [background, setBackground] = useState("#ffffff");
  const [format, setFormat] = useState<OutputMime>("image/jpeg");
  const [quality, setQuality] = useState("90");
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState<Output | null>(null);

  const clearOutput = () => {
    if (output) urls.revoke(output.url);
    setOutput(null);
  };

  const load = async ([accepted]: AcceptedFile[]) => {
    try {
      const bitmap = await decodeImage(accepted.file);
      setSource({ file: accepted.file, mime: accepted.mime, url: urls.create(accepted.file), width: bitmap.width, height: bitmap.height });
      bitmap.close();
      setWidth(String(bitmap.width));
      setHeight(String(bitmap.height));
      setPreset(null);
      setFormat(accepted.mime as OutputMime);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't read this image.");
    }
  };

  const reset = () => {
    if (source) urls.revoke(source.url);
    clearOutput();
    setSource(null);
  };

  const ratio = source ? source.width / source.height : 1;
  const w = parseNumber(width);
  const h = parseNumber(height);
  const sizeError = (n: number) =>
    !Number.isFinite(n) || n < 1 ? "Enter at least 1 px" : !Number.isInteger(n) ? "Whole pixels only" : n > MAX_CANVAS.side ? `Max ${MAX_CANVAS.side} px` : undefined;
  const widthError = width.trim() ? sizeError(w) : "Required";
  const heightError = height.trim() ? sizeError(h) : "Required";
  const tooLarge = !widthError && !heightError && w * h > MAX_CANVAS.area;
  const valid = !widthError && !heightError && !tooLarge;
  const aspectDiffers = source && valid ? Math.abs(w / h - ratio) > 0.01 : false;

  const changeWidth = (value: string) => {
    setWidth(value);
    setPreset(null);
    clearOutput();
    const n = parseNumber(value);
    if (locked && Number.isFinite(n) && n > 0) setHeight(String(Math.max(1, Math.round(n / ratio))));
  };
  const changeHeight = (value: string) => {
    setHeight(value);
    setPreset(null);
    clearOutput();
    const n = parseNumber(value);
    if (locked && Number.isFinite(n) && n > 0) setWidth(String(Math.max(1, Math.round(n * ratio))));
  };

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setPreset(p.id);
    setLocked(false);
    setWidth(String(p.width));
    setHeight(String(p.height));
    clearOutput();
  };

  const resize = async () => {
    if (!source || !valid) return;
    setBusy(true);
    clearOutput();
    try {
      const bitmap = await decodeImage(source.file);
      const out = await renderImage(bitmap, {
        target: { width: w, height: h },
        mode: aspectDiffers ? fit : "stretch",
        type: format,
        quality: Number(quality) / 100,
        background: format === "image/jpeg" || fit === "contain" ? background : null,
      });
      bitmap.close();
      setOutput({ ...out, url: urls.create(out.blob) });
      toast.success(`Resized to ${out.width}×${out.height}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't resize this image.");
    } finally {
      setBusy(false);
    }
  };

  if (!source) {
    return (
      <div className="space-y-6">
        <PrivacyNote />
        <FileDropzone rules={RULES} onFiles={load} title="Choose an image" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PrivacyNote />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-label="Preview" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 truncate text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{source.file.name}</span> · {source.width}×{source.height} · {formatBytes(source.file.size)}
            </p>
            <Button variant="ghost" className="h-9" onClick={reset} disabled={busy}>
              <RotateCcw /> Choose another image
            </Button>
          </div>
          <div className="flex min-h-72 items-center justify-center rounded-xl bg-[repeating-conic-gradient(var(--muted)_0_25%,transparent_0_50%)] bg-[length:20px_20px] p-4 ring-1 ring-foreground/10">
            {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
            <img src={output?.url ?? source.url} alt={output ? "Resized image" : "Original image"} className="max-h-[28rem] max-w-full object-contain shadow-md" />
          </div>
          {output && (
            <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-primary p-5 text-primary-foreground">
              <div className="space-y-1">
                <p className="flex flex-wrap items-center gap-2 text-lg font-bold tabular-nums">
                  {source.width}×{source.height} <ArrowRight className="size-4" aria-label="to" /> {output.width}×{output.height}
                </p>
                <p className="text-sm opacity-85 tabular-nums">
                  {formatBytes(source.file.size)} → {formatBytes(output.blob.size)} · {MIME_LABEL[output.type]}
                </p>
              </div>
              <Button
                variant="secondary"
                className="h-11"
                onClick={() => {
                  const suffix = preset ?? `${output.width}x${output.height}`;
                  downloadBlob(output.blob, withExtension(source.file.name, OUTPUT_EXT[output.type]).replace(/(\.\w+)$/, `-${suffix}$1`));
                  toast.success("Image downloaded.");
                }}
              >
                <Download /> Download image
              </Button>
            </div>
          )}
        </section>

        <aside className="space-y-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10 lg:sticky lg:top-32">
          <h2 className="text-base font-semibold">Resize</h2>
          <div className="space-y-2">
            <p className="text-sm font-medium">Presets</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={preset === p.id}
                  onClick={() => applyPreset(p)}
                  className={cn(
                    "min-h-9 rounded-full border px-3 text-sm font-medium transition-colors",
                    preset === p.id ? "border-transparent bg-brand text-white shadow-sm" : "bg-background hover:border-primary/40 hover:bg-accent",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
            <NumberField label="Width" suffix="px" value={width} onChange={changeWidth} error={widthError} />
            <Button
              type="button"
              variant={locked ? "secondary" : "ghost"}
              size="icon"
              className="mt-6 size-11"
              aria-pressed={locked}
              aria-label={locked ? "Aspect ratio locked" : "Aspect ratio unlocked"}
              title="Lock aspect ratio"
              onClick={() => {
                const next = !locked;
                setLocked(next);
                // Re-locking snaps the height back to the original proportions.
                if (next && Number.isFinite(w) && w > 0) setHeight(String(Math.max(1, Math.round(w / ratio))));
                clearOutput();
              }}
            >
              {locked ? <Link2 /> : <Link2Off />}
            </Button>
            <NumberField label="Height" suffix="px" value={height} onChange={changeHeight} error={heightError} />
          </div>
          {tooLarge && <p role="alert" className="text-sm text-destructive">That size is too large to process in the browser.</p>}
          {aspectDiffers && (
            <SegmentedControl
              label="Different shape — how should it fit?"
              value={fit}
              onChange={(v) => {
                setFit(v);
                clearOutput();
              }}
              options={[
                { value: "cover", label: "Fill & crop" },
                { value: "contain", label: "Fit inside" },
                { value: "stretch", label: "Stretch" },
              ]}
            />
          )}
          {(format === "image/jpeg" || (aspectDiffers && fit === "contain")) && (
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="bg" className="text-sm font-medium">
                Background colour
              </label>
              <input id="bg" type="color" value={background} onChange={(e) => { setBackground(e.target.value); clearOutput(); }} className="h-10 w-16 cursor-pointer rounded-md border bg-background" />
            </div>
          )}
          <SelectField
            label="Format"
            value={format}
            onChange={(v) => {
              setFormat(v);
              clearOutput();
            }}
            options={(["image/jpeg", "image/png", "image/webp"] as OutputMime[]).map((m) => ({ value: m, label: MIME_LABEL[m] }))}
          />
          {format !== "image/png" && (
            <div className="space-y-1.5">
              <label htmlFor="resize-quality" className="flex justify-between text-sm font-medium">
                Quality <span className="tabular-nums text-muted-foreground">{quality}%</span>
              </label>
              <input id="resize-quality" type="range" min={40} max={100} step={5} value={quality} onChange={(e) => { setQuality(e.target.value); clearOutput(); }} className="w-full accent-primary" />
            </div>
          )}
          <Button className="h-11 w-full" onClick={resize} disabled={busy || !valid}>
            {busy ? <Loader2 className="animate-spin" /> : <Scaling />} Resize image
          </Button>
        </aside>
      </div>
    </div>
  );
}
