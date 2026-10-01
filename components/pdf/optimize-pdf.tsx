"use client";

import { useState } from "react";
import { toast } from "sonner";
import { track } from "@/lib/analytics/client";
import { formatBytes, type AcceptedFile } from "@/lib/files/validation";
import { canvasCodec, renderPageImages } from "@/lib/pdf/browser";
import { pdfA, pdfCompress, pdfEdit } from "@/lib/pdf/lazy";
import { openPdf } from "@/lib/pdf/pdf-render";
import { SegmentedControl, TextField } from "@/components/shared/form-fields";
import { FileDropzone, PrivacyNote } from "@/components/files/file-dropzone";
import { ActionButton, baseName, FileBar, pdfBlob, PDF_RULES, PdfPicker, PdfResult, ProgressBar, type OutputFile } from "./pdf-shell";
import { usePdf, type LoadedPdf } from "./use-pdf";

type Progress = { label: string; done: number; total: number } | null;

function Panel({ children }: { children: React.ReactNode }) {
  return <section className="mx-auto max-w-xl space-y-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">{children}</section>;
}

// ---------------------------------------------------------------- compress

const LEVELS = {
  light: { label: "Light", maxSide: 2400, quality: 0.82, hint: "Smaller file, no visible change. Text stays sharp and selectable." },
  recommended: { label: "Recommended", maxSide: 1600, quality: 0.7, hint: "Good balance for email and uploads. Text stays sharp and selectable." },
  strong: { label: "Strong", maxSide: 1100, quality: 0.55, hint: "Much smaller photos, some softness. Text stays sharp and selectable." },
  maximum: { label: "Maximum", maxSide: 0, quality: 0.6, hint: "Every page becomes a compressed image — the smallest file, but text can no longer be selected or searched." },
} as const;
type Level = keyof typeof LEVELS;

export function CompressPdf() {
  const { pdf, loading, open, reset } = usePdf();
  if (!pdf) return <PdfPicker loading={loading} onFile={open} />;
  return <Compressor key={pdf.file.name + pdf.file.lastModified} pdf={pdf} reset={reset} />;
}

