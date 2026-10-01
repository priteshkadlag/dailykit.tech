/** CGPA / SGPA maths and common CGPA-to-percentage conversions. */

export interface GradeRow { points: number; credits: number }

/** Credit-weighted average (SGPA from subjects, or CGPA from semesters). Rows with no credits are ignored. */
export function weightedAverage(rows: GradeRow[]) {
  const counted = rows.filter((r) => r.credits > 0 && Number.isFinite(r.points));
  const credits = counted.reduce((sum, r) => sum + r.credits, 0);
  const points = counted.reduce((sum, r) => sum + r.points * r.credits, 0);
  return { average: credits ? points / credits : 0, credits, points };
}

/** The UGC/AICTE 10-point letter-grade scale used by most Indian universities. */
export const TEN_POINT_GRADES = [
  { grade: "O", points: 10 }, { grade: "A+", points: 9 }, { grade: "A", points: 8 }, { grade: "B+", points: 7 },
  { grade: "B", points: 6 }, { grade: "C", points: 5 }, { grade: "P", points: 4 }, { grade: "F", points: 0 },
];

export const PERCENT_FORMULAS = [
  { id: "x9.5", name: "CGPA × 9.5", note: "CBSE and many universities", apply: (cgpa: number) => cgpa * 9.5 },
  { id: "x10", name: "CGPA × 10", note: "Anna University and others", apply: (cgpa: number) => cgpa * 10 },
  { id: "aicte", name: "(CGPA − 0.75) × 10", note: "AICTE, VTU", apply: (cgpa: number) => (cgpa - 0.75) * 10 },
  { id: "ratio", name: "CGPA ÷ scale × 100", note: "Simple proportion", apply: (cgpa: number, scale: number) => (cgpa / scale) * 100 },
] as const;
export type PercentFormula = (typeof PERCENT_FORMULAS)[number]["id"];

export function cgpaToPercent(cgpa: number, formula: PercentFormula, scale = 10) {
  const f = PERCENT_FORMULAS.find((p) => p.id === formula)!;
  return Math.min(100, Math.max(0, f.apply(cgpa, scale)));
}
