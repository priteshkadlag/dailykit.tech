import { describe, expect, it } from "vitest";
import { calculateDueDate, calculateMacros, calculateOneRepMax, calculateTdee } from "./health";

describe("health calculator formulas", () => {
  it("uses the Mifflin-St Jeor equation and activity factor", () => {
    expect(calculateTdee({ sex: "male", age: 30, weightKg: 80, heightCm: 180, activity: "moderate" })).toEqual({ bmr: 1780, tdee: 2759, factor: 1.55 });
  });
  it("creates balanced macros from a goal-adjusted target", () => {
    expect(calculateMacros(2000, "maintain")).toEqual({ calories: 2000, proteinGrams: 125, fatGrams: 67, carbGrams: 225 });
  });
  it("estimates 1RM from Epley and Brzycki formulas", () => {
    expect(calculateOneRepMax(100, 5).estimate).toBeCloseTo(114.58, 2);
  });
  it("adds 280 days for a 28-day cycle", () => {
    expect(calculateDueDate(new Date("2026-01-01T00:00:00Z")).dueDate.toISOString().slice(0, 10)).toBe("2026-10-08");
  });
});
