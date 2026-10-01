import { round2 } from "@/lib/format";

export type GstMode = "exclusive" | "inclusive";
export type SupplyType = "intra" | "inter";

/** Common GST slabs: 5/18/40 after the Sept 2025 rationalisation, 12/28 kept for earlier invoices. */
export const GST_RATES = [0, 3, 5, 12, 18, 28, 40] as const;

export interface GstInput {
  amount: number;
  rate: number;
  mode: GstMode;
  supply: SupplyType;
}

export interface GstResult {
  baseAmount: number;
  gstAmount: number;
  totalAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
}

/**
 * Exclusive: `amount` is the taxable value; GST is added on top.
 * Inclusive: `amount` already contains GST; base = amount × 100 / (100 + rate).
 * Intra-state supply splits GST equally into CGST + SGST; inter-state is charged as IGST.
 */
export function calculateGst({ amount, rate, mode, supply }: GstInput): GstResult {
  let baseAmount: number;
  let gstAmount: number;

  if (mode === "exclusive") {
    baseAmount = round2(amount);
    gstAmount = round2((amount * rate) / 100);
  } else {
    baseAmount = round2((amount * 100) / (100 + rate));
    gstAmount = round2(amount - baseAmount);
  }

  const totalAmount = round2(baseAmount + gstAmount);

  if (supply === "inter") {
    return { baseAmount, gstAmount, totalAmount, cgst: 0, sgst: 0, igst: gstAmount, cgstRate: 0, sgstRate: 0, igstRate: rate };
  }

  // Split so the two halves always add back to the exact GST (odd paise go to SGST).
  const cgst = round2(gstAmount / 2);
  const sgst = round2(gstAmount - cgst);
  return { baseAmount, gstAmount, totalAmount, cgst, sgst, igst: 0, cgstRate: rate / 2, sgstRate: rate / 2, igstRate: 0 };
}
