"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Download, FileArchive, ImageIcon, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { downloadBlob, zipBlobs } from "@/lib/files/download";
import { formatBytes, withExtension, type AcceptedFile } from "@/lib/files/validation";
import { useObjectUrls } from "@/lib/hooks/use-object-urls";
import { OUTPUT_EXT, type OutputMime } from "@/lib/image/process";
import { parsePageRange } from "@/lib/pdf/page-range";
import { openPdf, renderPdfPage, type OpenedPdf } from "@/lib/pdf/pdf-render";
import { Button } from "@/components/ui/button";
import { SegmentedControl, SelectField, TextField } from "@/components/shared/form-fields";
import { FileDropzone, PrivacyNote } from "./file-dropzone";

const RULES = { accept: ["application/pdf" as const], maxBytes: 50 * 1024 * 1024, maxCount: 1 };
const THUMBNAIL_LIMIT = 60;

const DPI = [
  { value: "72", label: "Screen (72 dpi)" },
  { value: "150", label: "Standard (150 dpi)" },
  { value: "300", label: "Print (300 dpi)" },
];

interface PageImage {
  page: number;
  blob: Blob;
  url: string;
  width: number;
  height: number;
}

export function PdfToImage() {
  const urls = useObjectUrls();
  const [file, setFile] = useState<File | null>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(false);
  const [thumbs, setThumbs] = useState<Record<number, string>>({});
  const [format, setFormat] = useState<OutputMime>("image/jpeg");
  const [quality, setQuality] = useState("85");
  const [dpi, setDpi] = useState("150");
  const [range, setRange] = useState("");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [results, setResults] = useState<PageImage[]>([]);
  const openedRef = useRef<OpenedPdf | null>(null);

  // Release the pdf.js document (and its worker memory) when leaving the page.
  useEffect(() => () => void openedRef.current?.destroy(), [openedRef]);

  const selection = doc ? parsePageRange(range, doc.numPages) : { pages: [] as number[] };
  const selected = new Set(selection.pages);

  const clearResults = () => {
    urls.revoke(...results.map((r) => r.url));
    setResults([]);
  };

  const reset = () => {
    clearResults();
    urls.revoke(...Object.values(thumbs));
    setThumbs({});
    void openedRef.current?.destroy();
    openedRef.current = null;
    setDoc(null);
    setFile(null);
    setRange("");
  };

  const open = async ([accepted]: AcceptedFile[]) => {
    setLoading(true);
    try {
      const opened = await openPdf(accepted.file);
      const pdf = opened.doc;
      openedRef.current = opened;
      setDoc(pdf);
      setFile(accepted.file);
      // Thumbnails render one at a time in the background so the page stays responsive.
      for (let p = 1; p <= Math.min(pdf.numPages, THUMBNAIL_LIMIT); p++) {
        if (openedRef.current !== opened) return;
        const img = await renderPdfPage(pdf, p, { dpi: 24, type: "image/jpeg", quality: 0.7 });
        if (openedRef.current !== opened) return;
        const url = urls.create(img.blob);
        setThumbs((t) => ({ ...t, [p]: url }));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't open this PDF.");
      reset();
    } finally {
      setLoading(false);
    }
  };

  const convert = async () => {
    if (!doc || selection.error) return;
    clearResults();
    const pages = selection.pages;
    setProgress({ done: 0, total: pages.length });
    const out: PageImage[] = [];
    try {
      for (const page of pages) {
        const img = await renderPdfPage(doc, page, { dpi: Number(dpi), type: format, quality: Number(quality) / 100 });
        out.push({ page, blob: img.blob, url: urls.create(img.blob), width: img.width, height: img.height });
        setProgress({ done: out.length, total: pages.length });
      }
      setResults(out);
      toast.success(`Converted ${out.length} page${out.length === 1 ? "" : "s"} to ${format === "image/png" ? "PNG" : "JPG"}.`);
    } catch {
      urls.revoke(...out.map((r) => r.url));
      toast.error("Couldn't convert this PDF. Try a lower resolution.");
    } finally {
      setProgress(null);
    }
  };

  const baseName = file ? file.name.replace(/\.pdf$/i, "") : "page";
  const pageName = (page: number) => `${baseName}-page-${page}.${OUTPUT_EXT[format]}`;
  const busy = progress !== null;

  if (!doc || !file) {
    return (
      <div className="space-y-6">
        <PrivacyNote />
        {loading ? (
          <div className="flex min-h-56 items-center justify-center gap-2 rounded-xl bg-card text-muted-foreground ring-1 ring-foreground/10">
            <Loader2 className="size-5 animate-spin" /> Opening PDF…
          </div>
        ) : (
          <FileDropzone rules={RULES} onFiles={open} title="Choose a PDF" />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PrivacyNote />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-label="Page previews" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 truncate text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{file.name}</span> · {doc.numPages} page{doc.numPages === 1 ? "" : "s"} · {formatBytes(file.size)}
            </p>
            <Button variant="ghost" className="h-9" onClick={reset} disabled={busy}>
              <RotateCcw /> Choose another PDF
            </Button>
          </div>
          <ol className="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-6">
            {Array.from({ length: Math.min(doc.numPages, THUMBNAIL_LIMIT) }, (_, i) => i + 1).map((page) => (
              <li key={page} className={selected.has(page) ? "" : "opacity-40"}>
                <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-md bg-white ring-1 ring-foreground/10">
                  {thumbs[page] ? (
                    // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
                    <img src={thumbs[page]} alt={`Page ${page}`} className="max-h-full max-w-full object-contain" />
                  ) : (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
                  )}
                </div>
                <p className="mt-1 text-center text-xs text-muted-foreground">{page}</p>
              </li>
            ))}
          </ol>
          {doc.numPages > THUMBNAIL_LIMIT && <p className="text-sm text-muted-foreground">Showing previews of the first {THUMBNAIL_LIMIT} pages. All pages can be converted.</p>}
        </section>

        <aside className="space-y-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10 lg:sticky lg:top-32">
          <h2 className="text-base font-semibold">Image settings</h2>
          <SegmentedControl
            label="Format"
            value={format}
            onChange={(v) => {
              setFormat(v);
              clearResults();
            }}
            options={[
              { value: "image/jpeg", label: "JPG" },
              { value: "image/png", label: "PNG" },
            ]}
          />
          <SelectField label="Resolution" value={dpi} onChange={(v) => { setDpi(v); clearResults(); }} options={DPI} />
          {format === "image/jpeg" && (
            <div className="space-y-1.5">
              <label htmlFor="pdf-quality" className="flex justify-between text-sm font-medium">
                Quality <span className="tabular-nums text-muted-foreground">{quality}%</span>
              </label>
              <input id="pdf-quality" type="range" min={40} max={100} step={5} value={quality} onChange={(e) => { setQuality(e.target.value); clearResults(); }} className="w-full accent-primary" />
            </div>
          )}
          <TextField
            label="Pages"
            value={range}
            onChange={(v) => {
              setRange(v);
              clearResults();
            }}
            placeholder={`All pages (1–${doc.numPages})`}
            error={selection.error}
            hint={selection.error ? undefined : `e.g. 1-3, 5 · ${selection.pages.length} page${selection.pages.length === 1 ? "" : "s"} selected`}
          />
          <Button className="h-11 w-full" onClick={convert} disabled={busy || !!selection.error}>
            {busy ? (
              <>
                <Loader2 className="animate-spin" /> Converting {progress.done} of {progress.total}…
              </>
            ) : (
              <>
                <ImageIcon /> Convert to {format === "image/png" ? "PNG" : "JPG"}
              </>
            )}
          </Button>
        </aside>
      </div>

      {results.length > 0 && (
        <section aria-labelledby="results-heading" className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="results-heading" className="text-base font-semibold">
                {results.length} image{results.length === 1 ? "" : "s"} ready
              </h2>
              <p className="text-sm text-muted-foreground">{formatBytes(results.reduce((s, r) => s + r.blob.size, 0))} total</p>
            </div>
            {results.length > 1 && (
              <Button
                className="h-11"
                onClick={async () => {
                  const zip = await zipBlobs(results.map((r) => ({ name: pageName(r.page), blob: r.blob })));
                  downloadBlob(zip, withExtension(`${baseName}-images`, "zip"));
                  toast.success("ZIP downloaded.");
                }}
              >
                <FileArchive /> Download all (ZIP)
              </Button>
            )}
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {results.map((r) => (
              <li key={r.page} className="overflow-hidden rounded-lg ring-1 ring-foreground/10">
                <div className="flex aspect-[3/4] items-center justify-center bg-muted/40 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
                  <img src={r.url} alt={`Page ${r.page} image`} className="max-h-full max-w-full object-contain" />
                </div>
                <div className="space-y-1 border-t p-2">
                  <p className="text-xs text-muted-foreground">
                    Page {r.page} · {r.width}×{r.height} · {formatBytes(r.blob.size)}
                  </p>
                  <Button variant="outline" className="h-9 w-full" onClick={() => downloadBlob(r.blob, pageName(r.page))}>
                    <Download /> Download
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
