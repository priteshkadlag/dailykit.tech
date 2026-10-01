"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { downloadBlob, zipBlobs } from "@/lib/files/download";
import { ICO_MIMES } from "@/lib/files/validation";
import { readIco } from "@/lib/image/ico";
import { Button } from "@/components/ui/button";
import { FileDropzone, PrivacyNote } from "./file-dropzone";

type Layer = Awaited<ReturnType<typeof readIco>>[number];
export function IconEditor() {
  const [name, setName] = useState("icon");
  const [layers, setLayers] = useState<Layer[]>([]);
  const load = async (file: File) => { try { setLayers(await readIco(file)); setName(file.name.replace(/\.ico$/i, "")); } catch (error) { toast.error(error instanceof Error ? error.message : "Couldn't read this icon."); } };
  const pngLayers = layers.filter((layer) => layer.format === "PNG");
  const downloadLayers = async () => downloadBlob(await zipBlobs(pngLayers.map((layer, index) => ({ name: `${name}-${layer.width}x${layer.height}-${index + 1}.png`, blob: layer.blob }))), `${name}-layers.zip`);
  return <div className="space-y-6"><PrivacyNote /><FileDropzone rules={{ accept: ICO_MIMES, maxBytes: 25 * 1024 * 1024, maxCount: 1 }} onFiles={([item]) => void load(item.file)} title="Choose a Windows ICO file" />{layers.length > 0 && <section className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">{layers.length} icon layer{layers.length === 1 ? "" : "s"}</h2><p className="text-sm text-muted-foreground">Inspect dimensions, color depth, and embedded format.</p></div>{pngLayers.length > 0 && <Button onClick={() => void downloadLayers()}><Download /> Download PNG layers</Button>}</div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{layers.map((layer, index) => <div key={`${layer.width}-${layer.height}-${index}`} className="flex items-center gap-3 rounded-lg bg-muted p-3"><div className="flex size-12 items-center justify-center rounded bg-background text-xs font-semibold">{layer.format}</div><div><p className="font-medium">{layer.width} × {layer.height}</p><p className="text-xs text-muted-foreground">{layer.bits}-bit · {layer.format}</p></div></div>)}</div>{pngLayers.length !== layers.length && <p className="text-sm text-muted-foreground">Legacy BMP layers can be inspected here; PNG extraction is available for modern embedded layers.</p>}</section>}</div>;
}
