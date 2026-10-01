"use client";

import { useEffect, useState } from "react";
import { ScanSearch } from "lucide-react";
import { toast } from "sonner";
import { track } from "@/lib/analytics/client";
import { IMAGE_MIMES, type AcceptedFile } from "@/lib/files/validation";
import { imageToPng, textToPng } from "@/lib/pdf/browser";
import { formatPageNumber, isStandardFontText, MM, NUMBER_FORMATS, type NumberFormat, type NumberPosition } from "@/lib/pdf/edit-helpers";
import type { Stamp } from "@/lib/pdf/edit";
import { pdfEdit } from "@/lib/pdf/lazy";
import { renderPageCanvas } from "@/lib/pdf/pdf-render";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CheckboxField, NumberField, SegmentedControl, SelectField, TextField } from "@/components/shared/form-fields";
import { FileDropzone } from "@/components/files/file-dropzone";
import { ActionButton, baseName, FileBar, pdfBlob, PdfLayout, PdfPicker, PdfResult, PageRangeField, usePageRange, type OutputFile } from "./pdf-shell";
import { PageNav, PageView, pct, previewFontSize } from "./page-view";
import { FONT_CSS } from "./placement-editor";
import { usePdf, type LoadedPdf } from "./use-pdf";

export type StampMode = "numbers" | "watermark" | "crop";

export function StampPdf({ mode }: { mode: StampMode }) {
  const { pdf, loading, open, reset } = usePdf();
  if (!pdf) return <PdfPicker loading={loading} onFile={open} />;
  const props = { key: pdf.file.name + pdf.file.lastModified, pdf, reset };
  return mode === "numbers" ? <PageNumbers {...props} /> : mode === "watermark" ? <Watermark {...props} /> : <Crop {...props} />;
}

/** Shared frame: page preview (with overlay) on the left, settings on the right, result on top. */
function Frame({
  pdf,
  reset,
  busy,
  result,
  onResultReset,
  page,
  setPage,
  overlay,
  children,
}: {
  pdf: LoadedPdf;
  reset: () => void;
  busy: boolean;
  result: OutputFile[] | null;
  onResultReset: () => void;
  page: number;
  setPage: (p: number) => void;
  overlay: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <FileBar file={pdf.file} pages={pdf.doc.numPages} onReset={reset} disabled={busy} />
      {result && <PdfResult files={result} onReset={onResultReset} resetLabel="Change settings" />}
      <PdfLayout
        main={
          <>
            <PageNav page={page} total={pdf.doc.numPages} onChange={setPage} />
            <div className="mx-auto max-w-xl">
              <PageView doc={pdf.doc} page={page} size={pdf.sizes[page - 1]}>
                {overlay}
              </PageView>
            </div>
            <p className="text-center text-xs text-muted-foreground">Preview of page {page}</p>
          </>
        }
        aside={children}
      />
    </div>
  );
}

async function run(setBusy: (b: boolean) => void, setResult: (r: OutputFile[]) => void, name: string, make: () => Promise<Uint8Array>) {
  setBusy(true);
  try {
    setResult([{ name, blob: pdfBlob(await make()) }]);
    track("pdf_generated");
    toast.success("Your PDF is ready.");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Couldn't process this PDF.");
  } finally {
    setBusy(false);
  }
}

// ---------------------------------------------------------------- page numbers

const POSITIONS: { value: NumberPosition; label: string }[] = [
  { value: "top-left", label: "Top left" },
  { value: "top-center", label: "Top centre" },
  { value: "top-right", label: "Top right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-center", label: "Bottom centre" },
  { value: "bottom-right", label: "Bottom right" },
];

