import { round2 } from "@/lib/format";

export interface LineInput {
  qty: number;
  rate: number;
  /** Line discount in percent. */
  discount: number;
  gstRate: number;
}

export interface LineTotals {
  gross: number;
  discount: number;
  taxable: number;
  gst: number;
  total: number;
}

export interface TaxRateSummary {
  rate: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
}

export interface DocumentTotals {
  lines: LineTotals[];
  subtotal: number;
  discount: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
  byRate: TaxRateSummary[];
}

interface DocumentTotalsOptions {
  /** When false, GST is ignored entirely (non-GST invoice / bill of supply). */
  gst: boolean;
  supply: "intra" | "inter";
  /** Round the grand total to the nearest rupee and show the difference as "Round off". */
  roundOff: boolean;
}

/**
 * Each line is rounded to paise first and totals are sums of the rounded lines, so the
 * figures printed on every row always add up to the printed totals.
 * Tax is computed per GST rate (as returns are filed), then split into CGST/SGST or IGST.
 */
export function calculateDocumentTotals(items: LineInput[], { gst, supply, roundOff }: DocumentTotalsOptions): DocumentTotals {
  const lines = items.map(({ qty, rate, discount, gstRate }) => {
    const gross = round2(qty * rate);
    const disc = round2((gross * discount) / 100);
    const taxable = round2(gross - disc);
    const tax = gst ? round2((taxable * gstRate) / 100) : 0;
    return { gross, discount: disc, taxable, gst: tax, total: round2(taxable + tax) };
  });

  const rateMap = new Map<number, number>();
  if (gst) {
    items.forEach((item, i) => rateMap.set(item.gstRate, round2((rateMap.get(item.gstRate) ?? 0) + lines[i].taxable)));
  }
  const byRate: TaxRateSummary[] = [...rateMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([rate, taxable]) => {
      const lineTax = round2(
        lines.reduce((sum, line, i) => (items[i].gstRate === rate ? sum + line.gst : sum), 0),
      );
      if (supply === "inter") return { rate, taxable, cgst: 0, sgst: 0, igst: lineTax };
      const cgst = round2(lineTax / 2);
      return { rate, taxable, cgst, sgst: round2(lineTax - cgst), igst: 0 };
    });

  const sum = (pick: (l: LineTotals) => number) => round2(lines.reduce((s, l) => s + pick(l), 0));
  const subtotal = sum((l) => l.gross);
  const discount = sum((l) => l.discount);
  const taxable = sum((l) => l.taxable);
  const cgst = round2(byRate.reduce((s, r) => s + r.cgst, 0));
  const sgst = round2(byRate.reduce((s, r) => s + r.sgst, 0));
  const igst = round2(byRate.reduce((s, r) => s + r.igst, 0));
  const totalTax = round2(cgst + sgst + igst);
  const exact = round2(taxable + totalTax);
  const grandTotal = roundOff ? Math.round(exact) : exact;

  return {
    lines,
    subtotal,
    discount,
    taxable,
    cgst,
    sgst,
    igst,
    totalTax,
    roundOff: round2(grandTotal - exact),
    grandTotal,
    byRate: byRate.filter((r) => r.taxable !== 0 || r.cgst + r.sgst + r.igst !== 0),
  };
}

/** Format check for a 15-character GSTIN: state code, PAN, entity number, "Z", checksum. */
export function isValidGstin(value: string) {
  return /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(value.trim().toUpperCase());
}
