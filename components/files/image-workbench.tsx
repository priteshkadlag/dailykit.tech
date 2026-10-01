"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, FolderOpen, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { downloadBlob, zipBlobs } from "@/lib/files/download";
import { formatBytes, IMAGE_MIMES, validateFiles, withExtension, type AcceptedFile } from "@/lib/files/validation";
import { parseNumber } from "@/lib/format";
import { decodeImage, OUTPUT_EXT, renderImage, type OutputMime } from "@/lib/image/process";
import { pngsToIco } from "@/lib/image/ico";
import { Button } from "@/components/ui/button";
import { NumberField, SelectField, TextField } from "@/components/shared/form-fields";
import { FileDropzone, PrivacyNote } from "./file-dropzone";

const RULES = { accept: IMAGE_MIMES, maxBytes: 25 * 1024 * 1024, maxCount: 20 };
const ZIP_LIMIT = 200 * 1024 * 1024;
const FORMATS = [
  { value: "image/jpeg", label: "JPEG" }, { value: "image/png", label: "PNG" }, { value: "image/webp", label: "WEBP" },
] as const;

export function ImageBatchProcessor({ bulk = false }: { bulk?: boolean }) {
  const folderInput = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<AcceptedFile[]>([]);
  const [format, setFormat] = useState<OutputMime>("image/jpeg");
  const [maxWidth, setMaxWidth] = useState(bulk ? "1920" : "");
  const [quality, setQuality] = useState("90");
  const [maxFileSize, setMaxFileSize] = useState("");
  const [fileName, setFileName] = useState("");
  const [lastOutputs, setLastOutputs] = useState<{ name: string; size: number }[]>([]);
  const [busy, setBusy] = useState(false);
  const add = useCallback((next: AcceptedFile[]) => setFiles((current) => bulk ? [...current, ...next].slice(0, RULES.maxCount) : next.slice(0, 1)), [bulk]);

  const acceptRaw = useCallback(async (raw: File[]) => {
    const { accepted, rejected } = await validateFiles(raw, RULES, files.length);
    add(accepted);
    if (rejected.length) toast.error(`${rejected.length} unsupported or excess file${rejected.length === 1 ? " was" : "s were"} skipped.`);
  }, [add, files.length]);

  const expandArchives = async (raw: File[]) => {
    const expanded: File[] = [];
    for (const file of raw) {
      if (!/\.zip$/i.test(file.name) && file.type !== "application/zip") { expanded.push(file); continue; }
      const { unzipSync } = await import("fflate");
      const entries = unzipSync(new Uint8Array(await file.arrayBuffer()));
      let total = 0;
      for (const [name, bytes] of Object.entries(entries)) {
        if (name.endsWith("/") || expanded.length >= 100) continue;
        total += bytes.byteLength;
        if (total > ZIP_LIMIT) throw new Error("That ZIP expands beyond the 200 MB safety limit.");
        if (/\.(png|jpe?g|webp)$/i.test(name)) expanded.push(new File([bytes as BlobPart], name.split("/").pop() || "image"));
      }
    }
    if (!expanded.length) throw new Error("No supported PNG, JPEG, or WEBP images were found.");
    return expanded;
  };

  useEffect(() => {
    if (!bulk) return;
    const onPaste = (event: ClipboardEvent) => {
      const images = [...(event.clipboardData?.files ?? [])].filter((file) => file.type.startsWith("image/"));
      if (images.length) { event.preventDefault(); void acceptRaw(images); }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [acceptRaw, bulk]);

  const process = async () => {
    if (!files.length) return;
    setBusy(true);
    try {
      const outputs: { name: string; blob: Blob }[] = [];
      let limitMissed = false;
      for (let index = 0; index < files.length; index++) {
        const item = files[index];
        const image = await decodeImage(item.file);
        const requested = parseNumber(maxWidth);
        let width = Number.isFinite(requested) && requested > 0 ? Math.round(requested) : image.width;
        let height = Math.max(1, Math.round(image.height * width / image.width));
        let outputQuality = Math.min(1, Math.max(0.1, Number(quality) / 100 || 0.9));
        const requestedKb = parseNumber(maxFileSize);
        const limit = Number.isFinite(requestedKb) && requestedKb > 0 ? requestedKb * 1024 : null;
        let out = await renderImage(image, { target: { width, height }, type: format, quality: outputQuality, background: format === "image/jpeg" ? "#ffffff" : null });
        for (let attempt = 0; limit && out.blob.size > limit && attempt < 12; attempt++) {
          if (format !== "image/png" && outputQuality > 0.35) outputQuality = Math.max(0.35, outputQuality - 0.1);
          else { width = Math.max(1, Math.round(width * 0.88)); height = Math.max(1, Math.round(height * 0.88)); }
          out = await renderImage(image, { target: { width, height }, type: format, quality: outputQuality, background: format === "image/jpeg" ? "#ffffff" : null });
        }
        if (limit && out.blob.size > limit) limitMissed = true;
        image.close();
        const customBase = fileName.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
        const outputName = customBase ? `${customBase}${files.length > 1 ? `-${index + 1}` : ""}.${OUTPUT_EXT[out.type]}` : withExtension(item.file.name, OUTPUT_EXT[out.type]);
        outputs.push({ name: outputName, blob: out.blob });
      }
      setLastOutputs(outputs.map((output) => ({ name: output.name, size: output.blob.size })));
      if (outputs.length === 1) downloadBlob(outputs[0].blob, outputs[0].name);
      else downloadBlob(await zipBlobs(outputs), "processed-images.zip");
      if (limitMissed) toast.warning("Some images reached the safe dimension limit before the requested file size.");
      else toast.success(`${outputs.length} image${outputs.length === 1 ? "" : "s"} processed.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Couldn't process these images."); }
    finally { setBusy(false); }
  };

  return <div className="space-y-6">
    <PrivacyNote />
    {bulk && <section className="space-y-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <h2 className="text-lg font-semibold">Select Multiple Images</h2>
      <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
        <li>• Browse and select multiple images to resize, convert, or compress.</li>
        <li>• Drag and drop image files or complete image folders.</li>
        <li>• Select or drop a ZIP containing images.</li>
        <li>• Paste an image from the clipboard with Ctrl/⌘ + V.</li>
      </ul>
    </section>}
    <FileDropzone rules={{ ...RULES, maxCount: bulk ? 20 : 1 }} alreadySelected={files.length} onFiles={add} title={bulk ? "Choose images, a folder, or a ZIP" : "Choose an image"} preprocessFiles={bulk ? expandArchives : undefined} acceptExtras={bulk ? [".zip", "application/zip"] : []} allowDirectories={bulk} />
    {bulk && <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
      <Button variant="outline" onClick={() => folderInput.current?.click()} disabled={files.length >= RULES.maxCount}><FolderOpen /> Browse image folder</Button>
      <input ref={folderInput} type="file" multiple accept="image/png,image/jpeg,image/webp" className="sr-only" {...({ webkitdirectory: "", directory: "" } as React.InputHTMLAttributes<HTMLInputElement>)} onChange={(event) => { void acceptRaw([...(event.target.files ?? [])]); event.target.value = ""; }} />
      <span className="text-muted-foreground">or paste an image with <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono">Ctrl/⌘ + V</kbd></span>
    </div>}
    {files.length > 0 && <div className="grid gap-6 rounded-xl bg-card p-5 ring-1 ring-foreground/10 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-2"><h2 className="font-semibold">{files.length} image{files.length === 1 ? "" : "s"} ready</h2>{files.map(({ file }) => <div key={`${file.name}-${file.size}`} className="flex justify-between gap-3 rounded-lg bg-muted px-3 py-2 text-sm"><span className="truncate">{file.name}</span><span className="shrink-0 text-muted-foreground">{formatBytes(file.size)}</span></div>)}</div>
      <div className="space-y-4">
        <SelectField label="Output format" value={format} onChange={setFormat} options={[...FORMATS]} />
        <NumberField label={bulk ? "Resize width" : "Optional resize width"} suffix="px" hint="Leave blank to keep original size" value={maxWidth} onChange={setMaxWidth} />
        {format !== "image/png" && <NumberField label="Quality" suffix="%" value={quality} onChange={setQuality} />}
        <NumberField label="Maximum file size" suffix="KB" hint="Optional; images are reduced until they fit" value={maxFileSize} onChange={setMaxFileSize} />
        <TextField label="File name" hint={bulk ? "Used as a prefix: name-1, name-2…" : "Extension is added automatically"} placeholder={bulk ? "e.g. product" : "e.g. converted-image"} value={fileName} onChange={setFileName} />
        <Button className="h-11 w-full" onClick={() => void process()} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Download />} {bulk ? "Process & download ZIP" : "Convert & download"}</Button>
        <Button variant="ghost" className="w-full" onClick={() => setFiles([])} disabled={busy}><RotateCcw /> Clear</Button>
      </div>
    </div>}
    {lastOutputs.length > 0 && <section className="space-y-2 rounded-xl bg-card p-5 ring-1 ring-foreground/10"><h2 className="font-semibold">Output file size</h2>{lastOutputs.map((output) => <div key={output.name} className="flex items-center justify-between gap-3 text-sm"><span className="truncate">{output.name}</span><span className="shrink-0 font-medium tabular-nums">{formatBytes(output.size)}</span></div>)}</section>}
  </div>;
}

const ICON_SIZES = [16, 32, 48, 64, 128, 256];
async function iconLayers(file: File) {
  const image = await decodeImage(file);
  const layers = await Promise.all(ICON_SIZES.map(async (size) => ({ size, blob: (await renderImage(image, { target: { width: size, height: size }, mode: "contain", type: "image/png" })).blob })));
  image.close();
  return layers;
}

export function IconConverter({ favicon = false }: { favicon?: boolean }) {
  const [source, setSource] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const generate = async () => {
    if (!source) return;
    setBusy(true);
    try {
      const layers = await iconLayers(source);
      const ico = await pngsToIco(layers);
      if (!favicon) downloadBlob(ico, withExtension(source.name, "ico"));
      else {
        const appleSource = await decodeImage(source);
        const apple = (await renderImage(appleSource, { target: { width: 180, height: 180 }, mode: "contain", type: "image/png" })).blob;
        appleSource.close();
        const html = '<link rel="icon" href="/favicon.ico" sizes="any">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n';
        downloadBlob(await zipBlobs([{ name: "favicon.ico", blob: ico }, { name: "apple-touch-icon.png", blob: apple }, { name: "favicon-html.txt", blob: new Blob([html], { type: "text/plain" }) }]), "favicon-package.zip");
      }
      toast.success(favicon ? "Favicon package created." : "Windows icon created.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Couldn't create the icon."); }
    finally { setBusy(false); }
  };
  return <div className="space-y-6"><PrivacyNote /><FileDropzone rules={{ ...RULES, maxCount: 1 }} onFiles={([file]) => setSource(file.file)} title="Choose a square image" />{source && <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10"><div><p className="font-semibold">{source.name}</p><p className="text-sm text-muted-foreground">Creates 16, 32, 48, 64, 128 and 256 px icon layers.</p></div><Button className="h-11" onClick={() => void generate()} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Download />} {favicon ? "Download favicon package" : "Download ICO"}</Button></div>}</div>;
}
