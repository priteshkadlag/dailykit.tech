import { round2 } from "@/lib/format";

export type EquationSex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very-active";
export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, "very-active": 1.9 };

export function calculateTdee({ sex, age, weightKg, heightCm, activity }: { sex: EquationSex; age: number; weightKg: number; heightCm: number; activity: ActivityLevel }) {
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === "male" ? 5 : -161);
  return { bmr: Math.round(bmr), tdee: Math.round(bmr * ACTIVITY_FACTORS[activity]), factor: ACTIVITY_FACTORS[activity] };
}

export type FitnessGoal = "lose" | "maintain" | "gain";
export function calculateMacros(tdee: number, goal: FitnessGoal) {
  const calories = Math.round(tdee * (goal === "lose" ? 0.85 : goal === "gain" ? 1.1 : 1));
  const proteinCalories = calories * 0.25;
  const fatCalories = calories * 0.3;
  const carbCalories = calories - proteinCalories - fatCalories;
  return { calories, proteinGrams: Math.round(proteinCalories / 4), fatGrams: Math.round(fatCalories / 9), carbGrams: Math.round(carbCalories / 4) };
}

export function calculateOneRepMax(weight: number, reps: number) {
  const epley = reps === 1 ? weight : weight * (1 + reps / 30);
  const brzycki = reps === 1 ? weight : weight * (36 / (37 - reps));
  const estimate = (epley + brzycki) / 2;
  return {
    estimate: round2(estimate),
    epley: round2(epley),
    brzycki: round2(brzycki),
    percentages: [95, 90, 85, 80, 75, 70, 65, 60, 50].map((percent) => ({ percent, weight: round2(estimate * percent / 100) })),
  };
}

export function calculateDueDate(lmp: Date, cycleLength = 28) {
  const dayMs = 86_400_000;
  const dueDate = new Date(lmp.getTime() + (280 + cycleLength - 28) * dayMs);
  const conceptionDate = new Date(lmp.getTime() + (cycleLength - 14) * dayMs);
  return { dueDate, conceptionDate };
}
