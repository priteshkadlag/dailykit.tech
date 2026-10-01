import { round2 } from "@/lib/format";

export type ShippingZone = "local" | "regional" | "metro" | "national" | "special";
export type ShippingMode = "surface" | "express";

export const ZONES: { value: ShippingZone; label: string; hint: string }[] = [
  { value: "local", label: "Local", hint: "Within the same city" },
  { value: "regional", label: "Within state", hint: "Different city, same state" },
  { value: "metro", label: "Metro to metro", hint: "Between major metro cities" },
  { value: "national", label: "Rest of India", hint: "Anywhere else in India" },
  { value: "special", label: "Special zone", hint: "North-East, J&K, islands" },
];

/** Price for the first 0.5 kg slab and for each additional 0.5 kg, per zone and mode. */
export interface RateCard {
  volumetricDivisor: Record<ShippingMode, number>;
  rates: Record<ShippingMode, Record<ShippingZone, { base: number; additional: number }>>;
  codFixed: number;
  codPercent: number;
  gstPercent: number;
}

/**
 * Illustrative rate card in the range typical of Indian courier aggregators.
 * Every value is editable in the UI so users can enter their own courier's rates.
 */
export const DEFAULT_RATE_CARD: RateCard = {
  volumetricDivisor: { surface: 5000, express: 5000 },
  rates: {
    surface: {
      local: { base: 30, additional: 25 },
      regional: { base: 38, additional: 32 },
      metro: { base: 45, additional: 40 },
      national: { base: 52, additional: 45 },
      special: { base: 68, additional: 60 },
    },
    express: {
      local: { base: 40, additional: 35 },
      regional: { base: 55, additional: 48 },
      metro: { base: 70, additional: 62 },
      national: { base: 82, additional: 75 },
      special: { base: 105, additional: 95 },
    },
  },
  codFixed: 35,
  codPercent: 2,
  gstPercent: 18,
};

export interface ShippingInput {
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  zone: ShippingZone;
  mode: ShippingMode;
  cod: boolean;
  orderValue: number;
  packaging: number;
  includeGst: boolean;
}

export interface ShippingQuote {
  actualWeight: number;
  volumetricWeight: number;
  chargeableWeight: number;
  slabs: number;
  freight: number;
  codCharge: number;
  gst: number;
  packaging: number;
  total: number;
}

/**
 * Courier APIs (Shiprocket, Delhivery, etc.) can implement this interface later;
 * the calculator UI only depends on it, not on the local rate card.
 */
export interface ShippingRateProvider {
  id: string;
  name: string;
  quote(input: ShippingInput): Promise<ShippingQuote>;
}

const SLAB_KG = 0.5;

export function volumetricWeight(l: number, w: number, h: number, divisor: number) {
  return (l * w * h) / divisor;
}

export function calculateShipping(input: ShippingInput, card: RateCard = DEFAULT_RATE_CARD): ShippingQuote {
  const volumetric = volumetricWeight(input.lengthCm, input.widthCm, input.heightCm, card.volumetricDivisor[input.mode]);
  const heavier = Math.max(input.weightKg, volumetric);
  // Couriers bill in 0.5 kg slabs, rounding up. The small epsilon stops 1.5000000001 becoming 2 kg.
  const slabs = Math.max(1, Math.ceil(heavier / SLAB_KG - 1e-9));
  const chargeableWeight = slabs * SLAB_KG;
  const { base, additional } = card.rates[input.mode][input.zone];
  const freight = base + (slabs - 1) * additional;
  const codCharge = input.cod ? Math.max(card.codFixed, (input.orderValue * card.codPercent) / 100) : 0;
  const gst = input.includeGst ? ((freight + codCharge) * card.gstPercent) / 100 : 0;
  const total = freight + codCharge + gst + input.packaging;

  return {
    actualWeight: round2(input.weightKg),
    volumetricWeight: round2(volumetric),
    chargeableWeight,
    slabs,
    freight: round2(freight),
    codCharge: round2(codCharge),
    gst: round2(gst),
    packaging: round2(input.packaging),
    total: round2(total),
  };
}

export const localRateCardProvider = (card: RateCard): ShippingRateProvider => ({
  id: "rate-card",
  name: "Your rate card",
  quote: async (input) => calculateShipping(input, card),
});
