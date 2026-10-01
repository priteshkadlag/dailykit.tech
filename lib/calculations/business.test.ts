import { describe, expect, it } from "vitest";
import { calculateDocumentTotals, isValidGstin } from "./document";
import { calculateProfit, targetSellingPrice } from "./profit";
import { calculateShipping, DEFAULT_RATE_CARD } from "./shipping";
import { amountInWords, integerToIndianWords } from "./words";

describe("Document totals", () => {
  const items = [
    { qty: 2, rate: 500, discount: 10, gstRate: 18 }, // gross 1000, disc 100, taxable 900, gst 162
    { qty: 3, rate: 99.99, discount: 0, gstRate: 5 }, // gross 299.97, gst 15.00 (14.9985)
  ];

  it("computes intra-state GST invoice totals", () => {
    const t = calculateDocumentTotals(items, { gst: true, supply: "intra", roundOff: false });
    expect(t.subtotal).toBe(1299.97);
    expect(t.discount).toBe(100);
    expect(t.taxable).toBe(1199.97);
    expect(t.totalTax).toBe(177);
    expect(t.cgst).toBe(88.5);
    expect(t.sgst).toBe(88.5);
    expect(t.igst).toBe(0);
    expect(t.grandTotal).toBe(1376.97);
    expect(t.byRate.map((r) => r.rate)).toEqual([5, 18]);
    // Printed lines must add up to printed totals.
    expect(t.lines.reduce((s, l) => s + l.total, 0)).toBeCloseTo(t.grandTotal, 10);
  });

  it("uses IGST for inter-state and rounds off", () => {
    const t = calculateDocumentTotals(items, { gst: true, supply: "inter", roundOff: true });
    expect(t.igst).toBe(177);
    expect(t.cgst).toBe(0);
    expect(t.grandTotal).toBe(1377);
    expect(t.roundOff).toBe(0.03);
  });

  it("ignores GST on a non-GST invoice", () => {
    const t = calculateDocumentTotals(items, { gst: false, supply: "intra", roundOff: false });
    expect(t.totalTax).toBe(0);
    expect(t.byRate).toEqual([]);
    expect(t.grandTotal).toBe(1199.97);
  });

  it("validates GSTIN format", () => {
    expect(isValidGstin("27AAPFU0939F1ZV")).toBe(true);
    expect(isValidGstin("27aapfu0939f1zv")).toBe(true);
    expect(isValidGstin("27AAPFU0939F1Z")).toBe(false);
  });
});

describe("Amount in words", () => {
  it("uses lakh and crore", () => {
    expect(integerToIndianWords(120050)).toBe("One Lakh Twenty Thousand Fifty");
    expect(integerToIndianWords(12345678)).toBe("One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight");
    expect(amountInWords(1376.97)).toBe("Rupees One Thousand Three Hundred Seventy Six and Ninety Seven Paise Only");
    expect(amountInWords(0)).toBe("Rupees Zero Only");
  });
});

describe("Profit", () => {
  const base = { purchasePrice: 200, quantity: 10, shipping: 20, packaging: 10, gatewayFeePercent: 2, marketing: 300, other: 200 };

  it("computes profit, margin and markup", () => {
    const r = calculateProfit({ ...base, sellingPrice: 400 });
    expect(r.revenue).toBe(4000);
    expect(r.gatewayFee).toBe(80);
    expect(r.totalCost).toBe(2000 + 300 + 80 + 500);
    expect(r.profit).toBe(1120);
    expect(r.marginPercent).toBeCloseTo(28);
    expect(r.markupPercent).toBeCloseTo((1120 / 2880) * 100);
    expect(r.costPerUnit).toBe(288);
  });

  it("finds a target price that hits the margin and markup exactly", () => {
    const sp = targetSellingPrice(base, 25, "margin");
    expect(calculateProfit({ ...base, sellingPrice: sp }).marginPercent).toBeCloseTo(25, 1);
    const sp2 = targetSellingPrice(base, 40, "markup");
    expect(calculateProfit({ ...base, sellingPrice: sp2 }).markupPercent).toBeCloseTo(40, 1);
    expect(targetSellingPrice(base, 99, "margin")).toBeNaN();
  });

  it("break-even price gives zero profit", () => {
    const r = calculateProfit({ ...base, sellingPrice: 400 });
    expect(calculateProfit({ ...base, sellingPrice: r.breakEvenPrice }).profit).toBeCloseTo(0, 0);
  });
});

describe("Shipping", () => {
  const input = { weightKg: 1.2, lengthCm: 30, widthCm: 20, heightCm: 15, zone: "national" as const, mode: "surface" as const, cod: false, orderValue: 0, packaging: 0, includeGst: false };

  it("charges on volumetric weight when it is higher", () => {
    const q = calculateShipping(input);
    expect(q.volumetricWeight).toBe(1.8); // 30*20*15/5000
    expect(q.chargeableWeight).toBe(2);
    expect(q.freight).toBe(52 + 3 * 45);
  });

  it("rounds up to the next 0.5 kg slab without float drift", () => {
    expect(calculateShipping({ ...input, weightKg: 1.5, lengthCm: 1, widthCm: 1, heightCm: 1 }).chargeableWeight).toBe(1.5);
    expect(calculateShipping({ ...input, weightKg: 0.1, lengthCm: 1, widthCm: 1, heightCm: 1 }).chargeableWeight).toBe(0.5);
  });

  it("applies COD minimum, GST and packaging", () => {
    const q = calculateShipping({ ...input, weightKg: 0.4, lengthCm: 10, widthCm: 10, heightCm: 10, cod: true, orderValue: 1000, includeGst: true, packaging: 15 });
    expect(q.codCharge).toBe(DEFAULT_RATE_CARD.codFixed); // 2% of 1000 = 20 < 35
    expect(q.gst).toBe(round((52 + 35) * 0.18));
    expect(q.total).toBe(round(52 + 35 + (52 + 35) * 0.18 + 15));
  });
});

function round(n: number) {
  return Math.round(n * 100) / 100;
}
