"use client";

import { useRef, useState } from "react";
import { Copy, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { IMAGE_MIMES, type AcceptedFile } from "@/lib/files/validation";
import { decodeImage } from "@/lib/image/process";
import { Button } from "@/components/ui/button";
import { FileDropzone, PrivacyNote } from "./file-dropzone";

type Color = { r: number; g: number; b: number };
const hex = ({ r, g, b }: Color) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
function hsl({ r, g, b }: Color) {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn), d = max - min;
  let h = 0;
  if (d) h = max === rn ? ((gn - bn) / d) % 6 : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
  h = Math.round(h * 60); if (h < 0) h += 360;
  const l = (max + min) / 2;
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  return `hsl(${h}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

export function ColorPicker() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [color, setColor] = useState<Color>({ r: 37, g: 99, b: 235 });
  const load = async ([item]: AcceptedFile[]) => {
    const image = await decodeImage(item.file);
    const el = canvas.current!;
    const scale = Math.min(1, 1200 / image.width, 700 / image.height);
    el.width = Math.round(image.width * scale); el.height = Math.round(image.height * scale);
    el.getContext("2d")!.drawImage(image, 0, 0, el.width, el.height); image.close(); setLoaded(true);
  };
  const values = [hex(color), `rgb(${color.r}, ${color.g}, ${color.b})`, hsl(color)];
  return <div className="space-y-6"><PrivacyNote />{!loaded && <FileDropzone rules={{ accept: IMAGE_MIMES, maxBytes: 25 * 1024 * 1024, maxCount: 1 }} onFiles={(files) => void load(files)} title="Choose an image" />}
    <div className={loaded ? "grid items-start gap-6 lg:grid-cols-[1fr_20rem]" : "hidden"}>
      <div className="space-y-3"><p className="text-sm text-muted-foreground">Click or tap anywhere on the image to sample that pixel.</p><canvas ref={canvas} className="max-h-[70vh] max-w-full cursor-crosshair rounded-xl ring-1 ring-foreground/10" onClick={(event) => { const el = canvas.current!; const rect = el.getBoundingClientRect(); const x = Math.min(el.width - 1, Math.floor((event.clientX - rect.left) * el.width / rect.width)); const y = Math.min(el.height - 1, Math.floor((event.clientY - rect.top) * el.height / rect.height)); const [r, g, b] = el.getContext("2d")!.getImageData(x, y, 1, 1).data; setColor({ r, g, b }); }} /></div>
      <aside className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 lg:sticky lg:top-32"><div className="h-32 rounded-lg ring-1 ring-foreground/10" style={{ background: hex(color) }} /><div className="space-y-2">{values.map((value) => <button key={value} className="flex w-full items-center justify-between rounded-lg bg-muted px-3 py-3 text-left font-mono text-sm" onClick={() => { void navigator.clipboard.writeText(value); toast.success("Color copied."); }}>{value}<Copy className="size-4" /></button>)}</div><label className="flex items-center justify-between text-sm font-medium">Spectrum<input type="color" value={hex(color)} onChange={(e) => { const v = e.target.value; setColor({ r: parseInt(v.slice(1, 3), 16), g: parseInt(v.slice(3, 5), 16), b: parseInt(v.slice(5, 7), 16) }); }} className="h-10 w-20 cursor-pointer" /></label><Button variant="ghost" className="w-full" onClick={() => setLoaded(false)}><RotateCcw /> Choose another image</Button></aside>
    </div></div>;
}
