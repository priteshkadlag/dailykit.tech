/** Fair random integer in [0, max) from the Web Crypto API, using rejection sampling to avoid modulo bias. */
export function secureRandomInt(max: number): number {
  if (!Number.isInteger(max) || max <= 0 || max > 2 ** 32) throw new RangeError("max must be an integer from 1 to 2^32");
  const limit = Math.floor(2 ** 32 / max) * max;
  const buffer = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buffer);
    if (buffer[0] < limit) return buffer[0] % max;
  }
}

/** Fisher–Yates shuffle with secure randomness; returns a new array. */
export function secureShuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Picks `count` distinct items (or all of them, if there are fewer). */
export function pickRandom<T>(items: readonly T[], count = 1): T[] {
  return secureShuffle(items).slice(0, Math.max(0, count));
}

/** Splits pasted text into entries: one per line, or comma-separated when it's a single line. */
export function parseEntries(text: string): string[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 1 && lines[0].includes(",")) return lines[0].split(",").map((s) => s.trim()).filter(Boolean);
  return lines;
}

/**
 * Wheel rotation (degrees, clockwise) that brings segment `index` of `count` under a pointer at the top,
 * after at least `turns` full turns from the current rotation. `jitter` (0–1) offsets within the segment.
 */
export function wheelRotation(current: number, index: number, count: number, turns = 5, jitter = 0.5) {
  const segment = 360 / count;
  const target = 360 - (index + jitter) * segment; // where the wheel must stop, modulo 360
  const base = current - (current % 360) + turns * 360;
  return base + ((target % 360) + 360) % 360;
}
