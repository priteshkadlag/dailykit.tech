"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { downloadBlob } from "@/lib/files/download";
import { GIF_MIMES, IMAGE_MIMES, withExtension, type AcceptedFile } from "@/lib/files/validation";
import { parseNumber } from "@/lib/format";
import { imagesToGif, transformGif, type GifInfo } from "@/lib/image/gif";
import { Button } from "@/components/ui/button";
import { NumberField } from "@/components/shared/form-fields";
import { FileDropzone, PrivacyNote } from "./file-dropzone";

export function GifResizer() {
  const [file, setFile] = useState<File | null>(null);
  const [width, setWidth] = useState("600");
  const [speed, setSpeed] = useState("1");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<GifInfo | null>(null);
  const run = async () => {
    if (!file) return; setBusy(true);
    try { const result = await transformGif(file, parseNumber(width), parseNumber(speed)); downloadBlob(result.blob, withExtension(file.name, "gif")); setInfo(result.info); toast.success("Animated GIF resized."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Couldn't resize this GIF."); } finally { setBusy(false); }
  };
  return <div className="space-y-6"><PrivacyNote /><FileDropzone rules={{ accept: GIF_MIMES, maxBytes: 40 * 1024 * 1024, maxCount: 1 }} onFiles={([item]) => setFile(item.file)} title="Choose an animated GIF" />{file && <div className="grid gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:grid-cols-2"><NumberField label="Output width" suffix="px" value={width} onChange={setWidth} /><NumberField label="Playback speed" suffix="×" hint="1 = original, 2 = twice as fast" value={speed} onChange={setSpeed} /><Button className="h-11 sm:col-span-2" onClick={() => void run()} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Download />} Resize animated GIF</Button>{info && <p className="text-sm text-muted-foreground sm:col-span-2">Created {info.width}×{info.height} · {info.frames} frames · {(info.duration / 1000).toFixed(1)} seconds</p>}</div>}</div>;
}

export function GifConverter() {
  const [files, setFiles] = useState<AcceptedFile[]>([]);
  const [width, setWidth] = useState("800");
  const [delay, setDelay] = useState("500");
  const [busy, setBusy] = useState(false);
  const run = async () => {
    if (!files.length) return; setBusy(true);
    try { const blob = await imagesToGif(files.map((item) => item.file), parseNumber(width), parseNumber(delay)); downloadBlob(blob, "animation.gif"); toast.success("Animated GIF created."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Couldn't create the GIF."); } finally { setBusy(false); }
  };
  return <div className="space-y-6"><PrivacyNote /><FileDropzone rules={{ accept: IMAGE_MIMES, maxBytes: 25 * 1024 * 1024, maxCount: 40 }} alreadySelected={files.length} onFiles={(next) => setFiles((current) => [...current, ...next])} title="Choose images for your GIF" />{files.length > 0 && <div className="grid gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:grid-cols-2"><p className="font-semibold sm:col-span-2">{files.length} frame{files.length === 1 ? "" : "s"} selected</p><NumberField label="GIF width" suffix="px" value={width} onChange={setWidth} /><NumberField label="Time per frame" suffix="ms" value={delay} onChange={setDelay} /><Button className="h-11 sm:col-span-2" onClick={() => void run()} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Download />} Create animated GIF</Button></div>}</div>;
}
