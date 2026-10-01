"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, Copy, ImagePlus, PenLine, Square, Trash2, Type } from "lucide-react";
import { toast } from "sonner";
import { track } from "@/lib/analytics/client";
import { imageToPng } from "@/lib/pdf/browser";
import { IMAGE_MIMES, type AcceptedFile } from "@/lib/files/validation";
import { Button } from "@/components/ui/button";
import { CheckboxField, NumberField, SelectField, TextAreaField } from "@/components/shared/form-fields";
import { FileDropzone } from "@/components/files/file-dropzone";
import { ActionButton, baseName, FileBar, pdfBlob, PdfLayout, PdfPicker, PdfResult, type OutputFile } from "./pdf-shell";
import { PageNav } from "./page-view";
import { applyPlaced, PlacementEditor, type Placed, type TextFont } from "./placement-editor";
import { SignaturePad, type Signature } from "./signature-pad";
import { usePdf, type LoadedPdf } from "./use-pdf";

export type AnnotateMode = "edit" | "sign";

export function AnnotatePdf({ mode }: { mode: AnnotateMode }) {
  const { pdf, loading, open, reset } = usePdf();
  if (!pdf) return <PdfPicker loading={loading} onFile={open} />;
  return <Annotator key={pdf.file.name + pdf.file.lastModified} pdf={pdf} mode={mode} reset={reset} />;
}

const newId = () => crypto.randomUUID();

