/** What is `percent`% of `value`? */
export function percentOf(percent: number, value: number) {
  return (percent / 100) * value;
}

/** `part` is what percent of `whole`? Returns NaN when `whole` is 0. */
export function whatPercent(part: number, whole: number) {
  if (whole === 0) return NaN;
  return (part / whole) * 100;
}

/** Percentage change from `from` to `to` — positive is an increase, negative a decrease. NaN when `from` is 0. */
export function percentChange(from: number, to: number) {
  if (from === 0) return NaN;
  return ((to - from) / Math.abs(from)) * 100;
}

/** Increase (positive `percent`) or decrease (negative `percent`) `value` by a percentage. */
export function applyPercent(value: number, percent: number) {
  return value * (1 + percent / 100);
}
