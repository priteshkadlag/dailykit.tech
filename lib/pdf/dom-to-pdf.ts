/**
 * Turn laid-out HTML into a PDF in the browser. The browser does the layout (so every script,
 * font, table and image the browser can show works), each page is captured as an image, and an
 * invisible text layer is added on top so the PDF can still be searched and copied.
 * Page breaks are placed between lines, rows and images — never through them.
 */

/** 1 CSS pixel = 0.75 PDF points (96 dpi vs 72). */
const PT_PER_PX = 0.75;

export const PAGE_SIZES_PT = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
} as const;
export type PageSizeName = keyof typeof PAGE_SIZES_PT;

export interface FlowOptions {
  size?: PageSizeName;
  landscape?: boolean;
  marginPt?: number;
  onProgress?: (done: number, total: number) => void;
  /** Adjust the laid-out content before pages are measured (e.g. shrink wide tables to fit). */
  prepare?: (node: HTMLElement) => void;
}

/** Content width in CSS pixels for a page setup — lay the element out at exactly this width. */
export function contentWidthPx({ size = "a4", landscape = false, marginPt = 40 }: FlowOptions = {}) {
  const page = PAGE_SIZES_PT[size];
  return ((landscape ? page.height : page.width) - 2 * marginPt) / PT_PER_PX;
}

/**
 * Mount `node` off-screen at a fixed width so it can be measured and captured, run `fn`, then
 * remove it. Layout containment keeps fixed-position content inside the stage.
 */
export async function withStage<T>(node: HTMLElement, widthPx: number, fn: (node: HTMLElement) => Promise<T>): Promise<T> {
  const stage = document.createElement("div");
  stage.setAttribute("aria-hidden", "true");
  Object.assign(stage.style, { position: "fixed", left: "-20000px", top: "0", width: `${widthPx}px`, contain: "layout paint", pointerEvents: "none" });
  Object.assign(node.style, { width: `${widthPx}px`, background: "#ffffff", color: node.style.color || "#000000" });
  stage.appendChild(node);
  document.body.appendChild(stage);
  try {
    await settle(node);
    return await fn(node);
  } finally {
    stage.remove();
  }
}

/** Wait for fonts and images so measurements are final. */
async function settle(node: HTMLElement) {
  await document.fonts?.ready;
  await Promise.all(
    [...node.querySelectorAll("img")].map((img) => (img.complete ? Promise.resolve() : img.decode().catch(() => img.remove()))),
  );
}

interface Box {
  top: number;
  bottom: number;
}

/** Things a page break mustn't cut through: text lines, images, table rows, and other replaced content. */
function unbreakables(root: HTMLElement): Box[] {
  const origin = root.getBoundingClientRect().top;
  const boxes: Box[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent?.trim()) continue;
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) if (r.height > 0) boxes.push({ top: r.top - origin, bottom: r.bottom - origin });
  }
  for (const el of root.querySelectorAll("img, svg, canvas, video, tr, hr, input, textarea, select, button, [data-keep]")) {
    const r = el.getBoundingClientRect();
    if (r.height > 0) boxes.push({ top: r.top - origin, bottom: r.bottom - origin });
  }
  return boxes;
}

/** Page slices [start, end) in px, each at most `pageHeight` tall, ending in a gap between unbreakables. */
export function planBreaks(boxes: Box[], totalHeight: number, pageHeight: number): { start: number; end: number }[] {
  // Merge overlapping boxes: breaks are only allowed in the gaps between merged blocks.
  const blocks: Box[] = [];
  for (const b of [...boxes].sort((x, y) => x.top - y.top)) {
    const last = blocks[blocks.length - 1];
    if (last && b.top < last.bottom - 0.5) last.bottom = Math.max(last.bottom, b.bottom);
    else blocks.push({ ...b });
  }
  const slices: { start: number; end: number }[] = [];
  let start = 0;
  while (start < totalHeight - 1) {
    const limit = start + pageHeight;
    if (limit >= totalHeight) {
      slices.push({ start, end: totalHeight });
      break;
    }
    // A block crossing the limit pushes the break up to its top — unless that would leave the page (nearly) empty.
    const crossing = blocks.find((b) => b.top < limit && b.bottom > limit);
    let end = crossing && crossing.top > start + pageHeight * 0.2 ? crossing.top : limit;
    if (end <= start) end = limit;
    slices.push({ start, end });
    start = end;
  }
  return slices;
}

