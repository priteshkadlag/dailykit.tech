"use client";

import { useId, useState } from "react";
import { AlertCircle, Check, CheckCircle2, Copy, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { downloadBlob } from "@/lib/files/download";
import { Button } from "@/components/ui/button";

/** A titled card section. */
export function Panel({ title, actions, children, className }: { title?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("min-w-0 space-y-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5", className)}>
      {(title || actions) && <div className="flex flex-wrap items-center justify-between gap-2">{title && <h2 className="font-semibold">{title}</h2>}{actions && <div className="flex flex-wrap gap-2">{actions}</div>}</div>}
      {children}
    </section>
  );
}

/** Monospace text area for code and data. */
export function CodeArea({ label, value, onChange, rows = 14, placeholder, readOnly, hideLabel, className, invalid }: {
  label: string; value: string; onChange?: (value: string) => void; rows?: number; placeholder?: string; readOnly?: boolean; hideLabel?: boolean; className?: string; invalid?: boolean;
}) {
  const id = useId();
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className={cn("text-sm font-medium", hideLabel && "sr-only")}>{label}</label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        readOnly={readOnly}
        rows={rows}
        placeholder={placeholder}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        aria-invalid={invalid || undefined}
        className={cn(
          "w-full resize-y rounded-lg border bg-background p-3 font-mono text-[13px] leading-relaxed outline-none [tab-size:2] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          readOnly && "bg-muted/40",
          invalid && "border-destructive",
        )}
      />
    </div>
  );
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return <p role="alert" className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />{children}</p>;
}

export function OkNote({ children }: { children: React.ReactNode }) {
  return <p className="flex items-start gap-2 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground"><CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />{children}</p>;
}

export function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs leading-relaxed text-muted-foreground">{children}</p>;
}

/** Small copy button with a check-mark confirmation. */
export function CopyText({ text, label = "Copy", size = "default" }: { text: string; label?: string; size?: "default" | "sm" }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size={size === "sm" ? "sm" : "default"}
      disabled={!text}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error("Couldn't copy — your browser blocked clipboard access.");
        }
      }}
    >
      {copied ? <Check /> : <Copy />} {copied ? "Copied" : label}
    </Button>
  );
}

export function DownloadText({ text, fileName, type = "text/plain", label = "Download" }: { text: string; fileName: string; type?: string; label?: string }) {
  return <Button type="button" variant="outline" disabled={!text} onClick={() => downloadBlob(new Blob([text], { type: `${type};charset=utf-8` }), fileName)}><Download /> {label}</Button>;
}

/** Loads a text file into the editor. */
export function OpenFileButton({ accept, onText, label = "Open file" }: { accept?: string; onText: (text: string, name: string) => void; label?: string }) {
  const id = useId();
  return (
    <>
      <input id={id} type="file" accept={accept} className="sr-only" onChange={async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        if (file.size > 20 * 1024 * 1024) { toast.error("That file is over 20 MB; paste a smaller part instead."); return; }
        onText(await file.text(), file.name);
      }} />
      <label htmlFor={id} className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border bg-background px-3 text-sm font-medium hover:bg-muted"><Upload className="size-4" aria-hidden /> {label}</label>
    </>
  );
}

/** Label/value rows with a copy button per value. */
export function ValueRows({ rows }: { rows: { label: string; value: string; mono?: boolean }[] }) {
  return (
    <dl className="divide-y rounded-lg border">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2.5">
          <dt className="w-40 shrink-0 text-sm text-muted-foreground">{row.label}</dt>
          <dd className={cn("min-w-0 flex-1 text-sm break-all", row.mono && "font-mono text-[13px]")}>{row.value || "—"}</dd>
          {row.value && <CopyText text={row.value} size="sm" />}
        </div>
      ))}
    </dl>
  );
}

/** Two editors side by side (stacked on phones). */
export function TwoPane({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return <div className="grid gap-4 lg:grid-cols-2">{left}{right}</div>;
}
