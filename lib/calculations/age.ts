import {
  addMonths,
  addYears,
  differenceInCalendarDays,
  differenceInMonths,
  differenceInYears,
  isValid,
} from "date-fns";

export interface AgeResult {
  years: number;
  months: number;
  days: number;
  totalMonths: number;
  totalWeeks: number;
  remainingDaysAfterWeeks: number;
  totalDays: number;
  nextBirthday: Date;
  daysToNextBirthday: number;
  isBirthdayToday: boolean;
  turningAge: number;
}

/** Parse an `<input type="date">` value (yyyy-mm-dd) as a local calendar date, not UTC midnight. */
export function parseDateInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const date = new Date(y, m - 1, d);
  if (!isValid(date) || date.getMonth() !== m - 1) return null;
  return date;
}

export function toDateInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Calendar-accurate age. Leap-day birthdays are celebrated on 28 Feb in non-leap years
 * (date-fns clamps 29 Feb + 1 year to 28 Feb).
 */
export function calculateAge(dob: Date, asOf: Date): AgeResult {
  const years = differenceInYears(asOf, dob);
  const afterYears = addYears(dob, years);
  const months = differenceInMonths(asOf, afterYears);
  const afterMonths = addMonths(afterYears, months);
  const days = differenceInCalendarDays(asOf, afterMonths);

  const totalDays = differenceInCalendarDays(asOf, dob);
  const thisYearsBirthday = addYears(dob, years);
  const isBirthdayToday = differenceInCalendarDays(asOf, thisYearsBirthday) === 0 && totalDays > 0;
  const nextBirthday = isBirthdayToday ? thisYearsBirthday : addYears(dob, years + 1);

  return {
    years,
    months,
    days,
    totalMonths: differenceInMonths(asOf, dob),
    totalWeeks: Math.floor(totalDays / 7),
    remainingDaysAfterWeeks: totalDays % 7,
    totalDays,
    nextBirthday,
    daysToNextBirthday: differenceInCalendarDays(nextBirthday, asOf),
    isBirthdayToday,
    turningAge: isBirthdayToday ? years : years + 1,
  };
}
