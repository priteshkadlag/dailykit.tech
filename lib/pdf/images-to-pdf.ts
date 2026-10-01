import { layoutImagePage, type PageSizeId } from "@/lib/image/geometry";
import { decodeImage, renderImage } from "@/lib/image/process";

export type PdfQuality = "high" | "balanced" | "small";

/** JPEG quality and the longest side (px) each image is scaled to — roughly 300 / 200 / 150 dpi on A4. */
export const PDF_QUALITY: Record<PdfQuality, { label: string; jpeg: number; maxSide: number }> = {
  high: { label: "High (larger file)", jpeg: 0.92, maxSide: 3508 },
  balanced: { label: "Balanced", jpeg: 0.82, maxSide: 2480 },
  small: { label: "Smallest file", jpeg: 0.65, maxSide: 1654 },
};

export interface ImagesToPdfOptions {
  pageSize: PageSizeId;
  orientation: "portrait" | "landscape";
  marginMm: number;
  quality: PdfQuality;
  onProgress?: (done: number, total: number) => void;
}

/** One page per image, in the given order. Everything happens in the browser. */
export async function imagesToPdf(files: Blob[], { pageSize, orientation, marginMm, quality, onProgress }: ImagesToPdfOptions): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const q = PDF_QUALITY[quality];
  let pdf: InstanceType<typeof jsPDF> | null = null;

  for (let i = 0; i < files.length; i++) {
    const bitmap = await decodeImage(files[i]);
    const scale = Math.min(1, q.maxSide / Math.max(bitmap.width, bitmap.height));
    const size = { width: Math.round(bitmap.width * scale), height: Math.round(bitmap.height * scale) };
    // "Original size" pages use the image's own dimensions, not the downscaled ones.
    const layout = layoutImagePage(pageSize === "original" ? { width: bitmap.width, height: bitmap.height } : size, pageSize, orientation, marginMm);
    const rendered = await renderImage(bitmap, { target: size, type: "image/jpeg", quality: q.jpeg, background: "#ffffff" });
    bitmap.close();

    const { width, height } = layout.page;
    const pageOrientation = width > height ? "landscape" : "portrait";
    if (!pdf) pdf = new jsPDF({ unit: "mm", format: [width, height], orientation: pageOrientation, compress: true });
    else pdf.addPage([width, height], pageOrientation);

    const bytes = new Uint8Array(await rendered.blob.arrayBuffer());
    pdf.addImage(bytes, "JPEG", layout.image.x, layout.image.y, layout.image.width, layout.image.height, undefined, "NONE");
    onProgress?.(i + 1, files.length);
  }

  if (!pdf) throw new Error("Add at least one image.");
  return pdf.output("blob");
}
