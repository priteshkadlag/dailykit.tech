import { clampSize, drawPlan, type FitMode, type Size } from "./geometry";

export type OutputMime = "image/jpeg" | "image/png" | "image/webp";

export const OUTPUT_EXT: Record<OutputMime, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Decode an image file. Modern browsers apply EXIF orientation, so phone photos come out upright. */
export async function decodeImage(file: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    throw new Error("This image couldn't be read. It may be corrupted or in an unsupported format.");
  }
}

interface RenderOptions {
  target: Size;
  mode?: FitMode;
  type: OutputMime;
  /** 0–1, ignored for PNG. */
  quality?: number;
  /** Fill colour behind the image. JPEG has no transparency, so it always gets a background. */
  background?: string | null;
}

export interface RenderedImage {
  blob: Blob;
  width: number;
  height: number;
  type: OutputMime;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("The image is too large for this browser to process."))), type, quality),
  );
}

/** Draw a decoded image onto a canvas of the target size and encode it. */
export async function renderImage(source: ImageBitmap | HTMLCanvasElement, { target, mode = "stretch", type, quality = 0.85, background }: RenderOptions): Promise<RenderedImage> {
  const size = clampSize(target);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser can't process images here.");

  const fill = type === "image/jpeg" ? (background ?? "#ffffff") : background;
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, size.width, size.height);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const { src, dest } = drawPlan({ width: source.width, height: source.height }, size, mode);
  ctx.drawImage(source, src.x, src.y, src.width, src.height, dest.x, dest.y, dest.width, dest.height);

  let blob = await canvasToBlob(canvas, type, type === "image/png" ? undefined : quality);
  let actualType = type;
  // Some browsers (older Safari) can't encode WEBP and silently return PNG — fall back to JPEG.
  if (type === "image/webp" && blob.type !== "image/webp") {
    if (!fill) {
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size.width, size.height);
    }
    blob = await canvasToBlob(canvas, "image/jpeg", quality);
    actualType = "image/jpeg";
  }
  canvas.width = canvas.height = 0; // release memory promptly
  return { blob, width: size.width, height: size.height, type: actualType };
}