function Annotator({ pdf, mode, reset }: { pdf: LoadedPdf; mode: AnnotateMode; reset: () => void }) {
  const total = pdf.doc.numPages;
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Placed[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [signature, setSignature] = useState<Signature | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OutputFile[] | null>(null);
  const urls = useRef<string[]>([]);

  // Pictures and signatures are object URLs: free them when leaving.
  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const size = pdf.sizes[page - 1];
  const current = items.find((i) => i.id === selected) ?? null;
  const change = (next: Placed[]) => {
    setItems(next);
    setResult(null);
  };
  const add = (item: Placed) => {
    change([...items, item]);
    setSelected(item.id);
  };
  const patch = (p: Partial<Placed>) => current && change(items.map((i) => (i.id === current.id ? ({ ...i, ...p } as Placed) : i)));

  const addText = (text = "Type here", size = 14) =>
    add({ id: newId(), page, kind: "text", x: size * 3, y: size * 4, text, size, color: "#111111", font: "helvetica", bold: false });

  const addImage = async ([f]: AcceptedFile[]) => {
    try {
      const png = await imageToPng(f.file);
      const url = URL.createObjectURL(new Blob([png.bytes.slice().buffer as ArrayBuffer], { type: "image/png" }));
      urls.current.push(url);
      const width = Math.min(size.width * 0.4, png.width);
      const height = (width * png.height) / png.width;
      add({ id: newId(), page, kind: "image", x: (size.width - width) / 2, y: (size.height - height) / 2, width, height, url, png: png.bytes });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't add this picture.");
    }
  };

  const placeSignature = (sig: Signature) => {
    const width = Math.min(160, size.width * 0.35);
    const height = width / sig.ratio;
    add({ id: newId(), page, kind: "image", x: size.width - width - 48, y: size.height - height - 72, width, height, url: sig.url, png: sig.png });
  };

  /** Copy the selected item onto every other page at the same spot (initials on each page, a stamp…). */
  const copyToAllPages = () => {
    if (!current) return;
    const copies = Array.from({ length: total }, (_, i) => i + 1)
      .filter((p) => p !== current.page && !items.some((i) => i.page === p && i.kind === current.kind && Math.abs(i.x - current.x) < 1 && Math.abs(i.y - current.y) < 1))
      .map((p) => ({ ...current, id: newId(), page: p }) as Placed);
    change([...items, ...copies]);
    toast.success(`Copied to ${copies.length} page${copies.length === 1 ? "" : "s"}.`);
  };

  const remove = () => {
    if (!current) return;
    change(items.filter((i) => i.id !== current.id));
    setSelected(null);
  };

  const save = async () => {
    setBusy(true);
    try {
      const bytes = await applyPlaced(pdf.bytes, items);
      setResult([{ name: `${baseName(pdf.file)}-${mode === "sign" ? "signed" : "edited"}.pdf`, blob: pdfBlob(bytes) }]);
      track("pdf_generated");
      toast.success(mode === "sign" ? "Your signed PDF is ready." : "Your edited PDF is ready.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save the PDF.");
    } finally {
      setBusy(false);
    }
  };

  const pagesWithItems = new Set(items.map((i) => i.page));

  return (
    <div className="space-y-6">
      <FileBar file={pdf.file} pages={total} onReset={reset} disabled={busy} />
      {result && <PdfResult files={result} onReset={() => setResult(null)} resetLabel="Keep editing" />}
      <PdfLayout
        main={
          <>
            <PageNav page={page} total={total} onChange={(p) => { setPage(p); setSelected(null); }} marks={pagesWithItems} />
            <div className="mx-auto max-w-3xl">
              <PlacementEditor pdf={pdf} page={page} items={items} selected={selected} onSelect={setSelected} onChange={change} />
            </div>
            <p className="text-center text-sm text-muted-foreground">Drag to move · drag the corner to resize · arrow keys nudge the selected item</p>
          </>
        }
        aside={
          <>
            {mode === "sign" ? (
              signature ? (
                <div className="space-y-3">
                  <h2 className="text-base font-semibold">Your signature</h2>
                  {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
                  <img src={signature.url} alt="Your signature" className="max-h-24 w-full rounded-lg border bg-white object-contain p-2" />
                  <div className="grid grid-cols-2 gap-2">
                    <Button className="h-10" onClick={() => placeSignature(signature)}>
                      <PenLine /> Place on page {page}
                    </Button>
                    <Button variant="outline" className="h-10" onClick={() => setSignature(null)}>
                      New signature
                    </Button>
                  </div>
                  <Button variant="outline" className="h-10 w-full" onClick={() => addText(new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }), 12)}>
                    <CalendarDays /> Add today&apos;s date
                  </Button>
                  <Button variant="ghost" className="h-9 w-full" onClick={() => addText("Your name", 12)}>
                    <Type /> Add text (name, place…)
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <h2 className="text-base font-semibold">Create your signature</h2>
                  <SignaturePad
                    onCreate={(sig) => {
                      urls.current.push(sig.url);
                      setSignature(sig);
                      placeSignature(sig);
                    }}
                  />
                </div>
              )
            ) : (
              <div className="space-y-3">
                <h2 className="text-base font-semibold">Add to page {page}</h2>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="h-10" onClick={() => addText()}>
                    <Type /> Text
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10"
                    onClick={() => add({ id: newId(), page, kind: "box", x: 60, y: 80, width: 160, height: 24, color: "#ffffff" })}
                  >
                    <Square /> White-out
                  </Button>
                </div>
                <FileDropzone compact rules={{ accept: IMAGE_MIMES, maxBytes: 15 * 1024 * 1024, maxCount: 1 }} onFiles={addImage} title="Add a picture or logo" />
              </div>
            )}

            {current && (
              <div className="space-y-3 border-t pt-4">
                <h3 className="text-sm font-semibold">{current.kind === "text" ? "Selected text" : current.kind === "image" ? "Selected picture" : "Selected box"}</h3>
                {current.kind === "text" && (
                  <>
                    <TextAreaField label="Text" value={current.text} onChange={(text) => patch({ text })} rows={2} />
                    <div className="grid grid-cols-2 gap-2">
                      <SelectField<TextFont>
                        label="Font"
                        value={current.font}
                        onChange={(font) => patch({ font })}
                        options={[
                          { value: "helvetica", label: "Sans" },
                          { value: "times", label: "Serif" },
                          { value: "courier", label: "Mono" },
                        ]}
                      />
                      <NumberField label="Size" value={String(current.size)} onChange={(v) => Number(v) > 0 && patch({ size: Math.min(144, Number(v)) })} suffix="pt" />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <CheckboxField label="Bold" checked={current.bold} onChange={(bold) => patch({ bold })} />
                      <ColorInput value={current.color} onChange={(color) => patch({ color })} />
                    </div>
                  </>
                )}
                {current.kind === "box" && <ColorInput value={current.color} onChange={(color) => patch({ color })} label="Box colour" />}
                <div className="grid grid-cols-2 gap-2">
                  {total > 1 && (
                    <Button variant="outline" className="h-9" onClick={copyToAllPages}>
                      <Copy /> All pages
                    </Button>
                  )}
                  <Button variant="outline" className="h-9 text-destructive" onClick={remove}>
                    <Trash2 /> Remove
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2 border-t pt-4">
              <p className="text-sm text-muted-foreground">
                {items.length === 0 ? "Nothing added yet." : `${items.length} item${items.length === 1 ? "" : "s"} on ${pagesWithItems.size} page${pagesWithItems.size === 1 ? "" : "s"}.`}
              </p>
              <ActionButton busy={busy} busyLabel="Saving…" disabled={items.length === 0} onClick={save}>
                {mode === "sign" ? "Save signed PDF" : "Save PDF"}
              </ActionButton>
            </div>
          </>
        }
      />
      {mode === "edit" && (
        <p className="text-sm text-muted-foreground">
          <ImagePlus className="mr-1 inline size-4 align-text-bottom" aria-hidden />
          Tip: to change existing text, cover it with a white-out box and type the new text on top.
        </p>
      )}
    </div>
  );
}

function ColorInput({ value, onChange, label = "Colour" }: { value: string; onChange: (value: string) => void; label?: string }) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium">
      {label}
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-input bg-background p-0.5" />
    </label>
  );
}
