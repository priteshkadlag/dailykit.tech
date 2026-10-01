export type DiffOp = { type: "equal" | "added" | "removed"; text: string };

/** Longest-common-subsequence diff. Inputs beyond `limit` cells fall back to a coarser match. */
export function diffSequences(a: string[], b: string[], limit = 4_000_000): DiffOp[] {
  // Trim common head and tail — cheap, and it keeps the table small for mostly-equal documents.
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }
  const head: DiffOp[] = a.slice(0, start).map((text) => ({ type: "equal", text }));
  const tail: DiffOp[] = a.slice(endA).map((text) => ({ type: "equal", text }));
  const midA = a.slice(start, endA);
  const midB = b.slice(start, endB);
  const n = midA.length;
  const m = midB.length;

  let middle: DiffOp[];
  if (n * m > limit) {
    // Too large for a full table: report the changed region as replaced.
    middle = [...midA.map((text) => ({ type: "removed" as const, text })), ...midB.map((text) => ({ type: "added" as const, text }))];
  } else {
    const w = m + 1;
    const table = new Uint32Array((n + 1) * w);
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        table[i * w + j] = midA[i] === midB[j] ? table[(i + 1) * w + j + 1] + 1 : Math.max(table[(i + 1) * w + j], table[i * w + j + 1]);
      }
    }
    middle = [];
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
      if (midA[i] === midB[j]) {
        middle.push({ type: "equal", text: midA[i] });
        i++;
        j++;
      } else if (table[(i + 1) * w + j] >= table[i * w + j + 1]) middle.push({ type: "removed", text: midA[i++] });
      else middle.push({ type: "added", text: midB[j++] });
    }
    while (i < n) middle.push({ type: "removed", text: midA[i++] });
    while (j < m) middle.push({ type: "added", text: midB[j++] });
  }
  return [...head, ...middle, ...tail];
}

/** Normalise a line for comparison: collapse whitespace so re-flowed spacing doesn't count as a change. */
export const normalizeLine = (line: string) => line.replace(/\s+/g, " ").trim();

export type LineChange =
  | { type: "equal"; text: string }
  | { type: "added"; text: string }
  | { type: "removed"; text: string }
  /** A removed line and an added line that are versions of each other, with word-level detail. */
  | { type: "changed"; before: string; after: string; words: DiffOp[] };

/** Line diff with removed/added pairs merged into "changed" lines that show which words differ. */
export function compareTexts(a: string[], b: string[]): { changes: LineChange[]; added: number; removed: number; changed: number } {
  const ops = diffSequences(a.map(normalizeLine).filter(Boolean), b.map(normalizeLine).filter(Boolean));
  const changes: LineChange[] = [];
  let k = 0;
  while (k < ops.length) {
    if (ops[k].type === "equal") {
      changes.push(ops[k] as LineChange);
      k++;
      continue;
    }
    const removed: string[] = [];
    const added: string[] = [];
    while (k < ops.length && ops[k].type !== "equal") (ops[k].type === "removed" ? removed : added).push(ops[k++].text);
    const pairs = Math.min(removed.length, added.length);
    for (let p = 0; p < pairs; p++) {
      const words = diffSequences(removed[p].split(" "), added[p].split(" "));
      const same = words.filter((w) => w.type === "equal").length;
      // Only call it an edit when the lines still share most words; otherwise it's a remove + add.
      if (same / Math.max(removed[p].split(" ").length, added[p].split(" ").length) >= 0.4) changes.push({ type: "changed", before: removed[p], after: added[p], words });
      else changes.push({ type: "removed", text: removed[p] }, { type: "added", text: added[p] });
    }
    removed.slice(pairs).forEach((text) => changes.push({ type: "removed", text }));
    added.slice(pairs).forEach((text) => changes.push({ type: "added", text }));
  }
  return {
    changes,
    added: changes.filter((c) => c.type === "added").length,
    removed: changes.filter((c) => c.type === "removed").length,
    changed: changes.filter((c) => c.type === "changed").length,
  };
}
