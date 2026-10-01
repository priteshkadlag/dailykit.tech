export interface Size {
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Page sizes in millimetres (portrait). */
export const PAGE_SIZES_MM = {
  a4: { width: 210, height: 297, label: "A4" },
  a5: { width: 148, height: 210, label: "A5" },
  letter: { width: 215.9, height: 279.4, label: "Letter" },
} as const;
export type PageSizeId = keyof typeof PAGE_SIZES_MM | "original";

/** Largest rectangle with the image's aspect ratio that fits inside `box`, centred. */
export function containRect(image: Size, box: Rect): Rect {
  const scale = Math.min(box.width / image.width, box.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  return { x: box.x + (box.width - width) / 2, y: box.y + (box.height - height) / 2, width, height };
}

/**
 * Page size (mm) and image placement for one image in an image→PDF export.
 * "original" makes the page exactly the image size (at 96 dpi) plus margins.
 */
export function layoutImagePage(image: Size, pageSize: PageSizeId, orientation: "portrait" | "landscape", marginMm: number) {
  if (pageSize === "original") {
    const pxToMm = 25.4 / 96;
    const width = image.width * pxToMm + marginMm * 2;
    const height = image.height * pxToMm + marginMm * 2;
    return { page: { width, height }, image: { x: marginMm, y: marginMm, width: image.width * pxToMm, height: image.height * pxToMm } };
  }
  const base = PAGE_SIZES_MM[pageSize];
  const page = orientation === "portrait" ? { width: base.width, height: base.height } : { width: base.height, height: base.width };
  const box = { x: marginMm, y: marginMm, width: Math.max(1, page.width - marginMm * 2), height: Math.max(1, page.height - marginMm * 2) };
  return { page, image: containRect(image, box) };
}

/** Fill in the missing dimension from the aspect ratio when only one side is given. */
export function resolveDimensions(original: Size, width: number | null, height: number | null): Size {
  const ratio = original.width / original.height;
  if (width && height) return { width: Math.round(width), height: Math.round(height) };
  if (width) return { width: Math.round(width), height: Math.max(1, Math.round(width / ratio)) };
  if (height) return { width: Math.max(1, Math.round(height * ratio)), height: Math.round(height) };
  return original;
}

export type FitMode = "stretch" | "contain" | "cover";

/**
 * How to draw a source image onto a target canvas.
 * - stretch: fill the canvas, distorting if the aspect differs
 * - contain: whole image visible, padded with background
 * - cover:   canvas filled, overflow cropped from the centre
 */
export function drawPlan(source: Size, target: Size, mode: FitMode): { src: Rect; dest: Rect } {
  const full = { x: 0, y: 0, width: source.width, height: source.height };
  const canvas = { x: 0, y: 0, width: target.width, height: target.height };
  if (mode === "stretch") return { src: full, dest: canvas };
  if (mode === "contain") return { src: full, dest: containRect(source, canvas) };
  const scale = Math.max(target.width / source.width, target.height / source.height);
  const width = target.width / scale;
  const height = target.height / scale;
  return { src: { x: (source.width - width) / 2, y: (source.height - height) / 2, width, height }, dest: canvas };
}

/** Browsers fail silently on huge canvases; keep outputs within safe limits, preserving aspect ratio. */
export const MAX_CANVAS = { side: 8192, area: 40_000_000 };

export function clampSize(size: Size, limits = MAX_CANVAS): Size & { clamped: boolean } {
  let scale = Math.min(1, limits.side / size.width, limits.side / size.height);
  scale = Math.min(scale, Math.sqrt(limits.area / (size.width * size.height)));
  if (scale >= 1) return { ...size, clamped: false };
  return { width: Math.max(1, Math.floor(size.width * scale)), height: Math.max(1, Math.floor(size.height * scale)), clamped: true };
}
