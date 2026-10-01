import type { PDFDocumentProxy } from "pdfjs-dist";
import { clampSize } from "@/lib/image/geometry";
import { renderImage, type OutputMime, type RenderedImage } from "@/lib/image/process";

export class PdfOpenError extends Error {}

export interface OpenedPdf {
  doc: PDFDocumentProxy;
  /** Frees the document and its worker memory. */
  destroy: () => Promise<void>;
}

/**
 * Open a PDF in the browser with pdf.js. The worker is served from /public (see scripts/copy-pdf-worker.mjs)
 * with a .js extension: some hosts (e.g. Hostinger) serve .mjs as text/plain, which browsers refuse to run.
 */
export async function openPdf(file: Blob, password?: string): Promise<OpenedPdf> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), password });
  try {
    return { doc: await task.promise, destroy: () => task.destroy() };
  } catch (error) {
    void task.destroy();
    if (error instanceof Error && error.name === "PasswordException") {
      throw new PdfOpenError(
        password ? "That password isn't right. Check it and try again." : "This PDF is password-protected. Remove the password first with the Unlock PDF tool.",
      );
    }
    throw new PdfOpenError("This PDF couldn't be opened. It may be damaged or not a real PDF.");
  }
}

/**
 * Render one page (1-based) onto a new canvas at the given DPI, on white. The canvas is the page as
 * displayed (rotation applied); its size in points is canvas size × 72 / dpi. Caller frees it.
 */
export async function renderPageCanvas(doc: PDFDocumentProxy, pageNumber: number, dpi: number): Promise<{ canvas: HTMLCanvasElement; width: number; height: number }> {
  const page = await doc.getPage(pageNumber);
  try {
    const natural = page.getViewport({ scale: 1 });
    const safe = clampSize({ width: Math.round((natural.width * dpi) / 72), height: Math.round((natural.height * dpi) / 72) });
    const viewport = page.getViewport({ scale: safe.width / natural.width });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    return { canvas, width: natural.width, height: natural.height };
  } finally {
    page.cleanup();
  }
}

/** Encode a canvas as JPEG bytes. */
export function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? blob.arrayBuffer().then((b) => resolve(new Uint8Array(b)), reject) : reject(new Error("Couldn't encode the page."))), "image/jpeg", quality),
  );
}

/** Page sizes as displayed (points), from pdf.js — rotation and crop applied. */
export async function displaySizes(doc: PDFDocumentProxy) {
  const sizes: { width: number; height: number }[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const vp = page.getViewport({ scale: 1 });
    sizes.push({ width: vp.width, height: vp.height });
    page.cleanup();
  }
  return sizes;
}

/** Render one page (1-based) at the given DPI and encode it as JPG or PNG. 72 dpi = the PDF's natural size. */
export async function renderPdfPage(doc: PDFDocumentProxy, pageNumber: number, { dpi, type, quality }: { dpi: number; type: OutputMime; quality: number }): Promise<RenderedImage> {
  const page = await doc.getPage(pageNumber);
  try {
    const natural = page.getViewport({ scale: 1 });
    // Keep huge pages (e.g. posters at 300 dpi) inside browser canvas limits.
    const wanted = { width: Math.round((natural.width * dpi) / 72), height: Math.round((natural.height * dpi) / 72) };
    const safe = clampSize(wanted);
    const viewport = page.getViewport({ scale: safe.clamped ? safe.width / natural.width : dpi / 72 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    // PDFs assume a white page; without this, transparent areas turn black in JPG.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    const result = await renderImage(canvas, { target: { width: canvas.width, height: canvas.height }, type, quality, background: "#ffffff" });
    canvas.width = canvas.height = 0;
    return result;
  } finally {
    page.cleanup();
  }
}
