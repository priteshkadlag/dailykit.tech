"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { toast } from "sonner";
import { useObjectUrls } from "@/lib/hooks/use-object-urls";
import { displaySizes, openPdf, renderPdfPage, type OpenedPdf } from "@/lib/pdf/pdf-render";

export interface LoadedPdf {
  file: File;
  /** The original bytes — every edit starts from these, so nothing is re-encoded twice. */
  bytes: Uint8Array;
  doc: PDFDocumentProxy;
  /** Page sizes as displayed, in points. */
  sizes: { width: number; height: number }[];
}

/** Open one PDF with pdf.js for previews, keeping its bytes for editing. Frees memory on reset/unmount. */
export function usePdf() {
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [loading, setLoading] = useState(false);
  const opened = useRef<OpenedPdf | null>(null);

  const close = useCallback(() => {
    void opened.current?.destroy();
    opened.current = null;
  }, []);

  useEffect(() => close, [close]);

  const open = useCallback(
    async (file: File) => {
      setLoading(true);
      close();
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const handle = await openPdf(new Blob([bytes]));
        opened.current = handle;
        setPdf({ file, bytes, doc: handle.doc, sizes: await displaySizes(handle.doc) });
        return true;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't open this PDF.");
        setPdf(null);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [close],
  );

  const reset = useCallback(() => {
    close();
    setPdf(null);
  }, [close]);

  return { pdf, loading, open, reset };
}

/** Small page previews, rendered one at a time in the background. */
export function useThumbnails(doc: PDFDocumentProxy | null | undefined, { limit = 200, dpi = 28 } = {}) {
  const { create, revoke } = useObjectUrls();
  const [thumbs, setThumbs] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!doc) return;
    let cancelled = false;
    const made: string[] = [];
    (async () => {
      for (let p = 1; p <= Math.min(doc.numPages, limit); p++) {
        try {
          const img = await renderPdfPage(doc, p, { dpi, type: "image/jpeg", quality: 0.7 });
          if (cancelled) return;
          const url = create(img.blob);
          made.push(url);
          setThumbs((t) => ({ ...t, [p]: url }));
        } catch {
          if (cancelled) return;
        }
      }
    })();
    return () => {
      cancelled = true;
      revoke(...made);
      setThumbs({});
    };
  }, [doc, limit, dpi, create, revoke]);

  return thumbs;
}
