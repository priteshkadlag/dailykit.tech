/**
 * Parse a page selection like "1-3, 5, 8-" against a document with `total` pages.
 * Open-ended ranges run to the last page; duplicates are removed and order is ascending.
 * An empty string selects every page.
 */
export function parsePageRange(input: string, total: number): { pages: number[]; error?: string } {
  const text = input.trim();
  if (!text) return { pages: Array.from({ length: total }, (_, i) => i + 1) };

  const pages = new Set<number>();
  for (const raw of text.split(",")) {
    const part = raw.trim();
    if (!part) continue;
    const match = /^(\d+)?\s*(-)?\s*(\d+)?$/.exec(part);
    if (!match || (!match[1] && !match[3])) return { pages: [], error: `“${part}” isn't a valid page or range` };
    const start = match[1] ? Number(match[1]) : 1;
    const end = match[2] ? (match[3] ? Number(match[3]) : total) : start;
    if (start < 1 || end < 1) return { pages: [], error: "Page numbers start at 1" };
    if (start > total || end > total) return { pages: [], error: `This PDF has only ${total} page${total === 1 ? "" : "s"}` };
    if (start > end) return { pages: [], error: `“${part}” runs backwards` };
    for (let p = start; p <= end; p++) pages.add(p);
  }
  if (pages.size === 0) return { pages: [], error: "Select at least one page" };
  return { pages: [...pages].sort((a, b) => a - b) };
}
