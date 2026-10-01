"use client";

import { useEffect, useRef, useState } from "react";
import { Caveat, Dancing_Script, Sacramento } from "next/font/google";
import { Eraser } from "lucide-react";
import { toast } from "sonner";
import { canvasToPngBytes, textToPng, trimCanvas } from "@/lib/pdf/browser";
import { IMAGE_MIMES, type AcceptedFile } from "@/lib/files/validation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CheckboxField, SegmentedControl, TextField } from "@/components/shared/form-fields";
import { FileDropzone } from "@/components/files/file-dropzone";

const dancing = Dancing_Script({ subsets: ["latin"], weight: "600" });
const caveat = Caveat({ subsets: ["latin"], weight: "600" });
const sacramento = Sacramento({ subsets: ["latin"], weight: "400" });

const STYLES = [
  { id: "dancing", label: "Flowing", family: dancing.style.fontFamily },
  { id: "sacramento", label: "Elegant", family: sacramento.style.fontFamily },
  { id: "caveat", label: "Handwritten", family: caveat.style.fontFamily },
] as const;

const INKS = [
  { value: "#111111", label: "Black" },
  { value: "#1d3a8a", label: "Blue" },
];

export interface Signature {
  png: Uint8Array;
  /** Object URL of the PNG, for previews. */
  url: string;
  /** Natural aspect ratio (width ÷ height). */
  ratio: number;
}

type Mode = "draw" | "type" | "upload";

export function SignaturePad({ onCreate }: { onCreate: (signature: Signature) => void }) {
  const [mode, setMode] = useState<Mode>("draw");
  const [ink, setInk] = useState(INKS[0].value);
  const [name, setName] = useState("");
  const [style, setStyle] = useState<(typeof STYLES)[number]["id"]>("dancing");
  const [clearBackground, setClearBackground] = useState(true);
  const [upload, setUpload] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);

  // Size the drawing canvas for the screen's pixel density so strokes stay sharp.
  useEffect(() => {
    const c = canvas.current;
    if (!c || mode !== "draw") return;
    const ratio = Math.min(3, window.devicePixelRatio || 1);
    c.width = c.clientWidth * ratio;
    c.height = c.clientHeight * ratio;
    const ctx = c.getContext("2d")!;
    ctx.scale(ratio, ratio);
    setHasInk(false);
  }, [mode]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const stroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const from = drawing.current;
    if (!from) return;
    const to = point(e);
    const ctx = e.currentTarget.getContext("2d")!;
    ctx.strokeStyle = ink;
    ctx.lineWidth = Math.max(1.5, Math.min(3.5, 3.5 - Math.hypot(to.x - from.x, to.y - from.y) / 12));
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    drawing.current = to;
    setHasInk(true);
  };

  const clear = () => {
    const c = canvas.current;
    c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
  };

  const finish = async (png: Uint8Array, width: number, height: number) => {
    onCreate({ png, url: URL.createObjectURL(new Blob([png.slice().buffer as ArrayBuffer], { type: "image/png" })), ratio: width / height });
  };

  const create = async () => {
    setBusy(true);
    try {
      if (mode === "draw") {
        const trimmed = canvas.current && trimCanvas(canvas.current, 6);
        if (!trimmed) throw new Error("Draw your signature first.");
        await finish(await canvasToPngBytes(trimmed), trimmed.width, trimmed.height);
      } else if (mode === "type") {
        if (!name.trim()) throw new Error("Type your name first.");
        const family = STYLES.find((s) => s.id === style)!.family;
        const img = await textToPng(name.trim(), { fontFamily: family, sizePt: 40, color: ink, scale: 4 });
        await finish(img.bytes, img.widthPt, img.heightPt);
      } else {
        if (!upload) throw new Error("Choose a picture of your signature first.");
        const bitmap = await createImageBitmap(upload);
        const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
        const c = document.createElement("canvas");
        c.width = Math.round(bitmap.width * scale);
        c.height = Math.round(bitmap.height * scale);
        const ctx = c.getContext("2d")!;
        ctx.drawImage(bitmap, 0, 0, c.width, c.height);
        bitmap.close();
        if (clearBackground) {
          // Paper → transparent: light pixels fade out, ink stays.
          const data = ctx.getImageData(0, 0, c.width, c.height);
          const px = data.data;
          for (let i = 0; i < px.length; i += 4) {
            const light = (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114) / 255;
            px[i + 3] = light > 0.78 ? 0 : light > 0.55 ? Math.round(px[i + 3] * ((0.78 - light) / 0.23)) : px[i + 3];
          }
          ctx.putImageData(data, 0, 0);
        }
        const trimmed = trimCanvas(c, 4) ?? c;
        await finish(await canvasToPngBytes(trimmed), trimmed.width, trimmed.height);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't create the signature.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <SegmentedControl
        label="Signature"
        hideLabel
        value={mode}
        onChange={setMode}
        options={[
          { value: "draw", label: "Draw" },
          { value: "type", label: "Type" },
          { value: "upload", label: "Upload" },
        ]}
      />
      {mode !== "upload" && (
        <div className="flex items-center gap-2" role="radiogroup" aria-label="Ink colour">
          {INKS.map((c) => (
            <button
              key={c.value}
              type="button"
              role="radio"
              aria-checked={ink === c.value}
              aria-label={c.label}
              onClick={() => setInk(c.value)}
              className={cn("size-8 rounded-full ring-2 ring-offset-2 outline-none focus-visible:ring-ring", ink === c.value ? "ring-primary" : "ring-transparent")}
              style={{ background: c.value }}
            />
          ))}
        </div>
      )}
      {mode === "draw" && (
        <div className="space-y-2">
          <canvas
            ref={canvas}
            aria-label="Draw your signature here"
            className="h-40 w-full touch-none rounded-lg border border-dashed border-foreground/25 bg-white"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              drawing.current = point(e);
            }}
            onPointerMove={stroke}
            onPointerUp={() => (drawing.current = null)}
            onPointerCancel={() => (drawing.current = null)}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Sign with your finger, pen or mouse.</span>
            <Button variant="ghost" className="h-8" onClick={clear} disabled={!hasInk}>
              <Eraser /> Clear
            </Button>
          </div>
        </div>
      )}
      {mode === "type" && (
        <div className="space-y-3">
          <TextField label="Your name" value={name} onChange={setName} autoComplete="name" maxLength={60} />
          <div className="grid gap-2" role="radiogroup" aria-label="Signature style">
            {STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={style === s.id}
                onClick={() => setStyle(s.id)}
                className={cn(
                  "flex min-h-14 items-center justify-between gap-2 rounded-lg border bg-white px-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  style === s.id ? "border-primary ring-1 ring-primary" : "border-border",
                )}
              >
                <span className="truncate text-3xl" style={{ fontFamily: s.family, color: ink }}>
                  {name.trim() || "Your Name"}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {mode === "upload" && (
        <div className="space-y-3">
          <FileDropzone compact rules={{ accept: IMAGE_MIMES, maxBytes: 10 * 1024 * 1024, maxCount: 1 }} onFiles={([f]: AcceptedFile[]) => setUpload(f.file)} title={upload ? `Selected: ${upload.name}` : "Choose a signature photo"} />
          <CheckboxField label="Remove white background" checked={clearBackground} onChange={setClearBackground} hint="Best for a signature photographed on white paper." />
        </div>
      )}
      <Button className="h-11 w-full" onClick={create} disabled={busy || (mode === "draw" && !hasInk) || (mode === "type" && !name.trim()) || (mode === "upload" && !upload)}>
        Use this signature
      </Button>
    </div>
  );
}