interface Word {
  text: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Where every word sits, for the invisible text layer. */
function wordBoxes(root: HTMLElement): Word[] {
  const origin = root.getBoundingClientRect();
  const words: Word[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n.textContent ?? "";
    for (const m of text.matchAll(/\S+/g)) {
      range.setStart(n, m.index!);
      range.setEnd(n, m.index! + m[0].length);
      const r = range.getClientRects()[0];
      if (!r || r.width === 0) continue;
      words.push({ text: m[0], left: r.left - origin.left, top: r.top - origin.top, width: r.width, height: r.height });
    }
  }
  return words;
}

/** The standard PDF fonts only cover Latin-1; typographic punctuation is mapped to plain equivalents. */
function pdfSafe(text: string): string | null {
  const plain = text
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[–—−]/g, "-")
    .replace(/…/g, "...")
    .replace(/[•●▪]/g, "-")
    .replace(/₹/g, "Rs.")
    .replace(/[  ​]/g, " ");
  return /^[\x20-\x7e\xa0-\xff]+$/.test(plain) ? plain : null;
}

/**
 * Capture `root` (already staged) as PDF pages. `slices` are vertical ranges in px of the root;
 * each becomes one page of `pageWidthPt` × `pageHeightPt` with the slice placed at the margin.
 */
export async function captureToPdf(
  root: HTMLElement,
  slices: { start: number; end: number }[],
  { pageWidthPt, pageHeightPt, marginPt, onProgress }: { pageWidthPt: number; pageHeightPt: number; marginPt: number; onProgress?: (done: number, total: number) => void },
): Promise<Blob> {
  const [{ toCanvas, getFontEmbedCSS }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
  const widthPx = root.getBoundingClientRect().width;
  const words = wordBoxes(root);
  const fontEmbedCSS = await getFontEmbedCSS(root).catch(() => "");
  const pdf = new jsPDF({ unit: "pt", format: [pageWidthPt, pageHeightPt], orientation: pageWidthPt > pageHeightPt ? "landscape" : "portrait", compress: true });
  pdf.setFont("helvetica", "normal");

  for (let i = 0; i < slices.length; i++) {
    onProgress?.(i, slices.length);
    const { start, end } = slices[i];
    const height = Math.max(1, Math.ceil(end - start));
    const canvas = await toCanvas(root, {
      width: widthPx,
      height,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      fontEmbedCSS,
      style: { transform: `translateY(${-start}px)`, transformOrigin: "top left", margin: "0" },
    });
    if (i > 0) pdf.addPage([pageWidthPt, pageHeightPt], pageWidthPt > pageHeightPt ? "landscape" : "portrait");
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.9), "JPEG", marginPt, marginPt, widthPx * PT_PER_PX, height * PT_PER_PX, undefined, "FAST");
    canvas.width = canvas.height = 0;

    for (const w of words) {
      if (w.top < start - 0.5 || w.top + w.height > end + 0.5) continue;
      const text = pdfSafe(w.text);
      if (!text) continue;
      const size = w.height * PT_PER_PX * 0.8;
      pdf.setFontSize(size);
      const natural = pdf.getTextWidth(text);
      if (natural <= 0) continue;
      pdf.text(text, marginPt + w.left * PT_PER_PX, marginPt + (w.top - start + w.height * 0.8) * PT_PER_PX, {
        renderingMode: "invisible",
        horizontalScale: (w.width * PT_PER_PX) / natural,
      });
    }
  }
  onProgress?.(slices.length, slices.length);
  return pdf.output("blob");
}

/** Lay out a flowing document (Word, HTML, spreadsheet) across as many pages as it needs. */
export async function flowToPdf(root: HTMLElement, options: FlowOptions = {}): Promise<Blob> {
  const { size = "a4", landscape = false, marginPt = 40, onProgress, prepare } = options;
  const page = PAGE_SIZES_PT[size];
  const [pageWidthPt, pageHeightPt] = landscape ? [page.height, page.width] : [page.width, page.height];
  return withStage(root, contentWidthPx(options), async (node) => {
    prepare?.(node);
    const slices = planBreaks(unbreakables(node), node.scrollHeight, (pageHeightPt - 2 * marginPt) / PT_PER_PX);
    return captureToPdf(node, slices, { pageWidthPt, pageHeightPt, marginPt, onProgress });
  });
}

/** Fixed-size pages (slides): each child of `root` becomes exactly one page of `widthPx` × `heightPx`. */
export async function pagesToPdf(root: HTMLElement, widthPx: number, heightPx: number, onProgress?: (done: number, total: number) => void): Promise<Blob> {
  return withStage(root, widthPx, async (node) => {
    const slices = [...node.children].map((_, i) => ({ start: i * heightPx, end: (i + 1) * heightPx }));
    return captureToPdf(node, slices, { pageWidthPt: widthPx * PT_PER_PX, pageHeightPt: heightPx * PT_PER_PX, marginPt: 0, onProgress });
  });
}
