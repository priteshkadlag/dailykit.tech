"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { track } from "@/lib/analytics/client";
import { markdownToDocx } from "@/lib/pdf/docx";
import { linesToMarkdown } from "@/lib/pdf/markdown";
import { renderPdfPage } from "@/lib/pdf/pdf-render";
import { cellValue, documentLines, fragmentsToTable, pageFragments } from "@/lib/pdf/text";
import { CheckboxField, SegmentedControl } from "@/components/shared/form-fields";
import { ActionButton, baseName, FileBar, PdfPicker, PdfResult, ProgressBar, type OutputFile } from "./pdf-shell";
import { usePdf, type LoadedPdf } from "./use-pdf";

export type OfficeTarget = "word" | "excel" | "powerpoint";

const TYPES = {
  word: { ext: "docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  excel: { ext: "xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  powerpoint: { ext: "pptx", mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
};

class NoTextError extends Error {}

export function PdfToOffice({ target }: { target: OfficeTarget }) {
  const { pdf, loading, open, reset } = usePdf();
  if (!pdf) return <PdfPicker loading={loading} onFile={open} />;
  return <Converter key={pdf.file.name + pdf.file.lastModified} pdf={pdf} reset={reset} target={target} />;
}

function Converter({ pdf, reset, target }: { pdf: LoadedPdf; reset: () => void; target: OfficeTarget }) {
  const total = pdf.doc.numPages;
  const [pageBreaks, setPageBreaks] = useState(true);
  const [sheets, setSheets] = useState<"per-page" | "single">("per-page");
  const [slides, setSlides] = useState<"images" | "text">("images");
  const [progress, setProgress] = useState<{ label: string; done: number; total: number } | null>(null);
  const [result, setResult] = useState<OutputFile[] | null>(null);
  const [noText, setNoText] = useState(false);

  const onProgress = (label: string) => (done: number, t: number) => setProgress({ label, done, total: t });

  const toWord = async () => {
    const pages = await documentLines(pdf.doc, onProgress("Reading text…"));
    if (pages.every((p) => p.length === 0)) throw new NoTextError();
    return markdownToDocx(linesToMarkdown(pages, { pageBreaks }), { title: baseName(pdf.file) });
  };

  const toExcel = async () => {
    const XLSX = await import("xlsx");
    const book = XLSX.utils.book_new();
    const all: (string | number)[][] = [];
    let found = false;
    for (let p = 1; p <= total; p++) {
      setProgress({ label: "Finding tables…", done: p - 1, total });
      const rows = fragmentsToTable(await pageFragments(pdf.doc, p)).map((r) => r.map(cellValue));
      if (rows.length === 0) continue;
      found = true;
      if (sheets === "single") {
        if (all.length) all.push([]);
        all.push(...rows);
      } else addSheet(XLSX, book, rows, `Page ${p}`);
    }
    if (!found) throw new NoTextError();
    if (sheets === "single") addSheet(XLSX, book, all, "PDF");
    return new Blob([XLSX.write(book, { type: "array", bookType: "xlsx" })], { type: TYPES.excel.mime });
  };

  const toPowerPoint = async () => {
    const PptxGenJS = (await import("pptxgenjs")).default;
    const ppt = new PptxGenJS();
    // Slide size follows the first page's shape (10 in wide).
    const first = pdf.sizes[0];
    const w = 10;
    const h = Math.round((w * first.height) / first.width * 100) / 100;
    ppt.defineLayout({ name: "PDF", width: w, height: h });
    ppt.layout = "PDF";
    const pages = slides === "text" ? await documentLines(pdf.doc, onProgress("Reading text…")) : null;
    if (pages?.every((p) => p.length === 0)) throw new NoTextError();
    for (let p = 1; p <= total; p++) {
      const slide = ppt.addSlide();
      if (slides === "images") {
        setProgress({ label: "Rendering pages…", done: p - 1, total });
        const img = await renderPdfPage(pdf.doc, p, { dpi: 150, type: "image/jpeg", quality: 0.85 });
        const data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.readAsDataURL(img.blob);
        });
        // Fit the page inside the slide, centred.
        const scale = Math.min(w / img.width, h / img.height);
        const [iw, ih] = [img.width * scale, img.height * scale];
        slide.addImage({ data, x: (w - iw) / 2, y: (h - ih) / 2, w: iw, h: ih });
      } else {
        const lines = pages![p - 1];
        if (lines.length === 0) continue;
        const body = Math.min(...lines.map((l) => l.size));
        const [title, ...rest] = lines[0].size > body * 1.2 ? lines : [null, ...lines];
        if (title) slide.addText(title.text, { x: 0.5, y: 0.3, w: w - 1, h: 0.9, fontSize: 28, bold: true, fit: "shrink" });
        slide.addText(
          rest.map((l) => ({ text: l!.text, options: { breakLine: true } })),
          { x: 0.5, y: title ? 1.3 : 0.4, w: w - 1, h: h - (title ? 1.7 : 0.8), fontSize: 14, valign: "top", fit: "shrink" },
        );
      }
    }
    return (await ppt.write({ outputType: "blob" })) as Blob;
  };

  const run = async () => {
    setProgress({ label: "Starting…", done: 0, total: 1 });
    setNoText(false);
    try {
      const blob = target === "word" ? await toWord() : target === "excel" ? await toExcel() : await toPowerPoint();
      setResult([{ name: `${baseName(pdf.file)}.${TYPES[target].ext}`, blob }]);
      track("pdf_generated");
      toast.success("Converted.");
    } catch (error) {
      if (error instanceof NoTextError) setNoText(true);
      else toast.error(error instanceof Error ? error.message : "Conversion failed.");
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      <FileBar file={pdf.file} pages={total} onReset={reset} disabled={!!progress} />
      {result ? (
        <PdfResult files={result} onReset={() => setResult(null)} resetLabel="Change settings" />
      ) : (
        <section className="mx-auto max-w-xl space-y-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
          {target === "word" && (
            <>
              <p className="text-sm text-muted-foreground">Text is rebuilt as editable paragraphs, with larger text as headings and bullet points as lists. Images and exact layout aren&apos;t carried over.</p>
              <CheckboxField label="Start each PDF page on a new Word page" checked={pageBreaks} onChange={setPageBreaks} />
            </>
          )}
          {target === "excel" && (
            <>
              <p className="text-sm text-muted-foreground">Text is laid out in rows and columns as it appears on the page — ideal for statements, invoices and price lists. Amounts become real numbers you can add up.</p>
              <SegmentedControl label="Sheets" value={sheets} onChange={setSheets} options={[{ value: "per-page", label: "One sheet per page" }, { value: "single", label: "All in one sheet" }]} />
            </>
          )}
          {target === "powerpoint" && (
            <>
              <SegmentedControl label="Slides" value={slides} onChange={setSlides} options={[{ value: "images", label: "Exact look" }, { value: "text", label: "Editable text" }]} />
              <p className="text-sm text-muted-foreground">
                {slides === "images" ? "Each page becomes a slide that looks exactly like the PDF (as a picture)." : "Each page becomes a slide with its text in editable text boxes; the first large line becomes the title."}
              </p>
            </>
          )}
          {noText && (
            <p className="rounded-lg bg-amber-500/10 p-3 text-sm">
              No text found — this looks like a scanned PDF. Run{" "}
              <Link href="/ocr-pdf" className="font-medium text-primary underline-offset-4 hover:underline">OCR PDF</Link> first, then convert the result.
            </p>
          )}
          {progress ? (
            <ProgressBar {...progress} />
          ) : (
            <ActionButton busy={false} busyLabel="" onClick={run}>
              Convert to {target === "word" ? "Word" : target === "excel" ? "Excel" : "PowerPoint"}
            </ActionButton>
          )}
        </section>
      )}
    </div>
  );
}

function addSheet(XLSX: typeof import("xlsx"), book: import("xlsx").WorkBook, rows: (string | number)[][], name: string) {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const columns = Math.max(0, ...rows.map((r) => r.length));
  sheet["!cols"] = Array.from({ length: columns }, (_, c) => ({ wch: Math.min(60, Math.max(8, ...rows.map((r) => String(r[c] ?? "").length + 2))) }));
  XLSX.utils.book_append_sheet(book, sheet, name.slice(0, 31));
}
