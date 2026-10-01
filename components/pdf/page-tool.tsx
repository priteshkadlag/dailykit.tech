"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Copy, FilePlus2, RotateCcw, RotateCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { track } from "@/lib/analytics/client";
import type { PagePlan } from "@/lib/pdf/edit";
import { pdfEdit } from "@/lib/pdf/lazy";
import { parsePageRange } from "@/lib/pdf/page-range";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SegmentedControl, TextField } from "@/components/shared/form-fields";
import { ActionButton, baseName, FileBar, PageTile, pageGridClass, pdfBlob, PdfLayout, PdfPicker, PdfResult, type OutputFile } from "./pdf-shell";
import { usePdf, useThumbnails, type LoadedPdf } from "./use-pdf";

export type PageToolMode = "organize" | "remove" | "extract" | "rotate";

interface Slot {
  key: string;
  source: number | null;
  rotate: number;
}

const MAX_PAGES = 300;

/** Compact range text for a set of pages: [1,2,3,5] → "1-3, 5". */
export function toRangeText(pages: number[]) {
  const sorted = [...pages].sort((a, b) => a - b);
  const parts: string[] = [];
  for (let i = 0; i < sorted.length; i++) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    parts.push(i === j ? String(sorted[i]) : `${sorted[i]}-${sorted[j]}`);
    i = j;
  }
  return parts.join(", ");
}

const COPY: Record<PageToolMode, { action: string; busy: string; hint: string }> = {
  organize: { action: "Save organised PDF", busy: "Saving…", hint: "Drag pages to reorder, or use the buttons under each page." },
  remove: { action: "Remove pages", busy: "Removing…", hint: "Tap the pages you want to delete." },
  extract: { action: "Extract pages", busy: "Extracting…", hint: "Tap the pages you want to keep." },
  rotate: { action: "Save rotated PDF", busy: "Rotating…", hint: "Tap a page to turn it 90° clockwise, or rotate them all at once." },
};

export function PageTool({ mode }: { mode: PageToolMode }) {
  const { pdf, loading, open, reset } = usePdf();
  if (!pdf) return <PdfPicker loading={loading} onFile={open} />;
  // Keyed by file so each opened PDF starts with a fresh page list.
  return <PageEditor key={pdf.file.name + pdf.file.lastModified + pdf.bytes.length} mode={mode} pdf={pdf} reset={reset} />;
}

