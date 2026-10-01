import { describe, expect, it } from "vitest";
import { cgpaToPercent, weightedAverage } from "@/lib/calculations/education";
import { UNIT_CATEGORIES, convertUnit, formatUnitValue, getUnit } from "@/lib/calculations/units";

const conv = (v: number, cat: string, from: string, to: string) => convertUnit(v, getUnit(cat, from)!, getUnit(cat, to)!);

describe("unit converter", () => {
  it("converts common units", () => {
    expect(conv(1, "length", "mi", "km")).toBeCloseTo(1.609344, 9);
    expect(conv(5, "length", "ft", "cm")).toBeCloseTo(152.4, 9);
    expect(conv(100, "temperature", "c", "f")).toBeCloseTo(212, 9);
    expect(conv(-40, "temperature", "f", "c")).toBeCloseTo(-40, 9);
    expect(conv(0, "temperature", "c", "k")).toBeCloseTo(273.15, 9);
    expect(conv(1, "area", "acre", "guntha")).toBeCloseTo(40, 9);
    expect(conv(1, "area", "acre", "cent")).toBeCloseTo(100, 9);
    expect(conv(1, "area", "yd2", "ft2")).toBeCloseTo(9, 9);
    expect(conv(10, "weight", "g", "tola")).toBeCloseTo(0.857353, 5);
    expect(conv(100, "speed", "kmph", "mps")).toBeCloseTo(27.7778, 4);
    expect(conv(1, "energy", "kwh", "j")).toBe(3.6e6);
  });
  it("handles inverse fuel units", () => {
    expect(conv(20, "fuel", "kmpl", "l100")).toBeCloseTo(5, 9);
    expect(conv(5, "fuel", "l100", "kmpl")).toBeCloseTo(20, 9);
    expect(conv(10, "fuel", "kmpl", "mpgus")).toBeCloseTo(23.5215, 3);
  });
  it("round-trips every unit", () => {
    for (const category of UNIT_CATEGORIES) for (const unit of category.units) expect(unit.fromBase(unit.toBase(7.5))).toBeCloseTo(7.5, 9);
  });
  it("formats values", () => {
    expect(formatUnitValue(1609.344)).toBe("1,609.344");
    expect(formatUnitValue(0.1 + 0.2)).toBe("0.3");
    expect(formatUnitValue(1e-12)).toBe("1e-12");
  });
});

describe("CGPA", () => {
  it("weights by credits", () => {
    expect(weightedAverage([{ points: 9, credits: 4 }, { points: 7, credits: 2 }]).average).toBeCloseTo(8.3333, 4);
    expect(weightedAverage([{ points: 8, credits: 0 }]).average).toBe(0);
  });
  it("converts to percentage", () => {
    expect(cgpaToPercent(8, "x9.5")).toBe(76);
    expect(cgpaToPercent(8, "aicte")).toBe(72.5);
    expect(cgpaToPercent(3.2, "ratio", 4)).toBe(80);
    expect(cgpaToPercent(10.5, "x10")).toBe(100);
  });
});