function PageNumbers({ pdf, reset }: { pdf: LoadedPdf; reset: () => void }) {
  const total = pdf.doc.numPages;
  const [position, setPosition] = useState<NumberPosition>("bottom-center");
  const [format, setFormat] = useState<NumberFormat>("page-n-of-total");
  const [startAt, setStartAt] = useState("1");
  const [fontSize, setFontSize] = useState("11");
  const [margin, setMargin] = useState("10");
  const range = usePageRange(total);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OutputFile[] | null>(null);
  const changed = () => setResult(null);

  const start = Math.max(0, Math.floor(Number(startAt)) || 0);
  const size = Math.min(48, Math.max(6, Number(fontSize) || 11));
  const marginPt = Math.min(60, Math.max(0, Number(margin) || 0)) * MM;
  const numbered = range.error ? [] : range.pages;
  const index = numbered.indexOf(page);
  const label = index >= 0 ? formatPageNumber(format, start + index, start + numbered.length - 1) : null;
  const pageSize = pdf.sizes[page - 1];
  const [vertical, horizontal] = position.split("-");

  return (
    <Frame
      pdf={pdf}
      reset={reset}
      busy={busy}
      result={result}
      onResultReset={() => setResult(null)}
      page={page}
      setPage={setPage}
      overlay={
        label && (
          <span
            className="absolute whitespace-nowrap text-[#222]"
            style={{
              fontFamily: FONT_CSS.helvetica,
              fontSize: previewFontSize(size, pageSize.width),
              lineHeight: 1,
              [vertical === "top" ? "top" : "bottom"]: pct(marginPt, pageSize.height),
              ...(horizontal === "center" ? { left: "50%", transform: "translateX(-50%)" } : { [horizontal]: pct(marginPt, pageSize.width) }),
            }}
          >
            {label}
          </span>
        )
      }
    >
      <h2 className="text-base font-semibold">Page number settings</h2>
      <div className="space-y-1.5">
        <div className="text-sm font-medium" id="pn-position">Position</div>
        <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-labelledby="pn-position">
          {POSITIONS.map((p) => (
            <button
              key={p.value}
              type="button"
              role="radio"
              aria-checked={position === p.value}
              aria-label={p.label}
              title={p.label}
              onClick={() => { setPosition(p.value); changed(); }}
              className={cn(
                "flex h-10 items-center rounded-md border px-2 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                p.value.startsWith("top") ? "items-start pt-1.5" : "items-end pb-1.5",
                p.value.endsWith("left") ? "justify-start" : p.value.endsWith("right") ? "justify-end" : "justify-center",
                position === p.value ? "border-primary bg-accent" : "border-border",
              )}
            >
              <span className={cn("h-1.5 w-4 rounded-full", position === p.value ? "bg-primary" : "bg-muted-foreground/40")} />
            </button>
          ))}
        </div>
      </div>
      <SelectField<NumberFormat> label="Format" value={format} onChange={(v) => { setFormat(v); changed(); }} options={Object.entries(NUMBER_FORMATS).map(([value, label]) => ({ value: value as NumberFormat, label }))} />
      <div className="grid grid-cols-3 gap-2">
        <NumberField label="Start at" value={startAt} onChange={(v) => { setStartAt(v); changed(); }} />
        <NumberField label="Size" value={fontSize} onChange={(v) => { setFontSize(v); changed(); }} suffix="pt" />
        <NumberField label="Margin" value={margin} onChange={(v) => { setMargin(v); changed(); }} suffix="mm" />
      </div>
      <PageRangeField range={range} total={total} label="Pages to number" onChange={changed} />
      <ActionButton
        busy={busy}
        busyLabel="Adding numbers…"
        disabled={!!range.error}
        onClick={() => run(setBusy, setResult, `${baseName(pdf.file)}-numbered.pdf`, async () => (await pdfEdit()).addPageNumbers(pdf.bytes, { pages: range.pages, position, format, startAt: start, fontSize: size, marginPt }))}
      >
        Add page numbers
      </ActionButton>
    </Frame>
  );
}

// ---------------------------------------------------------------- watermark

