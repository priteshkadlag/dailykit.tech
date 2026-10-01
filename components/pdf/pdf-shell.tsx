"use client";

import { useState } from "react";
import { CheckCircle2, Download, FileArchive, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { downloadBlob, zipBlobs } from "@/lib/files/download";
import { formatBytes, withExtension, type AcceptedFile, type FileRules } from "@/lib/files/validation";
import { parsePageRange } from "@/lib/pdf/page-range";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/shared/result-actions";
import { TextField } from "@/components/shared/form-fields";
import { FileDropzone, PrivacyNote } from "@/components/files/file-dropzone";

export const PDF_RULES: FileRules = { accept: ["application/pdf"], maxBytes: 100 * 1024 * 1024, maxCount: 1 };

/** Bytes → a Blob typed as PDF. */
export const pdfBlob = (bytes: Uint8Array) => new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });

export const baseName = (file: File) => file.name.replace(/\.pdf$/i, "") || "document";

/** First screen of every single-PDF tool: privacy note and the drop zone (or a spinner while opening). */
export function PdfPicker({ loading, onFile, title = "Choose a PDF" }: { loading: boolean; onFile: (file: File) => void; title?: string }) {
  return (
    <div className="space-y-6">
      <PrivacyNote />
      {loading ? (
        <div className="flex min-h-56 items-center justify-center gap-2 rounded-xl bg-card text-muted-foreground ring-1 ring-foreground/10">
          <Loader2 className="size-5 animate-spin" /> Opening PDF…
        </div>
      ) : (
        <FileDropzone rules={PDF_RULES} onFiles={([f]: AcceptedFile[]) => onFile(f.file)} title={title} />
      )}
    </div>
  );
}

/** "file.pdf · 12 pages · 2.1 MB   [Choose another PDF]" */
export function FileBar({ file, pages, onReset, disabled }: { file: File; pages?: number; onReset: () => void; disabled?: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="min-w-0 truncate text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{file.name}</span>
        {pages !== undefined && ` · ${pages} page${pages === 1 ? "" : "s"}`} · {formatBytes(file.size)}
      </p>
      <Button variant="ghost" className="h-9" onClick={onReset} disabled={disabled}>
        <RotateCcw /> Choose another PDF
      </Button>
    </div>
  );
}

/** Two-column tool layout: the pages on the left, settings on the right (stacked on phones). */
export function PdfLayout({ main, aside }: { main: React.ReactNode; aside: React.ReactNode }) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section aria-label="Pages" className="min-w-0 space-y-4">
        {main}
      </section>
      <aside aria-label="Settings" className="space-y-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10 lg:sticky lg:top-32">
        {aside}
      </aside>
    </div>
  );
}