function PageEditor({ mode, pdf, reset }: { mode: PageToolMode; pdf: LoadedPdf; reset: () => void }) {
  const total = pdf.doc.numPages;
  const thumbs = useThumbnails(pdf.doc, { limit: MAX_PAGES });
  const [slots, setSlots] = useState<Slot[]>(() => Array.from({ length: total }, (_, i) => ({ key: `p${i + 1}`, source: i + 1, rotate: 0 })));
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [range, setRange] = useState("");
  const [separate, setSeparate] = useState<"one" | "separate">("one");
  const [dragging, setDragging] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OutputFile[] | null>(null);

  if (total > MAX_PAGES && (mode === "organize" || mode === "rotate")) {
    return (
      <div className="space-y-4">
        <FileBar file={pdf.file} pages={total} onReset={reset} />
        <p className="rounded-xl bg-card p-5 text-sm ring-1 ring-foreground/10">
          This PDF has {total} pages. Page-by-page editing works up to {MAX_PAGES} pages — split it first, then organise each part.
        </p>
      </div>
    );
  }

  const changed = () => setResult(null);
  const update = (fn: (s: Slot[]) => Slot[]) => {
    setSlots(fn);
    changed();
  };
  const setSelection = (next: Set<number>) => {
    setSelected(next);
    setRange(toRangeText([...next]));
    changed();
  };
  const toggle = (page: number) => {
    const next = new Set(selected);
    if (next.has(page)) next.delete(page);
    else next.add(page);
    setSelection(next);
  };
  const typedRange = (text: string) => {
    setRange(text);
    const parsed = parsePageRange(text, total);
    if (!parsed.error) setSelected(new Set(text.trim() ? parsed.pages : []));
    changed();
  };
  const rangeError = range.trim() ? parsePageRange(range, total).error : undefined;

  const rotateSlot = (i: number, by: number) => update((s) => s.map((slot, n) => (n === i ? { ...slot, rotate: (slot.rotate + by + 360) % 360 } : slot)));
  const moveSlot = (from: number, to: number) =>
    update((s) => {
      if (to < 0 || to >= s.length || from === to) return s;
      const next = [...s];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  const plan = (): PagePlan[] => {
    if (mode === "remove") return slots.filter((s) => !selected.has(s.source!)).map((s) => ({ source: s.source }));
    if (mode === "extract") return [...selected].sort((a, b) => a - b).map((source) => ({ source }));
    return slots.map((s) => ({ source: s.source, rotate: s.rotate }));
  };

  const nothingToDo =
    (mode === "remove" && (selected.size === 0 || selected.size === total)) ||
    (mode === "extract" && selected.size === 0) ||
    (mode === "rotate" && slots.every((s) => s.rotate === 0)) ||
    slots.length === 0 ||
    !!rangeError;

  const run = async () => {
    setBusy(true);
    try {
      const name = baseName(pdf.file);
      if (mode === "extract" && separate === "separate") {
        const pages = [...selected].sort((a, b) => a - b);
        const files = await (await pdfEdit()).splitPdf(pdf.bytes, pages.map((p) => [p]));
        setResult(files.map((bytes, i) => ({ name: `${name}-page-${pages[i]}.pdf`, blob: pdfBlob(bytes) })));
      } else {
        const bytes = await (await pdfEdit()).buildFromPages(pdf.bytes, plan());
        const suffix = { organize: "organized", remove: "pages-removed", extract: "extracted", rotate: "rotated" }[mode];
        setResult([{ name: `${name}-${suffix}.pdf`, blob: pdfBlob(bytes) }]);
      }
      toast.success(
        mode === "remove" ? `Removed ${selected.size} page${selected.size === 1 ? "" : "s"}.` : mode === "extract" ? `Extracted ${selected.size} page${selected.size === 1 ? "" : "s"}.` : "Your PDF is ready.",
      );
      track("pdf_generated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save the PDF.");
    } finally {
      setBusy(false);
    }
  };

  const selecting = mode === "remove" || mode === "extract";

  return (
    <div className="space-y-6">
      <FileBar file={pdf.file} pages={total} onReset={reset} disabled={busy} />
      {result && <PdfResult files={result} onReset={() => setResult(null)} resetLabel="Keep editing" />}
      <PdfLayout
        main={
          <>
            <p className="text-sm text-muted-foreground">{COPY[mode].hint}</p>
            <ol className={pageGridClass}>
              {slots.map((slot, i) => {
                const page = slot.source;
                const isSelected = page !== null && selected.has(page);
                return (
                  <PageTile
                    key={slot.key}
                    page={page ?? 0}
                    src={page === null ? undefined : thumbs[page]}
                    rotate={slot.rotate}
                    selected={selecting ? isSelected : false}
                    dimmed={mode === "remove" ? isSelected : mode === "extract" ? selected.size > 0 && !isSelected : false}
                    onClick={selecting ? () => toggle(page!) : mode === "rotate" ? () => rotateSlot(i, 90) : undefined}
                    label={
                      selecting
                        ? `Page ${page}${isSelected ? (mode === "remove" ? ", marked for removal" : ", selected") : ""}`
                        : mode === "rotate"
                          ? `Rotate page ${page} (now ${slot.rotate}°)`
                          : undefined
                    }
                    badge={
                      mode === "remove" && isSelected ? (
                        <span className="rounded bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-white">Remove</span>
                      ) : slot.rotate ? (
                        <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">{slot.rotate}°</span>
                      ) : page === null ? (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold">Blank</span>
                      ) : undefined
                    }
                    itemProps={
                      mode === "organize"
                        ? {
                            draggable: true,
                            className: cn("cursor-grab", dragging === i && "opacity-50"),
                            onDragStart: () => setDragging(i),
                            onDragEnd: () => setDragging(null),
                            onDragOver: (e) => dragging !== null && e.preventDefault(),
                            onDrop: (e) => {
                              e.preventDefault();
                              if (dragging !== null) moveSlot(dragging, i);
                              setDragging(null);
                            },
                          }
                        : undefined
                    }
                  >
                    {mode === "organize" && (
                      <div className="flex flex-wrap justify-center gap-0.5">
                        <IconAction label={`Move page ${i + 1} left`} onClick={() => moveSlot(i, i - 1)} disabled={i === 0}>
                          <ArrowLeft />
                        </IconAction>
                        <IconAction label={`Rotate page ${i + 1} left`} onClick={() => rotateSlot(i, -90)}>
                          <RotateCcw />
                        </IconAction>
                        <IconAction label={`Rotate page ${i + 1} right`} onClick={() => rotateSlot(i, 90)}>
                          <RotateCw />
                        </IconAction>
                        <IconAction label={`Duplicate page ${i + 1}`} onClick={() => update((s) => [...s.slice(0, i + 1), { ...slot, key: crypto.randomUUID() }, ...s.slice(i + 1)])}>
                          <Copy />
                        </IconAction>
                        <IconAction label={`Insert blank page after page ${i + 1}`} onClick={() => update((s) => [...s.slice(0, i + 1), { key: crypto.randomUUID(), source: null, rotate: 0 }, ...s.slice(i + 1)])}>
                          <FilePlus2 />
                        </IconAction>
                        <IconAction label={`Delete page ${i + 1}`} onClick={() => update((s) => s.filter((_, n) => n !== i))} disabled={slots.length === 1}>
                          <Trash2 />
                        </IconAction>
                        <IconAction label={`Move page ${i + 1} right`} onClick={() => moveSlot(i, i + 1)} disabled={i === slots.length - 1}>
                          <ArrowRight />
                        </IconAction>
                      </div>
                    )}
                  </PageTile>
                );
              })}
            </ol>
          </>
        }
        aside={
          <>
            <h2 className="text-base font-semibold">{mode === "organize" ? "Organise pages" : mode === "rotate" ? "Rotate pages" : mode === "remove" ? "Pages to remove" : "Pages to extract"}</h2>
            {selecting && (
              <>
                <TextField label="Pages" value={range} onChange={typedRange} placeholder="e.g. 2, 5-7" error={rangeError} hint={`${selected.size} of ${total} selected`} />
                <div className="flex gap-2">
                  <Button variant="outline" className="h-9 flex-1" onClick={() => setSelection(new Set(Array.from({ length: total }, (_, i) => i + 1)))}>
                    Select all
                  </Button>
                  <Button variant="outline" className="h-9 flex-1" onClick={() => setSelection(new Set())} disabled={selected.size === 0}>
                    Clear
                  </Button>
                </div>
                {mode === "remove" && selected.size === total && <p className="text-sm text-destructive">You can&apos;t remove every page.</p>}
              </>
            )}
            {mode === "extract" && (
              <SegmentedControl
                label="Save as"
                value={separate}
                onChange={(v) => {
                  setSeparate(v);
                  changed();
                }}
                options={[
                  { value: "one", label: "One PDF" },
                  { value: "separate", label: "A PDF per page" },
                ]}
              />
            )}
            {mode === "rotate" && (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="h-10" onClick={() => update((s) => s.map((x) => ({ ...x, rotate: (x.rotate + 270) % 360 })))}>
                  <RotateCcw /> All left
                </Button>
                <Button variant="outline" className="h-10" onClick={() => update((s) => s.map((x) => ({ ...x, rotate: (x.rotate + 90) % 360 })))}>
                  <RotateCw /> All right
                </Button>
                <Button variant="ghost" className="col-span-2 h-9" onClick={() => update((s) => s.map((x) => ({ ...x, rotate: 0 })))} disabled={slots.every((s) => s.rotate === 0)}>
                  Reset rotation
                </Button>
              </div>
            )}
            {mode === "organize" && (
              <p className="text-sm text-muted-foreground">
                {slots.length} page{slots.length === 1 ? "" : "s"} in the new PDF.
                <Button
                  variant="link"
                  className="h-auto px-1"
                  onClick={() => update(() => Array.from({ length: total }, (_, i) => ({ key: `p${i + 1}-${Date.now()}`, source: i + 1, rotate: 0 })))}
                >
                  Undo all changes
                </Button>
              </p>
            )}
            <ActionButton busy={busy} busyLabel={COPY[mode].busy} disabled={nothingToDo} onClick={run}>
              {COPY[mode].action}
            </ActionButton>
          </>
        }
      />
    </div>
  );
}

function IconAction({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <Button type="button" variant="ghost" size="icon" className="size-8 [&_svg]:size-3.5" onClick={onClick} disabled={disabled} aria-label={label} title={label}>
      {children}
    </Button>
  );
}
