"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, FileText, Merge, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { track } from "@/lib/analytics/client";
import { formatBytes, type AcceptedFile } from "@/lib/files/validation";
import { pdfEdit } from "@/lib/pdf/lazy";
import { openPdf } from "@/lib/pdf/pdf-render";
import { Button } from "@/components/ui/button";
import { FileDropzone, PrivacyNote } from "@/components/files/file-dropzone";
import { ActionButton, pdfBlob, PdfResult, type OutputFile } from "./pdf-shell";

const RULES = { accept: ["application/pdf" as const], maxBytes: 100 * 1024 * 1024, maxCount: 20 };

interface Item {
  id: string;
  file: File;
  pages: number | null;
  error?: string;
}

export function MergePdf() {
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OutputFile | null>(null);

  const add = async (accepted: AcceptedFile[]) => {
    setResult(null);
    const added = accepted.map((a) => ({ id: crypto.randomUUID(), file: a.file, pages: null }) as Item);
    setItems((list) => [...list, ...added]);
    // Count pages (and catch locked or broken files) without holding the documents open.
    for (const item of added) {
      try {
        const { doc, destroy } = await openPdf(item.file);
        const pages = doc.numPages;
        await destroy();
        setItems((list) => list.map((i) => (i.id === item.id ? { ...i, pages } : i)));
      } catch (error) {
        setItems((list) => list.map((i) => (i.id === item.id ? { ...i, error: error instanceof Error ? error.message : "Can't be opened" } : i)));
      }
    }
  };

  const move = (index: number, by: number) =>
    setItems((list) => {
      const next = [...list];
      const [item] = next.splice(index, 1);
      next.splice(index + by, 0, item);
      return next;
    });

  const merge = async () => {
    if (items.some((i) => i.error)) {
      toast.error("Remove the files that can't be opened first.");
      return;
    }
    setBusy(true);
    try {
      const bytes = await (await pdfEdit()).mergePdfs(await Promise.all(items.map(async (i) => new Uint8Array(await i.file.arrayBuffer()))));
      setResult({ name: "merged.pdf", blob: pdfBlob(bytes) });
      toast.success(`Merged ${items.length} PDFs.`);
      track("pdf_generated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't merge these PDFs.");
    } finally {
      setBusy(false);
    }
  };

  const totalPages = items.reduce((s, i) => s + (i.pages ?? 0), 0);

  if (result) return <PdfResult files={[result]} note={`${items.length} files · ${totalPages} pages`} onReset={() => { setResult(null); setItems([]); }} resetLabel="Merge other files" />;

  return (
    <div className="space-y-6">
      <PrivacyNote />
      {items.length > 0 && (
        <section aria-label="Files to merge" className="space-y-3">
          <p className="text-sm text-muted-foreground">Files are combined from top to bottom. Use the arrows to change the order.</p>
          <ol className="space-y-2">
            {items.map((item, i) => (
              <li key={item.id} className="flex items-center gap-3 rounded-lg bg-card p-3 ring-1 ring-foreground/10">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-semibold tabular-nums">{i + 1}</span>
                <FileText className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.file.name}</p>
                  <p className={item.error ? "text-xs font-medium text-destructive" : "text-xs text-muted-foreground"}>
                    {item.error ?? `${item.pages === null ? "Counting pages…" : `${item.pages} page${item.pages === 1 ? "" : "s"}`} · ${formatBytes(item.file.size)}`}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="size-9" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${item.file.name} up`}>
                  <ArrowUp />
                </Button>
                <Button variant="ghost" size="icon" className="size-9" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${item.file.name} down`}>
                  <ArrowDown />
                </Button>
                <Button variant="ghost" size="icon" className="size-9" onClick={() => setItems((l) => l.filter((x) => x.id !== item.id))} aria-label={`Remove ${item.file.name}`}>
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ol>
        </section>
      )}
      <FileDropzone rules={RULES} alreadySelected={items.length} onFiles={add} title={items.length ? "Add more PDFs" : "Choose PDFs to merge"} compact={items.length > 0} />
      {items.length > 0 && (
        <div className="sm:max-w-xs">
          <ActionButton busy={busy} busyLabel="Merging…" disabled={items.length < 2 || items.some((i) => i.pages === null)} onClick={merge}>
            <Merge /> Merge {items.length} PDFs{totalPages ? ` (${totalPages} pages)` : ""}
          </ActionButton>
          {items.length === 1 && <p className="mt-2 text-sm text-muted-foreground">Add at least one more PDF.</p>}
        </div>
      )}
    </div>
  );
}
