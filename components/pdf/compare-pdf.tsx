"use client";

import { Fragment, useState } from "react";
import { FileText, X } from "lucide-react";
import { toast } from "sonner";
import { track } from "@/lib/analytics/client";
import { formatBytes, type AcceptedFile } from "@/lib/files/validation";
import { compareTexts, type LineChange } from "@/lib/pdf/diff";
import { openPdf } from "@/lib/pdf/pdf-render";
import { documentLines } from "@/lib/pdf/text";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/shared/form-fields";
import { FileDropzone, PrivacyNote } from "@/components/files/file-dropzone";
import { ActionButton, PDF_RULES, ProgressBar } from "./pdf-shell";

type Filter = "all" | "added" | "removed" | "changed";
const SHOWN = 500;

export function ComparePdf() {
  const [files, setFiles] = useState<[File | null, File | null]>([null, null]);
  const [changes, setChanges] = useState<LineChange[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [progress, setProgress] = useState<{ label: string; done: number; total: number } | null>(null);

  const setFile = (i: 0 | 1, file: File | null) => {
    setFiles((old) => (i === 0 ? [file, old[1]] : [old[0], file]));
    setChanges(null);
  };

  const compare = async () => {
    if (!files[0] || !files[1]) return;
    setProgress({ label: "Reading both PDFs…", done: 0, total: 2 });
    const opened = [];
    try {
      const lines: string[][] = [];
      for (let i = 0; i < 2; i++) {
        const pdf = await openPdf(files[i]!);
        opened.push(pdf);
        const pages = await documentLines(pdf.doc, (done, total) => setProgress({ label: `Reading ${i ? "new" : "original"} PDF…`, done: i + done / total, total: 2 }));
        lines.push(pages.flat().map((l) => l.text));
      }
      if (lines.every((l) => l.length === 0)) throw new Error("Neither PDF has selectable text. Scanned files need OCR PDF first.");
      setChanges(compareTexts(lines[0], lines[1]).changes.filter((c) => c.type !== "equal"));
      setFilter("all");
      track("pdf_generated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't compare these PDFs.");
    } finally {
      await Promise.all(opened.map((p) => p.destroy()));
      setProgress(null);
    }
  };

  const counts = { added: 0, removed: 0, changed: 0 };
  for (const c of changes ?? []) if (c.type !== "equal") counts[c.type]++;
  const visible = (changes ?? []).filter((c) => filter === "all" || c.type === filter);

  return (
    <div className="space-y-6">
      <PrivacyNote />
      <div className="grid gap-4 sm:grid-cols-2">
        {([0, 1] as const).map((i) => (
          <div key={i} className="space-y-2">
            <h2 className="text-sm font-semibold">{i ? "New version" : "Original"}</h2>
            {files[i] ? (
              <div className="flex items-center gap-3 rounded-lg bg-card p-3 ring-1 ring-foreground/10">
                <FileText className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{files[i]!.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(files[i]!.size)}</p>
                </div>
                <Button variant="ghost" size="icon" className="size-9" onClick={() => setFile(i, null)} aria-label={`Remove ${files[i]!.name}`} disabled={!!progress}>
                  <X />
                </Button>
              </div>
            ) : (
              <FileDropzone compact rules={PDF_RULES} onFiles={([f]: AcceptedFile[]) => setFile(i, f.file)} title={i ? "Choose the new PDF" : "Choose the original PDF"} />
            )}
          </div>
        ))}
      </div>
      <div className="max-w-xs">
        {progress ? (
          <ProgressBar {...progress} />
        ) : (
          <ActionButton busy={false} busyLabel="" disabled={!files[0] || !files[1]} onClick={compare}>
            Compare PDFs
          </ActionButton>
        )}
      </div>

      {changes && (
        <section aria-label="Differences" className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
          {changes.length === 0 ? (
            <h2 className="font-semibold">No text differences — both PDFs contain the same text.</h2>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-semibold">
                  {changes.length} difference{changes.length === 1 ? "" : "s"}
                </h2>
                <SegmentedControl
                  label="Show"
                  hideLabel
                  value={filter}
                  onChange={setFilter}
                  options={[
                    { value: "all", label: "All" },
                    { value: "added", label: `Added (${counts.added})` },
                    { value: "removed", label: `Removed (${counts.removed})` },
                    { value: "changed", label: `Changed (${counts.changed})` },
                  ]}
                />
              </div>
              <ol className="space-y-1.5">
                {visible.slice(0, SHOWN).map((change, i) => (
                  <li
                    key={i}
                    className={cn(
                      "rounded-md border-l-4 px-3 py-2 text-sm",
                      change.type === "added" ? "border-emerald-500 bg-emerald-500/10" : change.type === "removed" ? "border-red-500 bg-red-500/10" : "border-amber-500 bg-amber-500/10",
                    )}
                  >
                    {change.type === "changed" ? (
                      // Word by word: struck-through words were removed, highlighted words were added.
                      <span>
                        {change.words.map((w, j) => (
                          <Fragment key={j}>
                            {w.type === "equal" ? (
                              w.text
                            ) : w.type === "removed" ? (
                              <del className="rounded bg-red-500/20 px-0.5 text-red-800 dark:text-red-300">{w.text}</del>
                            ) : (
                              <ins className="rounded bg-emerald-500/25 px-0.5 text-emerald-800 no-underline dark:text-emerald-300">{w.text}</ins>
                            )}{" "}
                          </Fragment>
                        ))}
                      </span>
                    ) : (
                      <>
                        <span className="sr-only">{change.type === "added" ? "Added: " : "Removed: "}</span>
                        <span aria-hidden className="mr-1 font-mono font-semibold">{change.type === "added" ? "+" : "−"}</span>
                        {change.type === "removed" ? <del>{change.text}</del> : change.text}
                      </>
                    )}
                  </li>
                ))}
              </ol>
              {visible.length > SHOWN && <p className="text-sm text-muted-foreground">Showing the first {SHOWN} of {visible.length}.</p>}
            </>
          )}
        </section>
      )}
    </div>
  );
}
