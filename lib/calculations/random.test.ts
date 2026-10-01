import { describe, expect, it } from "vitest";
import { parseEntries, pickRandom, secureRandomInt, secureShuffle, wheelRotation } from "@/lib/calculations/random";

describe("random helpers", () => {
  it("stays in range and is roughly uniform", () => {
    const counts = [0, 0, 0];
    for (let i = 0; i < 30_000; i++) counts[secureRandomInt(3)]++;
    for (const c of counts) expect(c).toBeGreaterThan(9_000);
    expect(() => secureRandomInt(0)).toThrow();
  });
  it("shuffles without losing items and picks distinct entries", () => {
    const items = ["a", "b", "c", "d", "e"];
    expect(secureShuffle(items).sort()).toEqual(items);
    const picked = pickRandom(items, 3);
    expect(new Set(picked).size).toBe(3);
    expect(pickRandom(items, 9)).toHaveLength(5);
  });
  it("parses lines or a comma list", () => {
    expect(parseEntries("Asha\n\n Ravi \nMeera")).toEqual(["Asha", "Ravi", "Meera"]);
    expect(parseEntries("red, green ,blue")).toEqual(["red", "green", "blue"]);
  });
  it("lands the chosen segment under the top pointer", () => {
    for (const [index, count] of [[0, 4], [3, 4], [2, 7], [9, 10]]) {
      const rotation = wheelRotation(123, index, count);
      expect(rotation).toBeGreaterThanOrEqual(123 + 4 * 360);
      // The segment's centre, rotated, must sit at 0° (the top).
      const centre = (index + 0.5) * (360 / count);
      expect(((centre + rotation) % 360 + 360) % 360).toBeCloseTo(0, 6);
    }
  });
});
