"use client";

import { useId, useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ACCEPT_ATTR, formatBytes, MIME_LABEL, validateFiles, type AcceptedFile, type FileRules } from "@/lib/files/validation";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  rules: FileRules;
  alreadySelected?: number;
  onFiles: (files: AcceptedFile[]) => void;
  title?: string;
  compact?: boolean;
  preprocessFiles?: (files: File[]) => Promise<File[]>;
  acceptExtras?: string[];
  allowDirectories?: boolean;
}

type DroppedEntry = {
  isFile: boolean;
  isDirectory: boolean;
  file?: (callback: (file: File) => void) => void;
  createReader?: () => { readEntries: (callback: (entries: DroppedEntry[]) => void) => void };
};

async function filesFromEntry(entry: DroppedEntry): Promise<File[]> {
  if (entry.isFile && entry.file) return new Promise((resolve) => entry.file!((file) => resolve([file])));
  if (!entry.isDirectory || !entry.createReader) return [];
  const reader = entry.createReader();
  const children: DroppedEntry[] = [];
  while (true) {
    const batch = await new Promise<DroppedEntry[]>((resolve) => reader.readEntries(resolve));
    if (!batch.length) break;
    children.push(...batch);
  }
  return (await Promise.all(children.map(filesFromEntry))).flat();
}

/** Drag-and-drop or click/keyboard to choose files. Checks the real file type, size and count before accepting. */
export function FileDropzone({ rules, alreadySelected = 0, onFiles, title, compact, preprocessFiles, acceptExtras = [], allowDirectories = false }: FileDropzoneProps) {
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [checking, setChecking] = useState(false);
  const multiple = rules.maxCount > 1;
  const types = rules.accept.map((m) => MIME_LABEL[m]).join(", ");
  const remaining = rules.maxCount - alreadySelected;

  const handle = async (list: FileList | File[] | null) => {
    if (!list || list.length === 0) return;
    setChecking(true);
    try {
      const files = preprocessFiles ? await preprocessFiles([...list]) : [...list];
      const { accepted, rejected } = await validateFiles(files, rules, alreadySelected);
      if (rejected.length) {
        toast.error(rejected.length === 1 ? `${rejected[0].name}: ${rejected[0].reason}` : `${rejected.length} files were skipped`, {
          description: rejected.length > 1 ? rejected.slice(0, 3).map((r) => `${r.name}: ${r.reason}`).join("\n") : undefined,
        });
      }
      if (accepted.length) onFiles(accepted);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't read those files.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const entryItems = [...e.dataTransfer.items]
          .map((item) => (item as unknown as { webkitGetAsEntry?: () => DroppedEntry | null }).webkitGetAsEntry?.())
          .filter((entry): entry is DroppedEntry => entry != null);
        if (allowDirectories && entryItems.some((entry) => entry.isDirectory)) {
          void Promise.all(entryItems.map(filesFromEntry)).then((groups) => handle(groups.flat()));
        } else void handle(e.dataTransfer.files);
      }}
      className={cn(
        "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-card text-center transition-colors",
        compact ? "p-5" : "min-h-56 p-8",
        dragging ? "border-primary bg-accent" : "border-border hover:border-primary/50",
        remaining <= 0 && "pointer-events-none opacity-50",
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
        {checking ? <Loader2 className="size-6 animate-spin" aria-hidden /> : <FileUp className="size-6" aria-hidden />}
      </span>
      <div className="space-y-1">
        <label htmlFor={inputId} className="cursor-pointer font-semibold text-primary after:absolute after:inset-0 hover:underline">
          {title ?? (multiple ? "Choose files" : "Choose a file")}
        </label>
        <span className="hidden text-muted-foreground sm:inline"> or drag and drop here</span>
        <p className="text-xs text-muted-foreground">
          {types} · up to {formatBytes(rules.maxBytes)}
          {multiple ? ` each · max ${rules.maxCount} files` : ""}
        </p>
      </div>
      <input
        ref={input}
        id={inputId}
        type="file"
        className="sr-only"
        multiple={multiple}
        accept={[...rules.accept.map((m) => ACCEPT_ATTR[m]), ...acceptExtras].join(",")}
        disabled={remaining <= 0}
        onChange={(e) => {
          void handle(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function PrivacyNote() {
  return (
    <p className="text-sm text-muted-foreground">
      🔒 Files are processed entirely in your browser — they&apos;re never uploaded, and are cleared from memory when you leave this page.
    </p>
  );
}