function Watermark({ pdf, reset }: { pdf: LoadedPdf; reset: () => void }) {
  const total = pdf.doc.numPages;
  const [kind, setKind] = useState<"text" | "image">("text");
  const [text, setText] = useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = useState("60");
  const [bold, setBold] = useState(true);
  const [color, setColor] = useState("#d32f2f");
  const [opacity, setOpacity] = useState(25);
  const [angle, setAngle] = useState(45);
  const [layout, setLayout] = useState<"center" | "tile">("center");
  const [logo, setLogo] = useState<{ bytes: Uint8Array; url: string; ratio: number } | null>(null);
  const [logoWidth, setLogoWidth] = useState(40);
  const range = usePageRange(total);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OutputFile[] | null>(null);
  const changed = () => setResult(null);

  useEffect(() => () => { if (logo) URL.revokeObjectURL(logo.url); }, [logo]);

  const size = Math.min(200, Math.max(8, Number(fontSize) || 60));
  const pageSize = pdf.sizes[page - 1];

  /** Centres of each copy on a page: one in the middle, or a 3 × 4 grid. */
  const spots = (w: number, h: number) =>
    layout === "center" ? [{ x: w / 2, y: h / 2 }] : Array.from({ length: 12 }, (_, i) => ({ x: (((i % 3) + 0.5) / 3) * w, y: ((Math.floor(i / 3) + 0.5) / 4) * h }));

  const pickLogo = async ([f]: AcceptedFile[]) => {
    try {
      const png = await imageToPng(f.file, 1600);
      setLogo({ bytes: png.bytes, url: URL.createObjectURL(new Blob([png.bytes.slice().buffer as ArrayBuffer], { type: "image/png" })), ratio: png.width / png.height });
      changed();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't read this image.");
    }
  };

  const make = async () => {
    const stamps: Stamp[] = [];
    const scaled = layout === "tile" ? 0.45 : 1;
    // Non-Latin text (e.g. Hindi) is drawn as a picture so every script works.
    const textImage = kind === "text" && !isStandardFontText(text) ? await textToPng(text, { fontFamily: FONT_CSS.helvetica, sizePt: size * scaled, color, bold }) : null;
    for (const p of range.pages) {
      const { width: w, height: h } = pdf.sizes[p - 1];
      for (const spot of spots(w, h)) {
        if (kind === "text" && !textImage) {
          stamps.push({ kind: "text", page: p, x: spot.x, y: spot.y, anchor: "center", text, size: size * scaled, color, bold, opacity: opacity / 100, angle });
        } else {
          const img = kind === "image" ? logo! : { bytes: textImage!.bytes, ratio: textImage!.widthPt / textImage!.heightPt };
          const width = kind === "image" ? ((w * logoWidth) / 100) * scaled : textImage!.widthPt;
          const height = width / img.ratio;
          stamps.push({ kind: "image", page: p, image: img.bytes, x: spot.x - width / 2, y: spot.y - height / 2, width, height, opacity: opacity / 100, angle });
        }
      }
    }
    return (await pdfEdit()).applyStamps(pdf.bytes, stamps);
  };

  const onPage = !range.error && range.pages.includes(page);
  const scaled = layout === "tile" ? 0.45 : 1;

  return (
    <Frame
      pdf={pdf}
      reset={reset}
      busy={busy}
      result={result}
      onResultReset={() => setResult(null)}
      page={page}
      setPage={setPage}
      overlay={
        onPage &&
        spots(pageSize.width, pageSize.height).map((spot, i) => (
          <div
            key={i}
            className="pointer-events-none absolute whitespace-pre"
            style={{
              left: pct(spot.x, pageSize.width),
              top: pct(spot.y, pageSize.height),
              transform: `translate(-50%, -50%) rotate(${-angle}deg)`,
              opacity: opacity / 100,
              ...(kind === "text"
                ? { color, fontFamily: FONT_CSS.helvetica, fontWeight: bold ? 700 : 400, fontSize: previewFontSize(size * scaled, pageSize.width), lineHeight: 1.2 }
                : { width: pct(((pageSize.width * logoWidth) / 100) * scaled, pageSize.width) }),
            }}
          >
            {kind === "text" ? text : logo && (
              // eslint-disable-next-line @next/next/no-img-element -- local object URL
              <img src={logo.url} alt="" className="w-full" />
            )}
          </div>
        ))
      }
    >
      <h2 className="text-base font-semibold">Watermark settings</h2>
      <SegmentedControl label="Watermark" hideLabel value={kind} onChange={(v) => { setKind(v); changed(); }} options={[{ value: "text", label: "Text" }, { value: "image", label: "Image / logo" }]} />
      {kind === "text" ? (
        <>
          <TextField label="Text" value={text} onChange={(v) => { setText(v); changed(); }} maxLength={80} />
          <div className="grid grid-cols-2 items-end gap-2">
            <NumberField label="Size" value={fontSize} onChange={(v) => { setFontSize(v); changed(); }} suffix="pt" />
            <label className="flex h-11 items-center gap-2 text-sm font-medium">
              Colour
              <input type="color" value={color} onChange={(e) => { setColor(e.target.value); changed(); }} className="h-9 w-12 cursor-pointer rounded border border-input bg-background p-0.5" />
            </label>
          </div>
          <CheckboxField label="Bold" checked={bold} onChange={(v) => { setBold(v); changed(); }} />
        </>
      ) : (
        <>
          {logo ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
              <img src={logo.url} alt="Selected logo" className="size-14 rounded border bg-white object-contain" />
              <Button variant="outline" className="h-9" onClick={() => { setLogo(null); changed(); }}>Change image</Button>
            </div>
          ) : (
            <FileDropzone compact rules={{ accept: IMAGE_MIMES, maxBytes: 10 * 1024 * 1024, maxCount: 1 }} onFiles={pickLogo} title="Choose a logo or image" />
          )}
          <Slider label="Width" value={logoWidth} min={5} max={100} suffix="% of page" onChange={(v) => { setLogoWidth(v); changed(); }} />
        </>
      )}
      <Slider label="Opacity" value={opacity} min={5} max={100} suffix="%" onChange={(v) => { setOpacity(v); changed(); }} />
      <Slider label="Rotation" value={angle} min={-90} max={90} suffix="°" onChange={(v) => { setAngle(v); changed(); }} />
      <SegmentedControl label="Layout" value={layout} onChange={(v) => { setLayout(v); changed(); }} options={[{ value: "center", label: "Centre" }, { value: "tile", label: "Repeat" }]} />
      <PageRangeField range={range} total={total} onChange={changed} />
      <ActionButton busy={busy} busyLabel="Adding watermark…" disabled={!!range.error || (kind === "text" ? !text.trim() : !logo)} onClick={() => run(setBusy, setResult, `${baseName(pdf.file)}-watermarked.pdf`, make)}>
        Add watermark
      </ActionButton>
    </Frame>
  );
}

