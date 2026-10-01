/**
 * Small, pure helpers for the PDF tools' UI. Kept apart from ./edit so a tool page can use them while
 * rendering without loading pdf-lib; the heavy operations in ./edit are imported only when a file is processed
 * (see ./lazy). ./edit re-exports everything here, so existing imports keep working.
 */

/** PDF points per millimetre. */
export const MM = 72 / 25.4;

/** Groups for "every N pages". */
export function chunkPages(total: number, size: number): number[][] {
  const groups: number[][] = [];
  for (let start = 1; start <= total; start += size) groups.push(Array.from({ length: Math.min(size, total - start + 1) }, (_, i) => start + i));
  return groups;
}

export type NumberPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
export type NumberFormat = "n" | "page-n" | "n-of-total" | "page-n-of-total";

export const NUMBER_FORMATS: Record<NumberFormat, string> = {
  n: "1",
  "page-n": "Page 1",
  "n-of-total": "1 / 10",
  "page-n-of-total": "Page 1 of 10",
};

export function formatPageNumber(format: NumberFormat, n: number, total: number) {
  switch (format) {
    case "page-n":
      return `Page ${n}`;
    case "n-of-total":
      return `${n} / ${total}`;
    case "page-n-of-total":
      return `Page ${n} of ${total}`;
    default:
      return String(n);
  }
}

/** Text the standard PDF fonts can draw (Latin-1); anything else must be stamped as an image. */
export function isStandardFontText(text: string) {
  return /^[\x20-\x7e\xa0-\xff\n]*$/.test(text);
}
