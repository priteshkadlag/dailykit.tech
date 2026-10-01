"use client";

import { useState } from "react";
import { toast } from "sonner";
import { track } from "@/lib/analytics/client";
import { DOCX_MIME, PPTX_MIME, XLSX_MIME, type AcceptedFile, type SupportedMime } from "@/lib/files/validation";
import { flowToPdf, pagesToPdf, type PageSizeName } from "@/lib/pdf/dom-to-pdf";
import { buildDocument, DOC_CSS, prepareHtml, SHEET_CSS } from "@/lib/pdf/html-content";
import { readPptx } from "@/lib/pdf/pptx";
import { CheckboxField, SegmentedControl, SelectField, TextAreaField } from "@/components/shared/form-fields";
import { FileDropzone, PrivacyNote } from "@/components/files/file-dropzone";
import { ActionButton, FileBar, PdfResult, ProgressBar, type OutputFile } from "./pdf-shell";

export type OfficeSource = "word" | "excel" | "powerpoint" | "html";

const SOURCES: Record<OfficeSource, { accept: SupportedMime[]; title: string; maxMb: number }> = {
  word: { accept: [DOCX_MIME], title: "Choose a Word document (.docx)", maxMb: 50 },
  excel: { accept: [XLSX_MIME, "application/vnd.ms-excel", "text/csv"], title: "Choose a spreadsheet (.xlsx, .xls, .csv)", maxMb: 30 },
  powerpoint: { accept: [PPTX_MIME], title: "Choose a presentation (.pptx)", maxMb: 100 },
  html: { accept: ["text/html"], title: "Choose an HTML file", maxMb: 10 },
};

const MARGINS = { narrow: 24, normal: 40, wide: 64 } as const;
type Margin = keyof typeof MARGINS;

const outputName = (name: string) => `${name.replace(/\.[^.]+$/, "") || "document"}.pdf`;

