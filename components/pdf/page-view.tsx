"use client";

import { useEffect, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { renderPdfPage } from "@/lib/pdf/pdf-render";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Percent of a page dimension, for positioning overlays on a page preview. */
export const pct = (value: number, total: number) => `${(value / total) * 100}%`;

/** Font size that scales with the preview: points on the page → container-width units. */
export const previewFontSize = (sizePt: number, pageWidthPt: number) => `${(sizePt / pageWidthPt) * 100}cqw`;

/** A page rendered to an image about `widthPx` wide (freed when the page changes). */
export function usePageImage(doc: PDFDocumentProxy, page: number, pageWidthPt: number, widthPx = 1000) {
  const [image, setImage] = useState<{ key: string; url: string } | null>(null);
  const key = `${page}:${widthPx}`;

  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;
    const dpi = Math.min(150, (widthPx / pageWidthPt) * 72);
    renderPdfPage(doc, page, { dpi, type: "image/jpeg", quality: 0.85 })
      .then((img) => {
        if (cancelled) return;
        url = URL.createObjectURL(img.blob);
        setImage({ key, url });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [doc, page, pageWidthPt, widthPx, key]);

  return image?.key === key ? image.url : null;
}

/** One page, drawn at the width of its container, with overlays positioned in page percentages. */
export function PageView({
  doc,
  page,
  size,
  children,
  className,
  containerRef,
  onPointerDown,
}: {
  doc: PDFDocumentProxy;
  page: number;
  size: { width: number; height: number };
  children?: React.ReactNode;
  className?: string;
  containerRef?: React.Ref<HTMLDivElement>;
  onPointerDown?: React.PointerEventHandler<HTMLDivElement>;
}) {
  const src = usePageImage(doc, page, size.width);
  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      className={cn("relative w-full overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-foreground/15 select-none", className)}
      style={{ aspectRatio: `${size.width} / ${size.height}`, containerType: "inline-size" }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
        <img src={src} alt={`Page ${page}`} draggable={false} className="pointer-events-none absolute inset-0 size-full" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <Loader2 className="size-5 animate-spin" aria-hidden />
        </div>
      )}
      {children}
    </div>
  );
}

/** "‹  Page 2 of 9  ›" */
export function PageNav({ page, total, onChange, marks }: { page: number; total: number; onChange: (page: number) => void; marks?: Set<number> }) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2">
      <Button variant="outline" size="icon" className="size-10" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
        <ChevronLeft />
      </Button>
      <label className="flex items-center gap-2 text-sm">
        <span className="sr-only">Go to page</span>
        Page
        <select value={page} onChange={(e) => onChange(Number(e.target.value))} className="h-10 rounded-lg border border-input bg-background px-2 text-sm">
          {Array.from({ length: total }, (_, i) => i + 1).map((p) => (
            <option key={p} value={p}>
              {p}
              {marks?.has(p) ? " •" : ""}
            </option>
          ))}
        </select>
        of {total}
      </label>
      <Button variant="outline" size="icon" className="size-10" onClick={() => onChange(page + 1)} disabled={page >= total} aria-label="Next page">
        <ChevronRight />
      </Button>
    </div>
  );
}
