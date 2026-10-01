/**
 * Extractive summary: picks the sentences that carry the document's most frequent content words
 * and returns them in their original order. Runs anywhere, needs no model, and never invents text.
 */

const STOPWORDS = new Set(
  (
    "a about above after again against all also am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up upon us very was we were what when where which while who whom why will with would you your yours yourself yourselves " +
    "shall may might must one two also however therefore thus page per via etc"
  ).split(/\s+/),
);

export type SummaryLength = "short" | "medium" | "long";

const SENTENCES: Record<SummaryLength, { min: number; max: number; ratio: number }> = {
  short: { min: 3, max: 5, ratio: 0.08 },
  medium: { min: 5, max: 10, ratio: 0.15 },
  long: { min: 8, max: 18, ratio: 0.25 },
};

/** Split text into sentences, keeping abbreviations like "Rs." and "e.g." together as best we can. */
export function splitSentences(text: string): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const parts = clean.match(/[^.!?।]+(?:[.!?।]+(?=\s|$)|$)/g) ?? [clean];
  const out: string[] = [];
  for (const raw of parts) {
    const s = raw.trim();
    if (!s) continue;
    const prev = out[out.length - 1];
    // Re-join after common abbreviations and initials ("Mr.", "Rs.", "No.", "A.").
    if (prev && /(\b(mr|mrs|ms|dr|rs|no|vs|etc|e\.g|i\.e|inc|ltd|pvt|st|jr|sr)|\b[A-Z])\.$/i.test(prev)) out[out.length - 1] = `${prev} ${s}`;
    else out.push(s);
  }
  return out;
}

const words = (s: string) => s.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];

/** The most frequent content words — a quick sense of what the document is about. */
export function keywords(text: string, count = 8): string[] {
  const freq = new Map<string, number>();
  for (const w of words(text)) if (w.length > 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w)) freq.set(w, (freq.get(w) ?? 0) + 1);
  return [...freq.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, count).map(([w]) => w);
}

export function summarize(text: string, length: SummaryLength = "medium"): string[] {
  const sentences = splitSentences(text).filter((s) => words(s).length >= 4 && words(s).length <= 80);
  if (sentences.length === 0) return [];
  const { min, max, ratio } = SENTENCES[length];
  const target = Math.min(sentences.length, Math.max(min, Math.min(max, Math.round(sentences.length * ratio))));

  const freq = new Map<string, number>();
  for (const s of sentences) for (const w of new Set(words(s))) if (!STOPWORDS.has(w) && w.length > 2) freq.set(w, (freq.get(w) ?? 0) + 1);
  const top = Math.max(1, ...freq.values());

  const scored = sentences.map((s, i) => {
    const content = words(s).filter((w) => !STOPWORDS.has(w) && w.length > 2);
    const weight = content.reduce((sum, w) => sum + (freq.get(w) ?? 0) / top, 0);
    // Favour sentences near the start (introductions state the point), and don't reward sheer length.
    const position = 1 + 0.5 * (1 - i / sentences.length);
    return { i, s, score: (weight / Math.sqrt(Math.max(content.length, 1))) * position };
  });

  const chosen: typeof scored = [];
  for (const candidate of [...scored].sort((a, b) => b.score - a.score)) {
    if (chosen.length >= target) break;
    // Skip near-duplicates (repeated headers, boilerplate).
    const set = new Set(words(candidate.s));
    const duplicate = chosen.some((c) => {
      const other = new Set(words(c.s));
      const shared = [...set].filter((w) => other.has(w)).length;
      return shared / Math.min(set.size, other.size) > 0.8;
    });
    if (!duplicate) chosen.push(candidate);
  }
  return chosen.sort((a, b) => a.i - b.i).map((c) => c.s);
}

/** Word count and an estimated reading time at 220 words a minute. */
export function readingStats(text: string) {
  const count = words(text).length;
  return { words: count, minutes: Math.max(1, Math.round(count / 220)) };
}
