"use client";

import { useState } from "react";
import { Split } from "lucide-react";
import { toast } from "sonner";
import { track } from "@/lib/analytics/client";
import { chunkPages } from "@/lib/pdf/edit-helpers";
import { pdfEdit } from "@/lib/pdf/lazy";
import { parsePageRange } from "@/lib/pdf/page-range";
import { NumberField, SegmentedControl, TextField } from "@/components/shared/form-fields";
import { ActionButton, baseName, FileBar, PageTile, pageGridClass, pdfBlob, PdfLayout, PdfPicker, PdfResult, type OutputFile } from "./pdf-shell";
import { usePdf, useThumbnails } from "./use-pdf";

type Mode = "ranges" | "every" | "each";

/** "1-3, 4-6, 9" → [[1,2,3],[4,5,6],[9]] — each comma-separated part becomes one file. */
export function parseRangeGroups(input: string, total: number): { groups: number[][]; error?: string } {
  const parts = input.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return { groups: [], error: "Enter at least one range, e.g. 1-3, 4-6" };
  const groups: number[][] = [];
  for (const part of parts) {
    const { pages, error } = parsePageRange(part, total);
    if (error) return { groups: [], error };
    groups.push(pages);
  }
  return { groups };
}

export function SplitPdf() {
  const { pdf, loading, open, reset } = usePdf();
  const thumbs = useThumbnails(pdf?.doc);
  const [mode, setMode] = useState<Mode>("ranges");
  const [ranges, setRanges] = useState("");
  const [every, setEvery] = useState("2");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OutputFile[] | null>(null);

  if (!pdf) return <PdfPicker loading={loading} onFile={open} />;
  const total = pdf.doc.numPages;
  const n = Math.floor(Number(every));

  const plan: { groups: number[][]; error?: string } =
    mode === "each"
      ? { groups: chunkPages(total, 1) }
      : mode === "every"
        ? Number.isFinite(n) && n >= 1 && n <= total
          ? { groups: chunkPages(total, n) }
          : { groups: [], error: `Enter a number from 1 to ${total}` }
        : parseRangeGroups(ranges, total);

  const start = () => {
    setResult(null);
    reset();
  };

  const split = async () => {
    if (plan.error) return;
    setBusy(true);
    try {
      const parts = await (await pdfEdit()).splitPdf(pdf.bytes, plan.groups);
      const name = baseName(pdf.file);
      setResult(
        parts.map((bytes, i) => {
          const g = plan.groups[i];
          const label = g.length === 1 ? `page-${g[0]}` : `pages-${g[0]}-${g[g.length - 1]}`;
          return { name: `${name}-${label}.pdf`, blob: pdfBlob(bytes) };
        }),
      );
      toast.success(`Split into ${parts.length} file${parts.length === 1 ? "" : "s"}.`);
      track("pdf_generated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't split this PDF.");
    } finally {
      setBusy(false);
    }
  };

  // Colour each output file's pages so the split is visible on the thumbnails.
  const fileOf = new Map<number, number>();
  plan.groups.forEach((g, i) => g.forEach((p) => fileOf.has(p) || fileOf.set(p, i)));

  return (
    <div className="space-y-6">
      <FileBar file={pdf.file} pages={total} onReset={start} disabled={busy} />
      {result && <PdfResult files={result} onReset={() => setResult(null)} resetLabel="Split differently" />}
      <PdfLayout
        main={
          <ol className={pageGridClass}>
            {Array.from({ length: Math.min(total, 200) }, (_, i) => i + 1).map((p) => (
              <PageTile
                key={p}
                page={p}
                src={thumbs[p]}
                dimmed={!fileOf.has(p)}
                badge={fileOf.has(p) ? <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">File {fileOf.get(p)! + 1}</span> : undefined}
              />
            ))}
          </ol>
        }
        aside={
          <>
            <h2 className="text-base font-semibold">How to split</h2>
            <SegmentedControl
              label="Split"
              hideLabel
              value={mode}
              onChange={(v) => {
                setMode(v);
                setResult(null);
              }}
              options={[
                { value: "ranges", label: "By ranges" },
                { value: "every", label: "Every N" },
                { value: "each", label: "Each page" },
              ]}
            />
            {mode === "ranges" && (
              <TextField
                label="Page ranges"
                value={ranges}
                onChange={(v) => {
                  setRanges(v);
                  setResult(null);
                }}
                placeholder="e.g. 1-3, 4-6, 7"
                error={ranges ? plan.error : undefined}
                hint="Each comma-separated range becomes its own PDF."
              />
            )}
            {mode === "every" && (
              <NumberField label="Pages per file" value={every} onChange={(v) => { setEvery(v); setResult(null); }} error={plan.error} />
            )}
            {mode === "each" && <p className="text-sm text-muted-foreground">Every page becomes a separate PDF ({total} files, downloaded as a ZIP).</p>}
            <ActionButton busy={busy} busyLabel="Splitting…" disabled={!!plan.error || plan.groups.length === 0} onClick={split}>
              <Split /> Split into {plan.error ? "…" : plan.groups.length} file{plan.groups.length === 1 ? "" : "s"}
            </ActionButton>
          </>
        }
      />
    </div>
  );
}
