/** A line of text as laid out on a PDF page. `y` is measured from the top of the page (points). */
export interface TextLine {
  text: string;
  /** Font size in points. */
  size: number;
  x: number;
  y: number;
}

const BULLET = /^[•●▪◦‣∙·\-–—*]\s+/;
const NUMBERED = /^(\d{1,3}|[a-z])[.)]\s+/i;

/** The size most of the text is set in (weighted by characters), rounded to half a point. */
export function bodySize(pages: TextLine[][]) {
  const weight = new Map<number, number>();
  for (const line of pages.flat()) {
    const size = Math.round(line.size * 2) / 2;
    weight.set(size, (weight.get(size) ?? 0) + line.text.length);
  }
  let best = 0;
  let bestWeight = -1;
  for (const [size, w] of weight) if (w > bestWeight) [best, bestWeight] = [size, w];
  return best || 11;
}

function headingLevel(line: TextLine, body: number) {
  if (line.text.length > 120 || /[.,;:]$/.test(line.text)) return 0;
  const ratio = line.size / body;
  if (ratio >= 1.6) return 1;
  if (ratio >= 1.3) return 2;
  if (ratio >= 1.12) return 3;
  return 0;
}

/** Stop text that happens to start with Markdown syntax from turning into it. */
function escapeStart(text: string) {
  return text.replace(/^(#{1,6}\s|>|\d+\.\s|[-*+]\s)/, "\\$1");
}

/**
 * Turn page lines into Markdown: larger text becomes headings, bullet and numbered lines become
 * lists, and lines that follow each other closely are joined into paragraphs (re-joining words
 * hyphenated across a line break).
 */
export function linesToMarkdown(pages: TextLine[][], { pageBreaks = false } = {}): string {
  const body = bodySize(pages);
  const blocks: string[] = [];

  pages.forEach((lines, pageIndex) => {
    if (pageBreaks && pageIndex > 0) blocks.push("---");
    let paragraph: string[] = [];
    let prev: TextLine | null = null;
    const flush = () => {
      if (paragraph.length) blocks.push(escapeStart(paragraph.join(" ").replace(/\s+/g, " ").trim()));
      paragraph = [];
    };

    for (const line of lines) {
      const text = line.text.trim();
      if (!text) continue;
      const level = headingLevel({ ...line, text }, body);
      if (level) {
        flush();
        // A heading that wraps onto a second line continues the same heading.
        const last = blocks[blocks.length - 1];
        const prevLevel = prev ? headingLevel(prev, body) : 0;
        if (prev && prevLevel === level && last?.startsWith("#".repeat(level) + " ") && line.y - prev.y < line.size * 1.8) {
          blocks[blocks.length - 1] = `${last} ${text}`;
        } else blocks.push(`${"#".repeat(level)} ${text}`);
      } else if (BULLET.test(text)) {
        flush();
        blocks.push(`- ${text.replace(BULLET, "")}`);
      } else if (NUMBERED.test(text) && /^\d/.test(text)) {
        flush();
        blocks.push(text.replace(/^(\d{1,3})[.)]\s+/, "$1. "));
      } else {
        const continues = prev && paragraph.length > 0 && line.y - prev.y < Math.max(prev.size, line.size) * 1.75 && Math.abs(line.size - prev.size) < 1;
        if (!continues) flush();
        const last = paragraph[paragraph.length - 1];
        if (last && /[a-z]-$/.test(last) && /^[a-z]/.test(text)) paragraph[paragraph.length - 1] = last.slice(0, -1) + text;
        else paragraph.push(text);
      }
      prev = { ...line, text };
    }
    flush();
  });

  // Lists: keep consecutive items together without blank lines between them.
  let out = "";
  blocks.forEach((block, i) => {
    const isItem = /^(- |\d+\. )/.test(block);
    const prevItem = i > 0 && /^(- |\d+\. )/.test(blocks[i - 1]);
    out += i === 0 ? block : `${isItem && prevItem ? "\n" : "\n\n"}${block}`;
  });
  return out ? `${out}\n` : "";
}