/** Primary action with a busy state. */
export function ActionButton({ busy, busyLabel, disabled, onClick, children }: { busy: boolean; busyLabel: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Button className="h-11 w-full text-base" onClick={onClick} disabled={busy || disabled}>
      {busy ? (
        <>
          <Loader2 className="animate-spin" /> {busyLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

export interface OutputFile {
  name: string;
  blob: Blob;
}

/** The finished file(s): sizes, download, ZIP for several, and a way to start again. */
export function PdfResult({ files, before, note, onReset, resetLabel = "Start again" }: { files: OutputFile[]; before?: number; note?: React.ReactNode; onReset: () => void; resetLabel?: string }) {
  const total = files.reduce((s, f) => s + f.blob.size, 0);
  const saved = before ? Math.round((1 - total / before) * 100) : null;
  const zipName = withExtension(files[0]?.name.replace(/(-part-\d+|-page-\d+)?\.pdf$/i, "") ?? "files", "zip");
  return (
    <section aria-label="Result" className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-primary/30 sm:p-6">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-600" aria-hidden />
        <div className="min-w-0 space-y-1">
          <h2 className="text-base font-semibold">{files.length === 1 ? (/\.pdf$/i.test(files[0].name) ? "Your PDF is ready" : "Your file is ready") : `${files.length} files are ready`}</h2>
          <p className="text-sm text-muted-foreground">
            {before !== undefined ? (
              <>
                {formatBytes(before)} → <span className="font-medium text-foreground">{formatBytes(total)}</span>
                {saved !== null && saved > 0 && <span className="font-medium text-emerald-700"> ({saved}% smaller)</span>}
              </>
            ) : (
              formatBytes(total)
            )}
          </p>
          {note && <p className="text-sm text-muted-foreground">{note}</p>}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {files.length === 1 ? (
          <Button className="h-11 px-5" onClick={() => downloadBlob(files[0].blob, files[0].name)}>
            <Download /> Download {files[0].name.length > 36 ? files[0].name.split(".").pop()?.toUpperCase() : files[0].name}
          </Button>
        ) : (
          <Button
            className="h-11 px-5"
            onClick={async () => {
              downloadBlob(await zipBlobs(files), zipName);
              toast.success("ZIP downloaded.");
            }}
          >
            <FileArchive /> Download all (ZIP)
          </Button>
        )}
        <Button variant="outline" className="h-11" onClick={onReset}>
          <RotateCcw /> {resetLabel}
        </Button>
      </div>
      {files.length > 1 && (
        <ul className="divide-y rounded-lg ring-1 ring-foreground/10">
          {files.map((f) => (
            <li key={f.name} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span className="min-w-0 truncate">{f.name}</span>
              <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                {formatBytes(f.blob.size)}
                <Button variant="ghost" size="icon" className="size-9" onClick={() => downloadBlob(f.blob, f.name)} aria-label={`Download ${f.name}`}>
                  <Download />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** A page preview tile. */
export function PageTile({
  page,
  src,
  rotate = 0,
  dimmed,
  selected,
  badge,
  onClick,
  label,
  children,
  itemProps,
}: {
  page: number;
  src?: string;
  rotate?: number;
  dimmed?: boolean;
  selected?: boolean;
  badge?: React.ReactNode;
  onClick?: () => void;
  label?: string;
  children?: React.ReactNode;
  /** Extra attributes for the list item (e.g. drag and drop). */
  itemProps?: React.LiHTMLAttributes<HTMLLIElement>;
}) {
  const body = (
    <>
      <div className={cn("relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-md bg-white ring-1 ring-foreground/10 transition", selected && "ring-2 ring-primary", dimmed && "opacity-35")}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
          <img src={src} alt="" className="max-h-full max-w-full object-contain transition-transform" style={{ transform: rotate ? `rotate(${rotate}deg)` : undefined }} />
        ) : (
          <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
        )}
        {badge && <span className="absolute top-1 right-1">{badge}</span>}
      </div>
      <p className="mt-1 text-center text-xs text-muted-foreground">{page}</p>
    </>
  );
  return (
    <li {...itemProps} className={cn("space-y-1", itemProps?.className)}>
      {onClick ? (
        <button type="button" onClick={onClick} aria-pressed={selected} aria-label={label ?? `Page ${page}`} className="block w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {body}
        </button>
      ) : (
        body
      )}
      {children}
    </li>
  );
}

export const pageGridClass = "grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-5";

/** "Reading page 3 of 12…" with a bar. */
export function ProgressBar({ label, done, total }: { label: string; done: number; total: number }) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="space-y-1.5" role="status" aria-live="polite">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums">{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

/** A page selection field ("all pages" when empty) with its parsed pages and any error. */
export function usePageRange(total: number, initial = "") {
  const [value, setValue] = useState(initial);
  const { pages, error } = parsePageRange(value, total);
  return { value, setValue, pages, error: value.trim() ? error : undefined };
}

export function PageRangeField({ range, total, label = "Pages", onChange }: { range: ReturnType<typeof usePageRange>; total: number; label?: string; onChange?: () => void }) {
  return (
    <TextField
      label={label}
      value={range.value}
      onChange={(v) => {
        range.setValue(v);
        onChange?.();
      }}
      placeholder={`All pages (1–${total})`}
      error={range.error}
      hint={range.value.trim() && !range.error ? `${range.pages.length} of ${total} pages` : "e.g. 1-3, 5, 8- · leave empty for all pages"}
    />
  );
}

/** Text produced from a PDF (Markdown, summary, OCR, translation): editable preview, copy and download. */
export function TextOutput({ label, text, onChange, fileName, mime = "text/plain", extra }: { label: string; text: string; onChange: (text: string) => void; fileName: string; mime?: string; extra?: React.ReactNode }) {
  return (
    <section aria-label={label} className="space-y-3 rounded-xl bg-card p-5 ring-1 ring-primary/30 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{label}</h2>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={text} label="Copy" saveable={false} />
          <Button className="h-10 px-3.5" onClick={() => downloadBlob(new Blob([text], { type: `${mime};charset=utf-8` }), fileName)}>
            <Download /> Download {fileName.split(".").pop()?.toUpperCase()}
          </Button>
          {extra}
        </div>
      </div>
      <textarea
        aria-label={label}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        rows={16}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </section>
  );
}
