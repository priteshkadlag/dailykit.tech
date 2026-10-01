"use client";

import { track } from "@/lib/analytics/client";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Download, FileText, GripVertical, Loader2, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { downloadBlob } from "@/lib/files/download";
import { formatBytes, IMAGE_MIMES, type AcceptedFile } from "@/lib/files/validation";
import { useObjectUrls } from "@/lib/hooks/use-object-urls";
import { PAGE_SIZES_MM, type PageSizeId } from "@/lib/image/geometry";
import { imagesToPdf, PDF_QUALITY, type PdfQuality } from "@/lib/pdf/images-to-pdf";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SegmentedControl, SelectField } from "@/components/shared/form-fields";
import { FileDropzone, PrivacyNote } from "./file-dropzone";

const RULES = { accept: IMAGE_MIMES, maxBytes: 25 * 1024 * 1024, maxCount: 50 };

interface Item {
  id: string;
  file: File;
  url: string;
}

const MARGINS = [
  { value: "0", label: "No margin" },
  { value: "5", label: "Small (5 mm)" },
  { value: "10", label: "Medium (10 mm)" },
  { value: "20", label: "Large (20 mm)" },
];

export function ImageToPdf() {
  const urls = useObjectUrls();
  const [items, setItems] = useState<Item[]>([]);
  const [pageSize, setPageSize] = useState<PageSizeId>("a4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [margin, setMargin] = useState("10");
  const [quality, setQuality] = useState<PdfQuality>("balanced");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<{ blob: Blob; pages: number } | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Any change to the inputs makes a previously built PDF stale.
  const invalidate = () => setResult(null);

  const add = (files: AcceptedFile[]) => {
    setItems((list) => [...list, ...files.map(({ file }) => ({ id: crypto.randomUUID(), file, url: urls.create(file) }))]);
    invalidate();
  };
  const remove = (id: string) => {
    setItems((list) => {
      urls.revoke(list.find((i) => i.id === id)?.url);
      return list.filter((i) => i.id !== id);
    });
    invalidate();
  };
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    setItems((list) => {
      const next = [...list];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    invalidate();
  };
  const reset = () => {
    urls.revoke(...items.map((i) => i.url));
    setItems([]);
    setResult(null);
  };

  const convert = async () => {
    setProgress({ done: 0, total: items.length });
    setResult(null);
    try {
      const blob = await imagesToPdf(
        items.map((i) => i.file),
        { pageSize, orientation, marginMm: Number(margin), quality, onProgress: (done, total) => setProgress({ done, total }) },
      );
      setResult({ blob, pages: items.length });
      toast.success(`PDF created with ${items.length} page${items.length === 1 ? "" : "s"}.`);
      track("pdf_generated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't create the PDF.");
    } finally {
      setProgress(null);
    }
  };

  const busy = progress !== null;
  const totalInput = items.reduce((s, i) => s + i.file.size, 0);

  return (
    <div className="space-y-6">
      <PrivacyNote />
      {items.length === 0 ? (
        <FileDropzone rules={RULES} onFiles={add} title="Choose images" />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section aria-label="Selected images" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                {items.length} image{items.length === 1 ? "" : "s"} · {formatBytes(totalInput)} · drag or use the arrows to reorder
              </p>
              <Button variant="ghost" className="h-9" onClick={reset} disabled={busy}>
                <RotateCcw /> Start over
              </Button>
            </div>
            <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {items.map((item, index) => (
                <li
                  key={item.id}
                  draggable={!busy}
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragIndex !== null) move(dragIndex, index);
                    setDragIndex(null);
                  }}
                  onDragEnd={() => setDragIndex(null)}
                  className={cn("group relative overflow-hidden rounded-lg bg-card ring-1 ring-foreground/10", dragIndex === index && "opacity-50")}
                >
                  <div className="flex aspect-[3/4] items-center justify-center bg-muted/50 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
                    <img src={item.url} alt={item.file.name} className="max-h-full max-w-full object-contain shadow-sm" />
                  </div>
                  <span className="absolute top-2 left-2 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{index + 1}</span>
                  <GripVertical className="absolute top-2 right-9 hidden size-5 text-muted-foreground sm:block" aria-hidden />
                  <Button variant="secondary" size="icon" className="absolute top-1.5 right-1.5 size-7" aria-label={`Remove ${item.file.name}`} onClick={() => remove(item.id)} disabled={busy}>
                    <X />
                  </Button>
                  <div className="flex items-center gap-1 border-t px-1.5 py-1">
                    <Button variant="ghost" size="icon" className="size-8" aria-label={`Move ${item.file.name} earlier`} disabled={busy || index === 0} onClick={() => move(index, index - 1)}>
                      <ArrowLeft />
                    </Button>
                    <span className="min-w-0 flex-1 truncate text-center text-xs text-muted-foreground" title={item.file.name}>
                      {item.file.name}
                    </span>
                    <Button variant="ghost" size="icon" className="size-8" aria-label={`Move ${item.file.name} later`} disabled={busy || index === items.length - 1} onClick={() => move(index, index + 1)}>
                      <ArrowRight />
                    </Button>
                  </div>
                </li>
              ))}
            </ol>
            {items.length < RULES.maxCount && <FileDropzone rules={RULES} alreadySelected={items.length} onFiles={add} title="Add more images" compact />}
          </section>

          <aside className="space-y-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10 lg:sticky lg:top-32">
            <h2 className="text-base font-semibold">PDF settings</h2>
            <SelectField
              label="Page size"
              value={pageSize}
              onChange={(v) => {
                setPageSize(v);
                invalidate();
              }}
              options={[...Object.entries(PAGE_SIZES_MM).map(([value, s]) => ({ value: value as PageSizeId, label: s.label })), { value: "original" as PageSizeId, label: "Original image size" }]}
            />
            {pageSize !== "original" && (
              <SegmentedControl
                label="Orientation"
                value={orientation}
                onChange={(v) => {
                  setOrientation(v);
                  invalidate();
                }}
                options={[
                  { value: "portrait", label: "Portrait" },
                  { value: "landscape", label: "Landscape" },
                ]}
              />
            )}
            <SelectField label="Margin" value={margin} onChange={(v) => { setMargin(v); invalidate(); }} options={MARGINS} />
            <SelectField
              label="Image quality"
              value={quality}
              onChange={(v) => {
                setQuality(v);
                invalidate();
              }}
              options={(Object.keys(PDF_QUALITY) as PdfQuality[]).map((q) => ({ value: q, label: PDF_QUALITY[q].label }))}
            />
            <Button className="h-11 w-full" onClick={convert} disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="animate-spin" /> Converting {progress.done} of {progress.total}…
                </>
              ) : (
                <>
                  <FileText /> Convert to PDF
                </>
              )}
            </Button>
            {result && (
              <div role="status" className="space-y-3 rounded-lg bg-accent p-4 text-accent-foreground">
                <p className="text-sm font-medium">
                  PDF ready · {result.pages} page{result.pages === 1 ? "" : "s"} · {formatBytes(result.blob.size)}
                </p>
                <Button
                  className="h-11 w-full"
                  onClick={() => {
                    downloadBlob(result.blob, "images.pdf");
                    toast.success("PDF downloaded.");
                  }}
                >
                  <Download /> Download PDF
                </Button>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
