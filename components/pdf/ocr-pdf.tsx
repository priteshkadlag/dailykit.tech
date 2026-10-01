"use client";

import { useState } from "react";
import { ScanText } from "lucide-react";
import { toast } from "sonner";
import { track } from "@/lib/analytics/client";
import { addTextLayer, type TextLayerWord } from "@/lib/pdf/edit";
import { renderPageCanvas } from "@/lib/pdf/pdf-render";
import { pageFragments } from "@/lib/pdf/text";
import { CheckboxField, SelectField } from "@/components/shared/form-fields";
import { ActionButton, baseName, FileBar, pdfBlob, PdfPicker, PdfResult, PageRangeField, ProgressBar, TextOutput, usePageRange, type OutputFile } from "./pdf-shell";
import { usePdf, type LoadedPdf } from "./use-pdf";

const LANGUAGES = [
  { value: "eng", label: "English" },
  { value: "eng+hin", label: "Hindi + English" },
  { value: "eng+mar", label: "Marathi + English" },
  { value: "eng+ben", label: "Bengali + English" },
  { value: "eng+guj", label: "Gujarati + English" },
  { value: "eng+tam", label: "Tamil + English" },
  { value: "eng+tel", label: "Telugu + English" },
  { value: "eng+kan", label: "Kannada + English" },
  { value: "eng+mal", label: "Malayalam + English" },
  { value: "eng+pan", label: "Punjabi + English" },
] as const;
type Language = (typeof LANGUAGES)[number]["value"];

/** Scan resolution: 200 dpi is Tesseract's sweet spot for accuracy vs speed. */
const DPI = 200;

export function OcrPdf() {
  const { pdf, loading, open, reset } = usePdf();
  if (!pdf) return <PdfPicker loading={loading} onFile={open} title="Choose a scanned PDF" />;
  return <Ocr key={pdf.file.name + pdf.file.lastModified} pdf={pdf} reset={reset} />;
}

function Ocr({ pdf, reset }: { pdf: LoadedPdf; reset: () => void }) {
  const total = pdf.doc.numPages;
  const [language, setLanguage] = useState<Language>("eng");
  const [skipText, setSkipText] = useState(true);
  const range = usePageRange(total);
  const [progress, setProgress] = useState<{ label: string; done: number; total: number } | null>(null);
  const [result, setResult] = useState<{ files: OutputFile[]; note: string } | null>(null);
  const [text, setText] = useState("");

  const run = async () => {
    setProgress({ label: "Loading the text recogniser…", done: 0, total: 1 });
    const { createWorker } = await import("tesseract.js");
    let current = { index: 0, count: 1 };
    const worker = await createWorker(language, 1, {
      logger: (m) => {
        if (m.status === "recognizing text") setProgress({ label: `Recognising page ${current.index + 1} of ${current.count}…`, done: current.index + m.progress, total: current.count });
        else if (/load|download|initiali/i.test(m.status)) setProgress({ label: "Downloading language data (first time only)…", done: m.progress, total: 1 });
      },
    }).catch(() => null);
    if (!worker) {
      toast.error("Couldn't load the text recogniser. Check your internet connection and try again.");
      setProgress(null);
      return;
    }
    try {
      const pages: number[] = [];
      let skipped = 0;
      for (const p of range.pages) {
        if (skipText && (await pageFragments(pdf.doc, p)).length > 3) skipped++;
        else pages.push(p);
      }
      if (pages.length === 0) {
        toast.info("Every selected page already has selectable text — there's nothing to recognise.");
        return;
      }
      const layers: { page: number; words: TextLayerWord[] }[] = [];
      const texts: string[] = [];
      for (let i = 0; i < pages.length; i++) {
        current = { index: i, count: pages.length };
        setProgress({ label: `Recognising page ${i + 1} of ${pages.length}…`, done: i, total: pages.length });
        const { canvas, width } = await renderPageCanvas(pdf.doc, pages[i], DPI);
        const scale = width / canvas.width; // canvas pixels → points
        const { data } = await worker.recognize(canvas, {}, { blocks: true, text: true });
        canvas.width = canvas.height = 0;
        const words: TextLayerWord[] = [];
        for (const block of data.blocks ?? [])
          for (const para of block.paragraphs)
            for (const line of para.lines)
              for (const w of line.words) {
                if (w.confidence < 30 || !w.text.trim()) continue;
                words.push({ text: w.text, x: w.bbox.x0 * scale, y: w.bbox.y0 * scale, width: (w.bbox.x1 - w.bbox.x0) * scale, height: (w.bbox.y1 - w.bbox.y0) * scale });
              }
        layers.push({ page: pages[i], words });
        texts.push(`--- Page ${pages[i]} ---\n${data.text.trim()}`);
      }
      const out = await addTextLayer(pdf.bytes, layers);
      const recognised = layers.reduce((n, l) => n + l.words.length, 0);
      setText(texts.join("\n\n"));
      setResult({
        files: [{ name: `${baseName(pdf.file)}-searchable.pdf`, blob: pdfBlob(out.bytes) }],
        note:
          `Recognised ${recognised.toLocaleString("en-IN")} words on ${pages.length} page${pages.length === 1 ? "" : "s"}${skipped ? ` (${skipped} page${skipped === 1 ? "" : "s"} already had text)` : ""}.` +
          (out.words < recognised ? " Words in Indian scripts are in the text below; the PDF's search layer holds the English/Latin words." : ""),
      });
      track("pdf_generated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Text recognition failed.");
    } finally {
      await worker.terminate();
      setProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      <FileBar file={pdf.file} pages={total} onReset={reset} disabled={!!progress} />
      {result ? (
        <>
          <PdfResult files={result.files} note={result.note} onReset={() => { setResult(null); setText(""); }} resetLabel="Change settings" />
          {text && <TextOutput label="Recognised text" text={text} onChange={setText} fileName={`${baseName(pdf.file)}-ocr.txt`} />}
        </>
      ) : (
        <section className="mx-auto max-w-xl space-y-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
          <SelectField<Language> label="Document language" value={language} onChange={setLanguage} options={LANGUAGES} />
          <PageRangeField range={range} total={total} />
          <CheckboxField label="Skip pages that already have text" checked={skipText} onChange={setSkipText} />
          <p className="text-xs text-muted-foreground">
            Your PDF never leaves this device. The recogniser and its language data (a few MB, downloaded once from a public CDN) run in your browser. The pages look exactly the same — an invisible text layer is added so you can search, select and copy.
          </p>
          {progress ? (
            <ProgressBar {...progress} />
          ) : (
            <ActionButton busy={false} busyLabel="" disabled={!!range.error} onClick={run}>
              <ScanText /> Make PDF searchable
            </ActionButton>
          )}
        </section>
      )}
    </div>
  );
}
