import { round2 } from "@/lib/format";

export interface ProfitInput {
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  /** Per unit. */
  shipping: number;
  /** Per unit. */
  packaging: number;
  /** Percent of revenue (payment gateway / marketplace fee). */
  gatewayFeePercent: number;
  /** Total for the whole quantity. */
  marketing: number;
  /** Total for the whole quantity. */
  other: number;
}

export interface ProfitResult {
  revenue: number;
  productCost: number;
  shippingPackaging: number;
  gatewayFee: number;
  overheads: number;
  totalCost: number;
  profit: number;
  /** Profit as % of revenue. */
  marginPercent: number;
  /** Profit as % of total cost. */
  markupPercent: number;
  costPerUnit: number;
  profitPerUnit: number;
  /** Selling price per unit at which profit is exactly zero. */
  breakEvenPrice: number;
}

/** Costs that don't depend on the selling price. */
function fixedCosts(i: Omit<ProfitInput, "sellingPrice">) {
  return i.quantity * (i.purchasePrice + i.shipping + i.packaging) + i.marketing + i.other;
}

export function calculateProfit(input: ProfitInput): ProfitResult {
  const { quantity, sellingPrice, gatewayFeePercent } = input;
  const revenue = sellingPrice * quantity;
  const productCost = input.purchasePrice * quantity;
  const shippingPackaging = (input.shipping + input.packaging) * quantity;
  const gatewayFee = (revenue * gatewayFeePercent) / 100;
  const overheads = input.marketing + input.other;
  const totalCost = productCost + shippingPackaging + gatewayFee + overheads;
  const profit = revenue - totalCost;
  const fee = gatewayFeePercent / 100;

  return {
    revenue: round2(revenue),
    productCost: round2(productCost),
    shippingPackaging: round2(shippingPackaging),
    gatewayFee: round2(gatewayFee),
    overheads: round2(overheads),
    totalCost: round2(totalCost),
    profit: round2(profit),
    marginPercent: revenue === 0 ? 0 : (profit / revenue) * 100,
    markupPercent: totalCost === 0 ? 0 : (profit / totalCost) * 100,
    costPerUnit: round2(totalCost / quantity),
    profitPerUnit: round2(profit / quantity),
    breakEvenPrice: fee >= 1 ? NaN : round2(fixedCosts(input) / (quantity * (1 - fee))),
  };
}

/**
 * Selling price per unit that achieves a target profit.
 * - "margin": profit = target% of revenue  →  SP = F / (q·(1 − fee − m))
 * - "markup": profit = target% of total cost  →  SP = F·(1 + k) / (q·(1 − fee·(1 + k)))
 * where F is the price-independent cost. Returns NaN when the target is unreachable
 * (e.g. a 100% margin, or fees that eat the entire price).
 */
export function targetSellingPrice(
  input: Omit<ProfitInput, "sellingPrice">,
  targetPercent: number,
  basis: "margin" | "markup",
) {
  const F = fixedCosts(input);
  const fee = input.gatewayFeePercent / 100;
  const t = targetPercent / 100;
  const denominator = basis === "margin" ? input.quantity * (1 - fee - t) : input.quantity * (1 - fee * (1 + t));
  if (denominator <= 0) return NaN;
  const numerator = basis === "margin" ? F : F * (1 + t);
  return round2(numerator / denominator);
}
