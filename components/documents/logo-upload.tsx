"use client";

import { useRef } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];
const MAX_INPUT_BYTES = 2 * 1024 * 1024;
const MAX_DIMENSION = 360;

/** Downscale to a small PNG data URL so it stays light in storage and in exported PDFs. */
async function toSmallDataUrl(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/png");
}

export function LogoUpload({ value, onChange, label = "Business logo" }: { value: string; onChange: (dataUrl: string) => void; label?: string }) {
  const input = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- local data URL preview
            <img src={value} alt={label} className="max-h-full max-w-full object-contain" />
          ) : (
            <ImagePlus className="size-6 text-muted-foreground" aria-hidden />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="h-10" onClick={() => input.current?.click()}>
            {value ? "Change logo" : "Upload logo"}
          </Button>
          {value && (
            <Button type="button" variant="ghost" className="h-10" onClick={() => onChange("")}>
              <Trash2 /> Remove
            </Button>
          )}
        </div>
        <input
          ref={input}
          type="file"
          accept={ACCEPTED.join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-label={`Upload ${label.toLowerCase()}`}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            if (!ACCEPTED.includes(file.type)) {
              toast.error("Please upload a PNG, JPG or WEBP image.");
              return;
            }
            if (file.size > MAX_INPUT_BYTES) {
              toast.error("Logo must be smaller than 2 MB.");
              return;
            }
            try {
              onChange(await toSmallDataUrl(file));
            } catch {
              toast.error("Couldn't read that image. Try a different file.");
            }
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground">PNG, JPG or WEBP up to 2 MB. Stays on your device.</p>
    </div>
  );
}
