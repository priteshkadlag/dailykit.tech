"use client";

import { track } from "@/lib/analytics/client";
import { useState } from "react";
import { ArrowRight, Download, FileArchive, Loader2, RotateCcw, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { downloadBlob, zipBlobs } from "@/lib/files/download";
import { formatBytes, IMAGE_MIMES, MIME_LABEL, withExtension, type AcceptedFile, type SupportedMime } from "@/lib/files/validation";
import { useObjectUrls } from "@/lib/hooks/use-object-urls";
import { resolveDimensions } from "@/lib/image/geometry";
import { decodeImage, OUTPUT_EXT, renderImage, type OutputMime } from "@/lib/image/process";
import { Button } from "@/components/ui/button";
import { SegmentedControl, SelectField } from "@/components/shared/form-fields";
import { FileDropzone, PrivacyNote } from "./file-dropzone";

const RULES = { accept: IMAGE_MIMES, maxBytes: 25 * 1024 * 1024, maxCount: 30 };

type Level = "low" | "medium" | "high" | "custom";
const LEVEL_QUALITY: Record<Exclude<Level, "custom">, number> = { low: 85, medium: 70, high: 50 };
type FormatChoice = "auto" | OutputMime;

const MAX_WIDTHS = [
  { value: "0", label: "Keep original size" },
  { value: "2560", label: "2560 px wide" },
  { value: "1920", label: "1920 px (Full HD)" },
  { value: "1280", label: "1280 px (web)" },
  { value: "1080", label: "1080 px (social media)" },
  { value: "800", label: "800 px (email, thumbnails)" },
];

interface Result {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  type: OutputMime;
  /** Compression didn't help, so the original file is kept. */
  keptOriginal: boolean;
}

interface Item {
  id: string;
  file: File;
  mime: SupportedMime;
  url: string;
  width: number;
  height: number;
  result?: Result;
}

/** PNG is lossless, so "auto" turns it into WEBP (which keeps transparency) to actually save space. */
function outputFor(choice: FormatChoice, source: SupportedMime): OutputMime {
  if (choice !== "auto") return choice;
  return source === "image/jpeg" ? "image/jpeg" : "image/webp";
}

export function ImageCompressor() {
  const urls = useObjectUrls();
  const [items, setItems] = useState<Item[]>([]);
  const [level, setLevel] = useState<Level>("medium");
  const [custom, setCustom] = useState("60");
  const [format, setFormat] = useState<FormatChoice>("auto");
  const [maxWidth, setMaxWidth] = useState("0");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const quality = level === "custom" ? Number(custom) : LEVEL_QUALITY[level];
  const done = items.filter((i) => i.result);
  const allDone = items.length > 0 && done.length === items.length;

  const clearResults = () =>
    setItems((list) =>
      list.map((i) => {
        if (i.result && !i.result.keptOriginal) urls.revoke(i.result.url);
        return { ...i, result: undefined };
      }),
    );

  const add = async (files: AcceptedFile[]) => {
    const added: Item[] = [];
    for (const { file, mime } of files) {
      try {
        const bitmap = await decodeImage(file);
        added.push({ id: crypto.randomUUID(), file, mime, url: urls.create(file), width: bitmap.width, height: bitmap.height });
        bitmap.close();
      } catch (error) {
        toast.error(`${file.name}: ${error instanceof Error ? error.message : "couldn't be read"}`);
      }
    }
    setItems((list) => [...list, ...added]);
  };

  const remove = (item: Item) => {
    urls.revoke(item.url, item.result && !item.result.keptOriginal ? item.result.url : null);
    setItems((list) => list.filter((i) => i.id !== item.id));
  };

  const reset = () => {
    items.forEach((i) => urls.revoke(i.url, i.result && !i.result.keptOriginal ? i.result.url : null));
    setItems([]);
  };

  const compress = async () => {
    clearResults();
    setProgress({ done: 0, total: items.length });
    let failures = 0;
    for (let n = 0; n < items.length; n++) {
      const item = items[n];
      try {
        const bitmap = await decodeImage(item.file);
        const limit = Number(maxWidth);
        const target = limit && bitmap.width > limit ? resolveDimensions(bitmap, limit, null) : { width: bitmap.width, height: bitmap.height };
        const type = outputFor(format, item.mime);
        const out = await renderImage(bitmap, { target, type, quality: quality / 100, background: type === "image/jpeg" ? "#ffffff" : null });
        bitmap.close();
        const resized = target.width !== item.width;
        // If re-encoding made it bigger (already optimised) and nothing else changed, keep the original.
        const keepOriginal = !resized && out.type === item.mime && out.blob.size >= item.file.size;
        const result: Result = keepOriginal
          ? { blob: item.file, url: item.url, width: item.width, height: item.height, type: item.mime as OutputMime, keptOriginal: true }
          : { blob: out.blob, url: urls.create(out.blob), width: out.width, height: out.height, type: out.type, keptOriginal: false };
        setItems((list) => list.map((i) => (i.id === item.id ? { ...i, result } : i)));
      } catch {
        failures++;
      }
      setProgress({ done: n + 1, total: items.length });
    }
    setProgress(null);
    if (failures) toast.error(`${failures} image${failures === 1 ? "" : "s"} couldn't be compressed.`);
    else {
      toast.success(`Compressed ${items.length} image${items.length === 1 ? "" : "s"}.`);
      track("image_compressed");
    }
  };

  const outName = (item: Item) => (item.result ? withExtension(item.file.name, OUTPUT_EXT[item.result.type]).replace(/(\.\w+)$/, item.result.keptOriginal ? "$1" : "-compressed$1") : item.file.name);
  const before = done.reduce((s, i) => s + i.file.size, 0);
  const after = done.reduce((s, i) => s + (i.result?.blob.size ?? 0), 0);
  const busy = progress !== null;

  return (
    <div className="space-y-6">
      <PrivacyNote />
      {items.length === 0 ? (
        <FileDropzone rules={RULES} onFiles={add} title="Choose images" />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section aria-label="Images" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">{items.length} image{items.length === 1 ? "" : "s"}</p>
              <Button variant="ghost" className="h-9" onClick={reset} disabled={busy}>
                <RotateCcw /> Start over
              </Button>
            </div>

            {allDone && (
              <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-primary p-5 text-primary-foreground">
                <div>
                  <p className="text-sm opacity-85">Total</p>
                  <p className="flex flex-wrap items-center gap-2 text-2xl font-bold tabular-nums">
                    {formatBytes(before)} <ArrowRight className="size-5" aria-label="to" /> {formatBytes(after)}
                  </p>
                  <p className="text-sm opacity-85">{before > 0 ? `${Math.max(0, Math.round((1 - after / before) * 100))}% smaller` : ""}</p>
                </div>
                {items.length > 1 && (
                  <Button
                    variant="secondary"
                    className="h-11"
                    onClick={async () => {
                      const zip = await zipBlobs(items.filter((i) => i.result).map((i) => ({ name: outName(i), blob: i.result!.blob })));
                      downloadBlob(zip, "compressed-images.zip");
                      toast.success("ZIP downloaded.");
                    }}
                  >
                    <FileArchive /> Download all (ZIP)
                  </Button>
                )}
              </div>
            )}

            <ul className="space-y-3">
              {items.map((item) => {
                const r = item.result;
                const saved = r ? Math.round((1 - r.blob.size / item.file.size) * 100) : 0;
                return (
                  <li key={item.id} className="flex flex-col gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/50">
                        {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
                        <img src={r?.url ?? item.url} alt="" className="max-h-full max-w-full object-contain" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium" title={item.file.name}>
                          {item.file.name}
                        </p>
                        <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground tabular-nums">
                          <span>{formatBytes(item.file.size)}</span>
                          {r && (
                            <>
                              <ArrowRight className="size-3.5" aria-label="to" />
                              <span className="font-semibold text-foreground">{formatBytes(r.blob.size)}</span>
                              {r.keptOriginal ? (
                                <span className="text-xs">· already optimised, original kept</span>
                              ) : (
                                <span className={saved > 0 ? "font-medium text-emerald-700" : ""}>· {saved > 0 ? `${saved}% saved` : "no saving"}</span>
                              )}
                            </>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.width}×{item.height}
                          {r && (r.width !== item.width ? ` → ${r.width}×${r.height}` : "")} · {MIME_LABEL[item.mime]}
                          {r && r.type !== item.mime ? ` → ${MIME_LABEL[r.type]}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {r && (
                        <Button variant="outline" className="h-10 flex-1" onClick={() => downloadBlob(r.blob, outName(item))}>
                          <Download /> Download
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="size-10" aria-label={`Remove ${item.file.name}`} onClick={() => remove(item)} disabled={busy}>
                        <X />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
            {items.length < RULES.maxCount && (
              <FileDropzone
                rules={RULES}
                alreadySelected={items.length}
                onFiles={(f) => {
                  void add(f);
                }}
                title="Add more images"
                compact
              />
            )}
          </section>

          <aside className="space-y-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10 lg:sticky lg:top-32">
            <h2 className="text-base font-semibold">Compression</h2>
            <SegmentedControl
              label="Level"
              value={level}
              onChange={(v) => {
                setLevel(v);
                clearResults();
              }}
              options={[
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
                { value: "custom", label: "Custom" },
              ]}
            />
            {level === "custom" ? (
              <div className="space-y-1.5">
                <label htmlFor="quality" className="flex justify-between text-sm font-medium">
                  Quality <span className="tabular-nums text-muted-foreground">{custom}%</span>
                </label>
                <input id="quality" type="range" min={10} max={95} step={5} value={custom} onChange={(e) => { setCustom(e.target.value); clearResults(); }} className="w-full accent-primary" />
                <p className="text-xs text-muted-foreground">Lower quality = smaller file.</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {level === "low" ? "Best quality, modest savings." : level === "medium" ? "Good balance of quality and size — recommended." : "Smallest files, some visible softening."}
              </p>
            )}
            <SelectField
              label="Output format"
              value={format}
              onChange={(v) => {
                setFormat(v);
                clearResults();
              }}
              options={[
                { value: "auto", label: "Automatic (recommended)" },
                { value: "image/jpeg", label: "JPG" },
                { value: "image/webp", label: "WEBP" },
                { value: "image/png", label: "PNG (lossless)" },
              ]}
              hint={format === "auto" ? "JPG stays JPG; PNG and WEBP become WEBP, which keeps transparency." : format === "image/png" ? "PNG only gets smaller if you also reduce the size." : undefined}
            />
            <SelectField label="Maximum width" value={maxWidth} onChange={(v) => { setMaxWidth(v); clearResults(); }} options={MAX_WIDTHS} />
            <Button className="h-11 w-full" onClick={compress} disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="animate-spin" /> Compressing {progress.done} of {progress.total}…
                </>
              ) : (
                <>
                  <Sparkles /> Compress {items.length > 1 ? `${items.length} images` : "image"}
                </>
              )}
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}