function Compressor({ pdf, reset }: { pdf: LoadedPdf; reset: () => void }) {
  const [level, setLevel] = useState<Level>("recommended");
  const [progress, setProgress] = useState<Progress>(null);
  const [result, setResult] = useState<{ files: OutputFile[]; note: string } | null>(null);

  const run = async () => {
    setProgress({ label: "Starting…", done: 0, total: 1 });
    try {
      let bytes: Uint8Array;
      let note: string;
      if (level === "maximum") {
        const pages = Array.from({ length: pdf.doc.numPages }, (_, i) => i + 1);
        const images = await renderPageImages(pdf.doc, pages, { dpi: 110, quality: LEVELS.maximum.quality, onProgress: (done, total) => setProgress({ label: "Rendering pages…", done, total }) });
        bytes = await (await pdfEdit()).replacePagesWithImages(pdf.bytes, images);
        note = "Pages were converted to images.";
      } else {
        const { maxSide, quality } = LEVELS[level];
        const out = await (await pdfCompress()).compressPdfImages(pdf.bytes, { maxSide, quality, codec: canvasCodec, onProgress: (done, total) => setProgress({ label: "Compressing images…", done, total }) });
        bytes = out.bytes;
        note = out.images === 0 ? "This PDF has no photos to shrink; its structure was optimised." : `${out.recompressed} of ${out.images} image${out.images === 1 ? "" : "s"} were made smaller.`;
      }
      if (bytes.length >= pdf.file.size) {
        toast.info("This PDF is already well compressed — no smaller version could be made at this level.");
        if (level !== "maximum") note += " Try a stronger level for a bigger reduction.";
        bytes = pdf.bytes;
      }
      setResult({ files: [{ name: `${baseName(pdf.file)}-compressed.pdf`, blob: pdfBlob(bytes) }], note });
      track("pdf_generated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't compress this PDF.");
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      <FileBar file={pdf.file} pages={pdf.doc.numPages} onReset={reset} disabled={!!progress} />
      {result ? (
        <PdfResult files={result.files} before={pdf.file.size} note={result.note} onReset={() => setResult(null)} resetLabel="Try another level" />
      ) : (
        <Panel>
          <SegmentedControl label="Compression" value={level} onChange={setLevel} options={Object.entries(LEVELS).map(([value, l]) => ({ value: value as Level, label: l.label }))} />
          <p className="text-sm text-muted-foreground">{LEVELS[level].hint}</p>
          {progress ? <ProgressBar {...progress} /> : <ActionButton busy={false} busyLabel="" onClick={run}>Compress PDF</ActionButton>}
        </Panel>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- repair

/** Repair needs its own picker: a damaged file may not open for a preview at all. */
export function RepairPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<Progress>(null);
  const [result, setResult] = useState<{ files: OutputFile[]; note: string } | null>(null);

  const repair = async (f: File) => {
    setFile(f);
    setResult(null);
    setProgress({ label: "Reading the file…", done: 0, total: 1 });
    const bytes = new Uint8Array(await f.arrayBuffer());
    const name = `${f.name.replace(/\.pdf$/i, "") || "document"}-repaired.pdf`;
    try {
      // 1. Rebuild the file structure, keeping everything (text, links, forms).
      try {
        const rebuilt = await (await pdfEdit()).resavePdf(bytes);
        const check = await openPdf(new Blob([rebuilt.slice().buffer as ArrayBuffer]));
        const pages = check.doc.numPages;
        await check.destroy();
        if (pages > 0) {
          setResult({ files: [{ name, blob: pdfBlob(rebuilt) }], note: `Rebuilt the document structure (${pages} page${pages === 1 ? "" : "s"}). Text, links and forms are kept.` });
          track("pdf_generated");
          return;
        }
      } catch {
        // fall through to the page-by-page rescue
      }
      // 2. pdf.js can read many files other tools reject: rescue each page as an image.
      const opened = await openPdf(f);
      try {
        const pages = Array.from({ length: opened.doc.numPages }, (_, i) => i + 1);
        const images = await renderPageImages(opened.doc, pages, { dpi: 170, quality: 0.85, onProgress: (done, total) => setProgress({ label: "Rescuing pages…", done, total }) });
        const { PDFDocument } = await import("@cantoo/pdf-lib");
        const out = await PDFDocument.create();
        for (const p of pages) {
          const img = images.get(p)!;
          const page = out.addPage([img.width, img.height]);
          page.drawImage(await out.embedJpg(img.jpeg), { x: 0, y: 0, width: img.width, height: img.height });
        }
        setResult({ files: [{ name, blob: pdfBlob(await out.save()) }], note: `The structure was too damaged to rebuild, so ${pages.length} page${pages.length === 1 ? " was" : "s were"} rescued as images. Text in the result isn't selectable.` });
        track("pdf_generated");
      } finally {
        await opened.destroy();
      }
    } catch {
      toast.error("This file is too damaged to repair, or isn't a PDF.");
      setFile(null);
    } finally {
      setProgress(null);
    }
  };

  if (result && file) return <PdfResult files={result.files} before={file.size} note={result.note} onReset={() => { setResult(null); setFile(null); }} resetLabel="Repair another PDF" />;
  return (
    <div className="space-y-6">
      <PrivacyNote />
      {progress ? (
        <Panel>
          <p className="truncate text-sm font-medium">{file?.name}</p>
          <ProgressBar {...progress} />
        </Panel>
      ) : (
        <FileDropzone rules={PDF_RULES} onFiles={([f]: AcceptedFile[]) => repair(f.file)} title="Choose a damaged PDF" />
      )}
    </div>
  );
}

// ---------------------------------------------------------------- PDF/A

export function PdfToPdfA() {
  const { pdf, loading, open, reset } = usePdf();
  if (!pdf) return <PdfPicker loading={loading} onFile={open} />;
  return <Archiver key={pdf.file.name + pdf.file.lastModified} pdf={pdf} reset={reset} />;
}

function Archiver({ pdf, reset }: { pdf: LoadedPdf; reset: () => void }) {
  const [title, setTitle] = useState(baseName(pdf.file));
  const [method, setMethod] = useState<"auto" | "images">("auto");
  const [progress, setProgress] = useState<Progress>(null);
  const [result, setResult] = useState<{ files: OutputFile[]; note: string } | null>(null);

  const run = async () => {
    setProgress({ label: "Checking fonts…", done: 0, total: 1 });
    try {
      const pages = Array.from({ length: pdf.doc.numPages }, (_, i) => i + 1);
      const out = await (await pdfA()).convertToPdfA(pdf.bytes, {
        title: title.trim() || baseName(pdf.file),
        forceImages: method === "images",
        renderPages: () => renderPageImages(pdf.doc, pages, { dpi: 200, quality: 0.85, onProgress: (done, total) => setProgress({ label: "Rebuilding pages…", done, total }) }),
      });
      const note = !out.rasterized
        ? "All fonts are embedded, so text stays selectable. Saved as PDF/A-2b."
        : out.missingFonts.length
          ? `Saved as PDF/A-2b. The original relied on fonts it didn't include (${out.missingFonts.slice(0, 3).join(", ")}${out.missingFonts.length > 3 ? "…" : ""}), so pages were rebuilt as images to look the same everywhere.`
          : "Saved as PDF/A-2b with pages rebuilt as images.";
      setResult({ files: [{ name: `${baseName(pdf.file)}-pdfa.pdf`, blob: pdfBlob(out.bytes) }], note });
      track("pdf_generated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't convert this PDF.");
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      <FileBar file={pdf.file} pages={pdf.doc.numPages} onReset={reset} disabled={!!progress} />
      {result ? (
        <PdfResult files={result.files} note={result.note} onReset={() => setResult(null)} resetLabel="Convert again" />
      ) : (
        <Panel>
          <TextField label="Document title" value={title} onChange={setTitle} hint="Stored in the file's archival metadata." />
          <SegmentedControl
            label="Method"
            value={method}
            onChange={setMethod}
            options={[
              { value: "auto", label: "Keep text (automatic)" },
              { value: "images", label: "Pages as images" },
            ]}
          />
          <p className="text-sm text-muted-foreground">
            {method === "auto"
              ? "Keeps text selectable when the PDF includes its fonts; otherwise pages are rebuilt as images automatically."
              : "Every page becomes an image — the most reliable way to pass strict portal checks. Text won't be selectable."}
          </p>
          {progress ? <ProgressBar {...progress} /> : <ActionButton busy={false} busyLabel="" onClick={run}>Convert to PDF/A</ActionButton>}
          <p className="text-xs text-muted-foreground">Size: {formatBytes(pdf.file.size)}. Adds sRGB colour profile, XMP metadata and file ID; removes scripts, attachments and other content PDF/A doesn&apos;t allow.</p>
        </Panel>
      )}
    </div>
  );
}
