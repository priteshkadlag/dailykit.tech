"use client";

import { useState } from "react";
import { Search, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { track } from "@/lib/analytics/client";
import { renderPageImages } from "@/lib/pdf/browser";
import { replacePagesWithImages } from "@/lib/pdf/edit";
import { findInFragments, pageFragments } from "@/lib/pdf/text";
import { Button } from "@/components/ui/button";
import { SegmentedControl, TextField } from "@/components/shared/form-fields";
import { ActionButton, baseName, FileBar, pdfBlob, PdfLayout, PdfPicker, PdfResult, ProgressBar, type OutputFile } from "./pdf-shell";
import { PageNav } from "./page-view";
import { PlacementEditor, type Placed } from "./placement-editor";
import { usePdf, type LoadedPdf } from "./use-pdf";

const QUALITY = { standard: { dpi: 150, label: "Standard" }, high: { dpi: 220, label: "High" } } as const;

export function RedactPdf() {
  const { pdf, loading, open, reset } = usePdf();
  if (!pdf) return <PdfPicker loading={loading} onFile={open} />;
  return <Redactor key={pdf.file.name + pdf.file.lastModified} pdf={pdf} reset={reset} />;
}

function Redactor({ pdf, reset }: { pdf: LoadedPdf; reset: () => void }) {
  const total = pdf.doc.numPages;
  const [page, setPage] = useState(1);
  const [boxes, setBoxes] = useState<Placed[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [quality, setQuality] = useState<keyof typeof QUALITY>("standard");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<OutputFile[] | null>(null);

  const change = (next: Placed[]) => {
    setBoxes(next);
    setResult(null);
  };

  const addBox = () => {
    const size = pdf.sizes[page - 1];
    const box: Placed = { id: crypto.randomUUID(), page, kind: "box", x: size.width / 2 - 80, y: size.height / 2 - 12, width: 160, height: 24, color: "#000000" };
    change([...boxes, box]);
    setSelected(box.id);
  };

  const find = async () => {
    setSearching(true);
    try {
      const found: Placed[] = [];
      for (let p = 1; p <= total; p++) {
        for (const b of findInFragments(await pageFragments(pdf.doc, p), query, p)) {
          found.push({ id: crypto.randomUUID(), kind: "box", color: "#000000", ...b });
        }
      }
      if (found.length === 0) {
        toast.info("No matches found. Scanned pages have no text to search — draw boxes instead.");
        return;
      }
      change([...boxes, ...found]);
      setPage(found[0].page);
      toast.success(`Covered ${found.length} match${found.length === 1 ? "" : "es"} on ${new Set(found.map((f) => f.page)).size} page(s). Check each one before saving.`);
    } finally {
      setSearching(false);
    }
  };

  const save = async () => {
    setProgress({ done: 0, total: 1 });
    try {
      const pages = [...new Set(boxes.map((b) => b.page))].sort((a, b) => a - b);
      const images = await renderPageImages(pdf.doc, pages, {
        dpi: QUALITY[quality].dpi,
        quality: 0.88,
        onProgress: (done, t) => setProgress({ done, total: t }),
        draw: (ctx, p) => {
          ctx.fillStyle = "#000000";
          for (const b of boxes) if (b.page === p && b.kind === "box") ctx.fillRect(b.x, b.y, b.width, b.height);
        },
      });
      const bytes = await replacePagesWithImages(pdf.bytes, images);
      setResult([{ name: `${baseName(pdf.file)}-redacted.pdf`, blob: pdfBlob(bytes) }]);
      track("pdf_generated");
      toast.success("Redacted PDF is ready.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't redact this PDF.");
    } finally {
      setProgress(null);
    }
  };

  const pagesWithBoxes = new Set(boxes.map((b) => b.page));
  const busy = progress !== null;

  return (
    <div className="space-y-6">
      <FileBar file={pdf.file} pages={total} onReset={reset} disabled={busy} />
      {result && (
        <PdfResult
          files={result}
          note={`${pagesWithBoxes.size} page${pagesWithBoxes.size === 1 ? " was" : "s were"} flattened to an image so the covered text is removed, not just hidden. Other pages are unchanged.`}
          onReset={() => setResult(null)}
          resetLabel="Keep redacting"
        />
      )}
      <PdfLayout
        main={
          <>
            <PageNav page={page} total={total} onChange={(p) => { setPage(p); setSelected(null); }} marks={pagesWithBoxes} />
            <div className="mx-auto max-w-3xl">
              <PlacementEditor pdf={pdf} page={page} items={boxes} selected={selected} onSelect={setSelected} onChange={change} />
            </div>
          </>
        }
        aside={
          <>
            <h2 className="text-base font-semibold">Black out sensitive information</h2>
            <div className="space-y-2">
              <TextField label="Find text" value={query} onChange={setQuery} placeholder="e.g. PAN, phone number, name" />
              <Button variant="outline" className="h-10 w-full" onClick={find} disabled={!query.trim() || searching}>
                <Search /> {searching ? "Searching…" : "Cover every match"}
              </Button>
            </div>
            <Button variant="outline" className="h-10 w-full" onClick={addBox}>
              <Square /> Draw a box on page {page}
            </Button>
            {selected && (
              <Button variant="ghost" className="h-9 w-full text-destructive" onClick={() => { change(boxes.filter((b) => b.id !== selected)); setSelected(null); }}>
                <Trash2 /> Remove selected box
              </Button>
            )}
            {boxes.length > 0 && (
              <Button variant="ghost" className="h-9 w-full" onClick={() => { change([]); setSelected(null); }}>
                Clear all boxes
              </Button>
            )}
            <SegmentedControl label="Output quality" value={quality} onChange={setQuality} options={Object.entries(QUALITY).map(([value, q]) => ({ value: value as keyof typeof QUALITY, label: q.label }))} />
            <p className="text-xs text-muted-foreground">
              Redacted pages are rebuilt as images, which permanently removes the text, links and hidden data under the boxes. Their text can no longer be selected.
            </p>
            {progress ? (
              <ProgressBar label="Redacting pages…" done={progress.done} total={progress.total} />
            ) : (
              <ActionButton busy={busy} busyLabel="Redacting…" disabled={boxes.length === 0} onClick={save}>
                Redact {boxes.length} area{boxes.length === 1 ? "" : "s"}
              </ActionButton>
            )}
          </>
        }
      />
    </div>
  );
}