export function OfficeToPdf({ source }: { source: OfficeSource }) {
  const [file, setFile] = useState<File | null>(null);
  const [pasted, setPasted] = useState("");
  const [htmlInput, setHtmlInput] = useState<"paste" | "file">("paste");
  const [size, setSize] = useState<PageSizeName>("a4");
  const [orientation, setOrientation] = useState<"auto" | "portrait" | "landscape">(source === "excel" ? "auto" : "portrait");
  const [margin, setMargin] = useState<Margin>("normal");
  const [fit, setFit] = useState(true);
  const [progress, setProgress] = useState<{ label: string; done: number; total: number } | null>(null);
  const [result, setResult] = useState<OutputFile[] | null>(null);

  const config = SOURCES[source];
  const pasting = source === "html" && htmlInput === "paste";
  const ready = pasting ? pasted.trim().length > 0 : !!file;
  const onProgress = (done: number, total: number) => setProgress({ label: "Creating pages…", done, total });

  const convertWord = async (f: File) => {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.convertToHtml({ arrayBuffer: await f.arrayBuffer() });
    if (!value.trim()) throw new Error("This document looks empty.");
    const { root } = buildDocument(value, { base: DOC_CSS });
    return flowToPdf(root, { size, landscape: orientation === "landscape", marginPt: MARGINS[margin], onProgress });
  };

  const convertExcel = async (f: File) => {
    const XLSX = await import("xlsx");
    const book = /\.csv$/i.test(f.name) ? XLSX.read(await f.text(), { type: "string" }) : XLSX.read(await f.arrayBuffer(), { type: "array" });
    const sections: string[] = [];
    let widest = 0;
    for (const name of book.SheetNames) {
      const sheet = book.Sheets[name];
      if (!sheet["!ref"]) continue;
      widest = Math.max(widest, XLSX.utils.decode_range(sheet["!ref"]).e.c + 1);
      const table = new DOMParser().parseFromString(XLSX.utils.sheet_to_html(sheet), "text/html").querySelector("table");
      if (!table) continue;
      const heading = book.SheetNames.length > 1 ? `<h2>${name.replace(/[<>&]/g, "")}</h2>` : "";
      sections.push(`<section>${heading}${table.outerHTML}</section>`);
    }
    if (sections.length === 0) throw new Error("This spreadsheet has no data.");
    const landscape = orientation === "landscape" || (orientation === "auto" && widest > 7);
    const { root } = buildDocument(sections.join(""), { base: SHEET_CSS });
    return flowToPdf(root, {
      size,
      landscape,
      marginPt: MARGINS[margin],
      onProgress,
      // Shrink tables wider than the page so no columns are cut off.
      prepare: (node) => {
        if (!fit) return;
        for (const table of node.querySelectorAll("table")) {
          if (table.scrollWidth > node.clientWidth) table.style.zoom = String(node.clientWidth / table.scrollWidth);
        }
      },
    });
  };

  const convertPowerPoint = async (f: File) => {
    setProgress({ label: "Reading slides…", done: 0, total: 1 });
    const deck = await readPptx(new Uint8Array(await f.arrayBuffer()));
    try {
      if (deck.count === 0) throw new Error("This presentation has no visible slides.");
      return await pagesToPdf(deck.root, deck.widthPx, deck.heightPx, (done, total) => setProgress({ label: "Creating slides…", done, total }));
    } finally {
      deck.urls.forEach((u) => URL.revokeObjectURL(u));
    }
  };

  const convertHtml = async (html: string) => {
    const prepared = prepareHtml(html, "__SCOPE__");
    if (!prepared.body.trim()) throw new Error("There's no content to convert.");
    const { root } = buildDocument(prepared.body, { css: prepared.css });
    return flowToPdf(root, { size, landscape: orientation === "landscape", marginPt: MARGINS[margin], onProgress });
  };

  const run = async () => {
    setProgress({ label: "Preparing…", done: 0, total: 1 });
    try {
      let blob: Blob;
      if (source === "html") blob = await convertHtml(pasting ? pasted : await file!.text());
      else if (source === "word") blob = await convertWord(file!);
      else if (source === "excel") blob = await convertExcel(file!);
      else blob = await convertPowerPoint(file!);
      setResult([{ name: pasting ? "web-page.pdf" : outputName(file!.name), blob }]);
      track("pdf_generated");
      toast.success("Your PDF is ready.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't convert this file. It may be damaged or password-protected.");
    } finally {
      setProgress(null);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
  };

  if (result) return <PdfResult files={result} onReset={() => setResult(null)} resetLabel="Change settings" />;

  const pick = ([f]: AcceptedFile[]) => {
    setFile(f.file);
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <PrivacyNote />
      {source === "html" && (
        <SegmentedControl label="Source" hideLabel value={htmlInput} onChange={setHtmlInput} options={[{ value: "paste", label: "Paste HTML" }, { value: "file", label: "Upload .html file" }]} />
      )}
      {pasting ? (
        <TextAreaField label="HTML code" value={pasted} onChange={setPasted} rows={12} placeholder="<h1>Hello</h1><p>Paste a full page or a fragment…</p>" hint="Scripts are removed and nothing is loaded from the internet — only images embedded as data: URLs are shown." />
      ) : file ? (
        <FileBar file={file} onReset={reset} disabled={!!progress} />
      ) : (
        <FileDropzone rules={{ accept: config.accept, maxBytes: config.maxMb * 1024 * 1024, maxCount: 1 }} onFiles={pick} title={config.title} />
      )}
      {source === "word" && !file && <p className="text-sm text-muted-foreground">Have an old .doc file? Open it in Word or Google Docs and save it as .docx first.</p>}
      {source === "powerpoint" && !file && <p className="text-sm text-muted-foreground">Old .ppt files need to be saved as .pptx first. Charts and SmartArt aren&apos;t drawn; text, pictures, shapes and tables are.</p>}
      {source === "html" && htmlInput === "file" && !file && <p className="text-sm text-muted-foreground">To convert a live web page: open it, press Ctrl+S (Save page as → &quot;Webpage, Single File&quot; works best) and upload the file here.</p>}

      {ready && (
        <section className="max-w-xl space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
          {source !== "powerpoint" ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField<PageSizeName> label="Page size" value={size} onChange={setSize} options={[{ value: "a4", label: "A4" }, { value: "letter", label: "US Letter" }]} />
                <SelectField<Margin> label="Margins" value={margin} onChange={setMargin} options={[{ value: "narrow", label: "Narrow" }, { value: "normal", label: "Normal" }, { value: "wide", label: "Wide" }]} />
              </div>
              <SegmentedControl
                label="Orientation"
                value={orientation}
                onChange={setOrientation}
                options={[
                  ...(source === "excel" ? [{ value: "auto" as const, label: "Automatic" }] : []),
                  { value: "portrait", label: "Portrait" },
                  { value: "landscape", label: "Landscape" },
                ]}
              />
              {source === "excel" && <CheckboxField label="Shrink wide sheets to fit the page" checked={fit} onChange={setFit} />}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Each slide becomes one page at the presentation&apos;s own size.</p>
          )}
          {progress ? (
            <ProgressBar {...progress} />
          ) : (
            <ActionButton busy={false} busyLabel="" onClick={run}>
              Convert to PDF
            </ActionButton>
          )}
        </section>
      )}
    </div>
  );
}
