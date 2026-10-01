import { track } from "@/lib/analytics/client";
import { uniqueNames } from "./validation";

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a moment to start the download before freeing the memory.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  track("download_clicked");
}

/** Bundle files into a ZIP. Images and PDFs are already compressed, so entries are stored, not deflated. */
export async function zipBlobs(entries: { name: string; blob: Blob }[]): Promise<Blob> {
  const { zipSync } = await import("fflate");
  const names = uniqueNames(entries.map((e) => e.name));
  const files: Record<string, [Uint8Array, { level: 0 }]> = {};
  for (let i = 0; i < entries.length; i++) {
    files[names[i]] = [new Uint8Array(await entries[i].blob.arrayBuffer()), { level: 0 }];
  }
  const zipped = zipSync(files);
  return new Blob([zipped.buffer as ArrayBuffer], { type: "application/zip" });
}
