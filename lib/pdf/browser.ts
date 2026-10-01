import type { PDFDocumentProxy } from "pdfjs-dist";
import { clampSize } from "@/lib/image/geometry";
import type { ImageCodec } from "./compress";
import type { PageImage } from "./edit";
import { canvasToJpeg, renderPageCanvas } from "./pdf-render";

/** Browser-only helpers shared by the PDF tools: canvas encoding, images and page rendering. */

export function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? blob.arrayBuffer().then((b) => resolve(new Uint8Array(b)), reject) : reject(new Error("Couldn't create the image."))), "image/png"),
  );
}

function newCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser can't process images here.");
  return { canvas, ctx };
}

/** Re-encodes PDF images with the browser's decoder and canvas. */
export const canvasCodec: ImageCodec = {
  async toJpeg(source, { maxSide, quality }) {
    let drawable: CanvasImageSource;
    let width = source.width;
    let height = source.height;
    if (source.kind === "jpeg") {
      const bitmap = await createImageBitmap(new Blob([source.bytes.slice().buffer as ArrayBuffer], { type: "image/jpeg" }));
      [drawable, width, height] = [bitmap, bitmap.width, bitmap.height];
    } else {
      if (clampSize({ width, height }).clamped) throw new Error("Image too large");
      const { canvas, ctx } = newCanvas(width, height);
      const data = ctx.createImageData(width, height);
      const px = data.data;
      for (let i = 0, j = 0; i < width * height; i++, j += source.channels) {
        const o = i * 4;
        px[o] = source.pixels[j];
        px[o + 1] = source.channels === 3 ? source.pixels[j + 1] : source.pixels[j];
        px[o + 2] = source.channels === 3 ? source.pixels[j + 2] : source.pixels[j];
        px[o + 3] = 255;
      }
      ctx.putImageData(data, 0, 0);
      drawable = canvas;
    }
    const scale = Math.min(1, maxSide / Math.max(width, height));
    const { canvas, ctx } = newCanvas(width * scale, height * scale);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(drawable, 0, 0, canvas.width, canvas.height);
    if ("close" in drawable) drawable.close();
    const bytes = await canvasToJpeg(canvas, quality);
    const out = { bytes, width: canvas.width, height: canvas.height };
    canvas.width = canvas.height = 0;
    return out;
  },
};

/** Any browser-readable image (JPG, PNG, WEBP…) → PNG bytes, so it can be placed in a PDF. */
export async function imageToPng(file: Blob, maxSide = 2400): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("This image couldn't be read.");
  });
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const { canvas, ctx } = newCanvas(bitmap.width * scale, bitmap.height * scale);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return { bytes: await canvasToPngBytes(canvas), width: canvas.width, height: canvas.height };
}

/** Crop away fully transparent borders (for drawn signatures). Null if the canvas is empty. */
export function trimCanvas(source: HTMLCanvasElement, padding = 4): HTMLCanvasElement | null {
  const ctx = source.getContext("2d");
  if (!ctx) return null;
  const { width, height } = source;
  const data = ctx.getImageData(0, 0, width, height).data;
  let [top, left, right, bottom] = [height, width, -1, -1];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }
  if (right < 0) return null;
  const [x0, y0] = [Math.max(0, left - padding), Math.max(0, top - padding)];
  const [x1, y1] = [Math.min(width, right + padding + 1), Math.min(height, bottom + padding + 1)];
  const { canvas, ctx: out } = newCanvas(x1 - x0, y1 - y0);
  out.drawImage(source, x0, y0, x1 - x0, y1 - y0, 0, 0, x1 - x0, y1 - y0);
  return canvas;
}

export interface TextImageOptions {
  fontFamily: string;
  sizePt: number;
  color: string;
  bold?: boolean;
  /** Pixels per point — higher is sharper. */
  scale?: number;
}

/**
 * Draw text onto a transparent PNG. Used for scripts the built-in PDF fonts can't show (Hindi,
 * Marathi, Tamil…) and for typed signatures, so what's placed matches the on-screen preview.
 */
export async function textToPng(text: string, { fontFamily, sizePt, color, bold, scale = 4 }: TextImageOptions) {
  const px = sizePt * scale;
  const font = `${bold ? "700" : "400"} ${px}px ${fontFamily}`;
  await document.fonts?.load(font, text).catch(() => undefined);
  const lines = text.split("\n");
  const measure = newCanvas(1, 1).ctx;
  measure.font = font;
  const widths = lines.map((l) => measure.measureText(l || " ").width);
  const lineHeight = px * 1.2;
  const pad = px * 0.15;
  const { canvas, ctx } = newCanvas(Math.max(...widths) + pad * 2, lineHeight * lines.length + pad * 2);
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textBaseline = "top";
  lines.forEach((line, i) => ctx.fillText(line, pad, pad + i * lineHeight + px * 0.1));
  return { bytes: await canvasToPngBytes(canvas), widthPt: canvas.width / scale, heightPt: canvas.height / scale, padPt: pad / scale };
}

/**
 * Render pages to JPEG page images (display orientation). `draw` can paint over each page before
 * encoding — e.g. black redaction boxes — with coordinates in points.
 */
export async function renderPageImages(
  doc: PDFDocumentProxy,
  pages: number[],
  { dpi, quality, draw, onProgress }: { dpi: number; quality: number; draw?: (ctx: CanvasRenderingContext2D, page: number) => void; onProgress?: (done: number, total: number) => void },
): Promise<Map<number, PageImage>> {
  const out = new Map<number, PageImage>();
  for (let i = 0; i < pages.length; i++) {
    onProgress?.(i, pages.length);
    const { canvas, width, height } = await renderPageCanvas(doc, pages[i], dpi);
    if (draw) {
      const ctx = canvas.getContext("2d")!;
      ctx.save();
      ctx.scale(canvas.width / width, canvas.height / height);
      draw(ctx, pages[i]);
      ctx.restore();
    }
    out.set(pages[i], { jpeg: await canvasToJpeg(canvas, quality), width, height });
    canvas.width = canvas.height = 0;
  }
  onProgress?.(pages.length, pages.length);
  return out;
}
