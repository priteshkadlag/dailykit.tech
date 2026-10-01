import type { PDFDocumentProxy } from "pdfjs-dist";
import type { TextItem } from "pdfjs-dist/types/src/display/api";
import type { TextLine } from "./markdown";

/** A piece of text as pdf.js reports it, in display points (x right, y down; `y` is the baseline). */
export interface TextFragment {
  text: string;
  x: number;
  y: number;
  width: number;
  size: number;
}

/** A page's text fragments, in reading position. Rotated pages are handled by the viewport. */
export async function pageFragments(doc: PDFDocumentProxy, pageNumber: number): Promise<TextFragment[]> {
  const page = await doc.getPage(pageNumber);
  try {
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    return (content.items as TextItem[])
      .filter((i) => "str" in i && i.str.trim() !== "")
      .map((i) => {
        const [x, y] = viewport.convertToViewportPoint(i.transform[4], i.transform[5]);
        const size = Math.hypot(i.transform[2], i.transform[3]) || i.height || 10;
        return { text: i.str, x, y, size, width: i.width };
      })
      .sort((a, b) => a.y - b.y || a.x - b.x);
  } finally {
    page.cleanup();
  }
}

/** Fragments that sit on (nearly) the same baseline, grouped top to bottom and sorted left to right. */
export function groupLines(fragments: TextFragment[]) {
  const lines: { y: number; size: number; parts: TextFragment[] }[] = [];
  for (const f of [...fragments].sort((a, b) => a.y - b.y || a.x - b.x)) {
    const line = lines.find((l) => Math.abs(l.y - f.y) < Math.max(2, Math.min(l.size, f.size) * 0.5));
    if (line) {
      line.parts.push(f);
      line.size = Math.max(line.size, f.size);
    } else lines.push({ y: f.y, size: f.size, parts: [f] });
  }
  for (const line of lines) line.parts.sort((a, b) => a.x - b.x);
  return lines.sort((a, b) => a.y - b.y);
}

/** Join fragments left to right, adding a space where there's a visible gap. */
function joinParts(parts: TextFragment[]) {
  let text = "";
  let end = -Infinity;
  for (const p of parts) {
    if (text && p.x - end > p.size * 0.2 && !text.endsWith(" ") && !p.text.startsWith(" ")) text += " ";
    text += p.text;
    end = p.x + p.width;
  }
  return text.replace(/\s+/g, " ").trim();
}

/** Lines of text, top to bottom — the input for Markdown, Word and summaries. */
export function fragmentsToLines(fragments: TextFragment[]): TextLine[] {
  return groupLines(fragments)
    .map((line) => ({ text: joinParts(line.parts), size: line.size, x: line.parts[0].x, y: line.y }))
    .filter((l) => l.text);
}

export async function pageLines(doc: PDFDocumentProxy, pageNumber: number): Promise<TextLine[]> {
  return fragmentsToLines(await pageFragments(doc, pageNumber));
}

/** Every page's lines, reporting progress. */
export async function documentLines(doc: PDFDocumentProxy, onProgress?: (done: number, total: number) => void): Promise<TextLine[][]> {
  const pages: TextLine[][] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    pages.push(await pageLines(doc, p));
    onProgress?.(p, doc.numPages);
  }
  return pages;
}

// ---------------------------------------------------------------- tables

/**
 * Lay a page's text out as a grid. Within a line, a gap wider than about one space-and-a-half
 * starts a new cell; cells are then snapped to columns shared by the whole page, so a table's
 * columns line up even when some cells are empty.
 */
export function fragmentsToTable(fragments: TextFragment[]): string[][] {
  const lines = groupLines(fragments);
  const rows = lines.map((line) => {
    const cells: { x: number; parts: TextFragment[] }[] = [];
    let end = -Infinity;
    for (const p of line.parts) {
      const last = cells[cells.length - 1];
      if (last && p.x - end < p.size * 1.2) last.parts.push(p);
      else cells.push({ x: p.x, parts: [p] });
      end = Math.max(end, p.x + p.width);
    }
    return cells.map((c) => ({ x: c.x, text: joinParts(c.parts) }));
  });

  // Column anchors: cell start positions, merged when within a few points of each other.
  const starts = rows.flat().map((c) => c.x).sort((a, b) => a - b);
  const anchors: number[] = [];
  for (const x of starts) if (!anchors.length || x - anchors[anchors.length - 1] > 6) anchors.push(x);

  return rows.map((cells) => {
    const row = new Array<string>(anchors.length).fill("");
    let lastColumn = -1;
    for (const cell of cells) {
      let column = anchors.findLastIndex((a) => a <= cell.x + 6);
      // Never put two cells of one row in the same or an earlier column.
      if (column <= lastColumn) column = Math.min(lastColumn + 1, anchors.length - 1);
      row[column] = row[column] ? `${row[column]} ${cell.text}` : cell.text;
      lastColumn = column;
    }
    // Trim empty trailing cells.
    let length = row.length;
    while (length > 0 && !row[length - 1]) length--;
    return row.slice(0, length);
  });
}

/** Spreadsheet value for a cell: numbers written with Indian or Western grouping become numbers. */
export function cellValue(text: string): string | number {
  const t = text.trim();
  if (/^[-+]?(\d{1,3}(,\d{2,3})+|\d+)(\.\d+)?$/.test(t)) {
    const n = Number(t.replace(/,/g, ""));
    // Leading zeros (IDs, PIN codes, phone numbers) stay text.
    if (Number.isFinite(n) && !/^[-+]?0\d/.test(t)) return n;
  }
  return t;
}

// ---------------------------------------------------------------- search (for redaction)

export interface TextBox {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Boxes (display points, y down) around every case-insensitive match of `query` on a page. Matches
 * inside a fragment are located by character position, which is exact for most fonts and close
 * enough to cover the word for the rest; a little padding is added.
 */
export function findInFragments(fragments: TextFragment[], query: string, page: number): TextBox[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const boxes: TextBox[] = [];
  for (const f of fragments) {
    const hay = f.text.toLowerCase();
    let at = hay.indexOf(needle);
    while (at !== -1) {
      const charWidth = f.width / Math.max(1, f.text.length);
      const pad = f.size * 0.15;
      boxes.push({
        page,
        x: f.x + at * charWidth - pad,
        y: f.y - f.size * 0.95 - pad,
        width: needle.length * charWidth + pad * 2,
        height: f.size * 1.2 + pad * 2,
      });
      at = hay.indexOf(needle, at + needle.length);
    }
  }
  return boxes;
}
