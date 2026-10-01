"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Languages, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { track } from "@/lib/analytics/client";
import { downloadBlob } from "@/lib/files/download";
import { markdownToDocx } from "@/lib/pdf/docx";
import { linesToMarkdown, type TextLine } from "@/lib/pdf/markdown";
import { keywords, readingStats, summarize, type SummaryLength } from "@/lib/pdf/summarize";
import { documentLines } from "@/lib/pdf/text";
import { Button } from "@/components/ui/button";
import { CheckboxField, SegmentedControl, SelectField } from "@/components/shared/form-fields";
import { ActionButton, baseName, FileBar, PdfPicker, ProgressBar, TextOutput } from "./pdf-shell";
import { usePdf, type LoadedPdf } from "./use-pdf";

export type TextToolMode = "markdown" | "summary" | "translate";

export function PdfTextTool({ mode }: { mode: TextToolMode }) {
  const { pdf, loading, open, reset } = usePdf();
  if (!pdf) return <PdfPicker loading={loading} onFile={open} />;
  return <Extracted key={pdf.file.name + pdf.file.lastModified} pdf={pdf} reset={reset} mode={mode} />;
}

/** Read every page's text once, with progress; then hand it to the tool. */
function Extracted({ pdf, reset, mode }: { pdf: LoadedPdf; reset: () => void; mode: TextToolMode }) {
  const [pages, setPages] = useState<TextLine[][] | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: pdf.doc.numPages });

  useEffect(() => {
    let cancelled = false;
    documentLines(pdf.doc, (done, total) => !cancelled && setProgress({ done, total }))
      .then((p) => !cancelled && setPages(p))
      .catch(() => !cancelled && toast.error("Couldn't read the text in this PDF."));
    return () => {
      cancelled = true;
    };
  }, [pdf.doc]);

  const empty = pages !== null && pages.every((p) => p.length === 0);
  return (
    <div className="space-y-6">
      <FileBar file={pdf.file} pages={pdf.doc.numPages} onReset={reset} />
      {pages === null ? (
        <div className="mx-auto max-w-md">
          <ProgressBar label="Reading text…" {...progress} />
        </div>
      ) : empty ? (
        <section className="mx-auto max-w-xl space-y-2 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
          <h2 className="font-semibold">No text found in this PDF</h2>
          <p className="text-sm text-muted-foreground">
            It looks like a scanned document (pictures of pages). Run{" "}
            <Link href="/ocr-pdf" className="font-medium text-primary underline-offset-4 hover:underline">
              OCR PDF
            </Link>{" "}
            first to recognise the text, then try again with the result.
          </p>
        </section>
      ) : mode === "markdown" ? (
        <MarkdownTool pdf={pdf} pages={pages} />
      ) : mode === "summary" ? (
        <SummaryTool pdf={pdf} pages={pages} />
      ) : (
        <TranslateTool pdf={pdf} pages={pages} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------- markdown

function MarkdownTool({ pdf, pages }: { pdf: LoadedPdf; pages: TextLine[][] }) {
  const [pageBreaks, setPageBreaks] = useState(false);
  const [markdown, setMarkdown] = useState(() => linesToMarkdown(pages));
  useEffect(() => {
    track("pdf_generated");
  }, []);
  return (
    <div className="space-y-4">
      <CheckboxField
        label="Mark page breaks with a horizontal rule (---)"
        checked={pageBreaks}
        onChange={(v) => {
          setPageBreaks(v);
          setMarkdown(linesToMarkdown(pages, { pageBreaks: v }));
        }}
      />
      <TextOutput label="Markdown" text={markdown} onChange={setMarkdown} fileName={`${baseName(pdf.file)}.md`} mime="text/markdown" />
    </div>
  );
}

// ---------------------------------------------------------------- summary

interface AiSummarizer {
  summarize(text: string): Promise<string>;
  destroy?(): void;
  inputQuota?: number;
}
interface SummarizerApi {
  availability(o?: object): Promise<"available" | "downloadable" | "downloading" | "unavailable">;
  create(o: object): Promise<AiSummarizer>;
}
const summarizerApi = () => (globalThis as unknown as { Summarizer?: SummarizerApi }).Summarizer;

/** Chrome's on-device model; long documents are summarised in parts, then the parts together. */
async function aiSummary(text: string, length: SummaryLength, onStatus: (s: string) => void): Promise<string> {
  const api = summarizerApi()!;
  const summarizer = await api.create({
    type: "key-points",
    format: "plain-text",
    length,
    monitor(m: EventTarget) {
      m.addEventListener("downloadprogress", (e) => onStatus(`Downloading the on-device model… ${Math.round(((e as ProgressEvent).loaded ?? 0) * 100)}%`));
    },
  });
  try {
    const size = Math.min(12000, Math.max(2000, (summarizer.inputQuota ?? 4000) * 3));
    const chunks: string[] = [];
    for (let i = 0; i < text.length && chunks.length < 12; i += size) chunks.push(text.slice(i, i + size));
    const parts: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      onStatus(`Summarising part ${i + 1} of ${chunks.length}…`);
      parts.push(await summarizer.summarize(chunks[i]));
    }
    return parts.length === 1 ? parts[0] : summarizer.summarize(parts.join("\n"));
  } finally {
    summarizer.destroy?.();
  }
}

function SummaryTool({ pdf, pages }: { pdf: LoadedPdf; pages: TextLine[][] }) {
  const text = pages.flat().map((l) => l.text).join("\n");
  const stats = readingStats(text);
  const topics = keywords(text, 8);
  const [length, setLength] = useState<SummaryLength>("medium");
  const [engine, setEngine] = useState<"local" | "ai">("local");
  const [aiReady, setAiReady] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [output, setOutput] = useState("");

  useEffect(() => {
    summarizerApi()
      ?.availability()
      .then((a) => setAiReady(a !== "unavailable"))
      .catch(() => undefined);
  }, []);

  const run = async () => {
    setStatus("Summarising…");
    try {
      const summary =
        engine === "ai"
          ? await aiSummary(text, length, setStatus)
          : summarize(
              linesToMarkdown(pages)
                .split("\n\n")
                .filter((b) => !b.startsWith("#"))
                .join(" "),
              length,
            )
              .map((s) => `• ${s}`)
              .join("\n\n");
      if (!summary.trim()) throw new Error("There isn't enough running text in this PDF to summarise.");
      setOutput(summary.trim());
      track("pdf_generated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't summarise this PDF.");
    } finally {
      setStatus(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="mx-auto max-w-2xl space-y-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
        <p className="text-sm text-muted-foreground">
          {stats.words.toLocaleString("en-IN")} words · about {stats.minutes} min to read
          {topics.length > 0 && <> · main topics: <span className="text-foreground">{topics.join(", ")}</span></>}
        </p>
        <SegmentedControl label="Summary length" value={length} onChange={setLength} options={[{ value: "short", label: "Short" }, { value: "medium", label: "Medium" }, { value: "long", label: "Detailed" }]} />
        {aiReady && (
          <SegmentedControl
            label="Method"
            value={engine}
            onChange={setEngine}
            options={[
              { value: "local", label: "Key sentences" },
              { value: "ai", label: "On-device AI" },
            ]}
          />
        )}
        <p className="text-xs text-muted-foreground">
          {engine === "ai"
            ? "Uses the AI model built into Chrome, running on this device. The first run may download the model."
            : "Picks the sentences that best cover the document's main topics, word for word — nothing is invented. Runs instantly on this device."}
        </p>
        {status ? <p className="text-sm text-muted-foreground" role="status">{status}</p> : (
          <ActionButton busy={false} busyLabel="" onClick={run}>
            <Sparkles /> Summarise PDF
          </ActionButton>
        )}
      </section>
      {output && <TextOutput label="Summary" text={output} onChange={setOutput} fileName={`${baseName(pdf.file)}-summary.txt`} />}
    </div>
  );
}

// ---------------------------------------------------------------- translate

interface TranslatorApi {
  availability(o: { sourceLanguage: string; targetLanguage: string }): Promise<"available" | "downloadable" | "downloading" | "unavailable">;
  create(o: { sourceLanguage: string; targetLanguage: string; monitor?: (m: EventTarget) => void }): Promise<{ translate(text: string): Promise<string>; destroy?(): void }>;
}
interface DetectorApi {
  create(): Promise<{ detect(text: string): Promise<{ detectedLanguage: string; confidence: number }[]> }>;
}
const translatorApi = () => (globalThis as unknown as { Translator?: TranslatorApi }).Translator;
const detectorApi = () => (globalThis as unknown as { LanguageDetector?: DetectorApi }).LanguageDetector;

const LANGUAGES = [
  ["hi", "Hindi"], ["mr", "Marathi"], ["bn", "Bengali"], ["gu", "Gujarati"], ["ta", "Tamil"], ["te", "Telugu"], ["kn", "Kannada"],
  ["ml", "Malayalam"], ["pa", "Punjabi"], ["ur", "Urdu"], ["en", "English"], ["ar", "Arabic"], ["zh", "Chinese"], ["fr", "French"],
  ["de", "German"], ["es", "Spanish"], ["ja", "Japanese"], ["ru", "Russian"],
] as const;
type Lang = (typeof LANGUAGES)[number][0];

function TranslateTool({ pdf, pages }: { pdf: LoadedPdf; pages: TextLine[][] }) {
  const supported = !!translatorApi();
  const markdown = linesToMarkdown(pages, { pageBreaks: true });
  const [source, setSource] = useState<Lang | "auto">("auto");
  const [target, setTarget] = useState<Lang>("hi");
  const [progress, setProgress] = useState<{ label: string; done: number; total: number } | null>(null);
  const [output, setOutput] = useState("");

  const run = async () => {
    const api = translatorApi();
    if (!api) return;
    setProgress({ label: "Preparing…", done: 0, total: 1 });
    try {
      let from = source;
      if (from === "auto") {
        const detector = detectorApi();
        const detected = detector ? (await (await detector.create()).detect(markdown.slice(0, 4000)))[0] : undefined;
        from = (detected && detected.confidence > 0.5 ? detected.detectedLanguage.split("-")[0] : "en") as Lang;
      }
      if (from === target) throw new Error("The document is already in that language. Pick another one.");
      const availability = await api.availability({ sourceLanguage: from, targetLanguage: target });
      if (availability === "unavailable") throw new Error(`Your browser can't translate from ${from.toUpperCase()} to this language yet.`);
      const translator = await api.create({
        sourceLanguage: from,
        targetLanguage: target,
        monitor(m) {
          m.addEventListener("downloadprogress", (e) => setProgress({ label: "Downloading the language pack…", done: (e as ProgressEvent).loaded ?? 0, total: 1 }));
        },
      });
      // Translate block by block so headings, lists and page breaks keep their shape.
      const blocks = markdown.split(/\n{2,}/);
      const out: string[] = [];
      for (let i = 0; i < blocks.length; i++) {
        setProgress({ label: "Translating…", done: i, total: blocks.length });
        const block = blocks[i];
        const prefix = /^(#{1,6} |- |\d+\. |---$)/.exec(block)?.[0] ?? "";
        const body = block.slice(prefix.length);
        out.push(prefix + (body.trim() ? await translator.translate(body) : body));
      }
      translator.destroy?.();
      setOutput(out.join("\n\n"));
      track("pdf_generated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't translate this PDF.");
    } finally {
      setProgress(null);
    }
  };

  const languageName = LANGUAGES.find(([c]) => c === target)?.[1] ?? target;
  return (
    <div className="space-y-6">
      <section className="mx-auto max-w-xl space-y-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
        {!supported ? (
          <>
            <h2 className="flex items-center gap-2 font-semibold">
              <Languages className="size-5" /> Translation isn&apos;t available in this browser
            </h2>
            <p className="text-sm text-muted-foreground">
              Translation runs privately on your device using the translator built into Google Chrome (version 138 or newer, on a computer). Open this page in desktop Chrome to translate — or download the text as a Word file and translate it with the tool of your choice.
            </p>
            <Button variant="outline" className="h-11" onClick={async () => downloadBlob(await markdownToDocx(markdown, { title: baseName(pdf.file) }), `${baseName(pdf.file)}.docx`)}>
              <FileText /> Download text as Word
            </Button>
          </>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField<Lang | "auto"> label="From" value={source} onChange={setSource} options={[{ value: "auto", label: "Detect automatically" }, ...LANGUAGES.map(([value, label]) => ({ value, label }))]} />
              <SelectField<Lang> label="To" value={target} onChange={setTarget} options={LANGUAGES.map(([value, label]) => ({ value, label }))} />
            </div>
            <p className="text-xs text-muted-foreground">Translated on your device by Chrome&apos;s built-in translator. The first use of a language downloads its language pack.</p>
            {progress ? <ProgressBar {...progress} /> : (
              <ActionButton busy={false} busyLabel="" onClick={run}>
                <Languages /> Translate to {languageName}
              </ActionButton>
            )}
          </>
        )}
      </section>
      {output && (
        <TextOutput
          label={`Translation (${languageName})`}
          text={output}
          onChange={setOutput}
          fileName={`${baseName(pdf.file)}-${target}.txt`}
          extra={
            <Button variant="outline" className="h-10 px-3.5" onClick={async () => downloadBlob(await markdownToDocx(output, { title: baseName(pdf.file) }), `${baseName(pdf.file)}-${target}.docx`)}>
              <FileText /> Word
            </Button>
          }
        />
      )}
    </div>
  );
}