function Slider({ label, value, min, max, suffix, onChange }: { label: string; value: number; min: number; max: number; suffix: string; onChange: (v: number) => void }) {
  return (
    <label className="block space-y-1.5">
      <span className="flex justify-between text-sm font-medium">
        {label}
        <span className="text-muted-foreground tabular-nums">
          {value}
          {suffix}
        </span>
      </span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-primary" />
    </label>
  );
}

// ---------------------------------------------------------------- crop

type Side = "top" | "right" | "bottom" | "left";
const SIDES: Side[] = ["top", "right", "bottom", "left"];

function Crop({ pdf, reset }: { pdf: LoadedPdf; reset: () => void }) {
  const total = pdf.doc.numPages;
  const [margins, setMargins] = useState<Record<Side, string>>({ top: "10", right: "10", bottom: "10", left: "10" });
  const [linked, setLinked] = useState(true);
  const range = usePageRange(total);
  const [page, setPage] = useState(1);
  const [detecting, setDetecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OutputFile[] | null>(null);

  const mm = (side: Side) => Math.max(0, Number(margins[side]) || 0);
  const pageSize = pdf.sizes[page - 1];
  const set = (side: Side, value: string) => {
    setMargins((m) => (linked ? { top: value, right: value, bottom: value, left: value } : { ...m, [side]: value }));
    setResult(null);
  };

  /** Find the blank border around the content of the previewed page. */
  const detect = async () => {
    setDetecting(true);
    try {
      const { canvas, width, height } = await renderPageCanvas(pdf.doc, page, 50);
      const data = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
      let [top, left, right, bottom] = [canvas.height, canvas.width, -1, -1];
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          if (data[i] < 235 || data[i + 1] < 235 || data[i + 2] < 235) {
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
            left = Math.min(left, x);
            right = Math.max(right, x);
          }
        }
      }
      if (right < 0) {
        toast.info("This page looks blank — nothing to detect.");
        return;
      }
      const toMm = (px: number, total: number, pts: number) => Math.max(0, Math.floor(((px / total) * pts) / MM) - 2);
      setLinked(false);
      setMargins({
        top: String(toMm(top, canvas.height, height)),
        bottom: String(toMm(canvas.height - bottom - 1, canvas.height, height)),
        left: String(toMm(left, canvas.width, width)),
        right: String(toMm(canvas.width - right - 1, canvas.width, width)),
      });
      setResult(null);
      canvas.width = canvas.height = 0;
    } finally {
      setDetecting(false);
    }
  };

  const shade = "absolute bg-foreground/45";
  const [t, r, b, l] = SIDES.map((s) => mm(s) * MM);
  return (
    <Frame
      pdf={pdf}
      reset={reset}
      busy={busy}
      result={result}
      onResultReset={() => setResult(null)}
      page={page}
      setPage={setPage}
      overlay={
        !range.error && range.pages.includes(page) && (
          <>
            <div className={shade} style={{ left: 0, right: 0, top: 0, height: pct(t, pageSize.height) }} />
            <div className={shade} style={{ left: 0, right: 0, bottom: 0, height: pct(b, pageSize.height) }} />
            <div className={shade} style={{ left: 0, top: pct(t, pageSize.height), bottom: pct(b, pageSize.height), width: pct(l, pageSize.width) }} />
            <div className={shade} style={{ right: 0, top: pct(t, pageSize.height), bottom: pct(b, pageSize.height), width: pct(r, pageSize.width) }} />
            <div className="absolute border-2 border-dashed border-primary" style={{ left: pct(l, pageSize.width), right: pct(r, pageSize.width), top: pct(t, pageSize.height), bottom: pct(b, pageSize.height) }} />
          </>
        )
      }
    >
      <h2 className="text-base font-semibold">Trim margins</h2>
      <Button variant="outline" className="h-10 w-full" onClick={detect} disabled={detecting}>
        <ScanSearch /> {detecting ? "Detecting…" : "Detect white margins"}
      </Button>
      <CheckboxField label="Same on all sides" checked={linked} onChange={(v) => { setLinked(v); if (v) set("top", margins.top); }} />
      {linked ? (
        <NumberField label="Margin to remove" value={margins.top} onChange={(v) => set("top", v)} suffix="mm" />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {SIDES.map((s) => (
            <NumberField key={s} label={s[0].toUpperCase() + s.slice(1)} value={margins[s]} onChange={(v) => set(s, v)} suffix="mm" />
          ))}
        </div>
      )}
      <PageRangeField range={range} total={total} onChange={() => setResult(null)} />
      <p className="text-xs text-muted-foreground">The shaded area is removed. Cropping changes the page size; nothing is re-encoded.</p>
      <ActionButton
        busy={busy}
        busyLabel="Cropping…"
        disabled={!!range.error || SIDES.every((s) => mm(s) === 0)}
        onClick={() => run(setBusy, setResult, `${baseName(pdf.file)}-cropped.pdf`, async () => (await pdfEdit()).cropPages(pdf.bytes, range.pages, { top: t, right: r, bottom: b, left: l }))}
      >
        Crop PDF
      </ActionButton>
    </Frame>
  );
}
