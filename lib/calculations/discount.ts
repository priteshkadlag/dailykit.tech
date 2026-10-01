import { round2 } from "@/lib/format";

export interface DiscountResult {
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  /** Effective single discount percent (useful for stacked offers). */
  effectivePercent: number;
}

export function applyDiscount(price: number, percent: number): DiscountResult {
  const finalPrice = round2(price * (1 - percent / 100));
  return {
    originalPrice: round2(price),
    discountAmount: round2(price - finalPrice),
    finalPrice,
    effectivePercent: percent,
  };
}

export interface MultiDiscountStep {
  percent: number;
  discount: number;
  priceAfter: number;
}

/**
 * Successive discounts apply one after another on the reduced price, so
 * 20% + 10% is an effective 28% — not 30%.
 */
export function applyMultipleDiscounts(price: number, percents: number[]) {
  let current = price;
  const steps: MultiDiscountStep[] = percents.map((percent) => {
    const discount = current * (percent / 100);
    current -= discount;
    return { percent, discount: round2(discount), priceAfter: round2(current) };
  });
  const finalPrice = round2(current);
  const result: DiscountResult = {
    originalPrice: round2(price),
    discountAmount: round2(price - finalPrice),
    finalPrice,
    effectivePercent: price === 0 ? 0 : ((price - current) / price) * 100,
  };
  return { ...result, steps };
}

export interface DiscountGstResult {
  originalPrice: number;
  discountAmount: number;
  priceAfterDiscount: number;
  gstAmount: number;
  finalPrice: number;
}

/**
 * GST is charged on the transaction value after a pre-agreed discount shown on the invoice,
 * so the discount is applied first and GST is calculated on the reduced price.
 * When `gstIncluded` is true, `price` is an MRP that already contains GST.
 */
export function applyDiscountWithGst(
  price: number,
  discountPercent: number,
  gstRate: number,
  gstIncluded: boolean,
): DiscountGstResult {
  const taxableBeforeDiscount = gstIncluded ? price / (1 + gstRate / 100) : price;
  const taxable = taxableBeforeDiscount * (1 - discountPercent / 100);
  const gstAmount = round2(taxable * (gstRate / 100));
  const priceAfterDiscount = round2(taxable);
  const finalPrice = round2(priceAfterDiscount + gstAmount);
  return {
    originalPrice: round2(price),
    // Show the saving the way the customer sees it: off the MRP when GST is included, off the pre-tax price otherwise.
    discountAmount: gstIncluded ? round2(price - finalPrice) : round2(taxableBeforeDiscount - taxable),
    priceAfterDiscount,
    gstAmount,
    finalPrice,
  };
}
