const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const inrWholeFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** ₹1,23,456.70 — Indian digit grouping. */
export function formatINR(value: number, { whole = false } = {}) {
  return (whole ? inrWholeFormatter : inrFormatter).format(value);
}

export function formatUSD(value: number) {
  return usdFormatter.format(value);
}

export function formatNumber(value: number) {
  return numberFormatter.format(value);
}

export function formatPercent(value: number) {
  return `${numberFormatter.format(value)}%`;
}

/** Round to 2 decimal places (paise), avoiding binary floating-point drift like 1.005 → 1.00. */
export function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Parse a user-typed number, tolerating Indian thousands separators. Returns NaN for empty input. */
export function parseNumber(input: string) {
  const cleaned = input.replace(/[,\s₹]/g, "");
  if (cleaned === "") return NaN;
  return Number(cleaned);
}
