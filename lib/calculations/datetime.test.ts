import { describe, expect, it } from "vitest";
import {
  addBusinessDays, clockDifference, dateDifference, dayShift, formatDuration, formatOffset, instantToZonedInput, parseClock, shiftDate, zoneOffset, zonedTimeToInstant,
} from "@/lib/calculations/datetime";

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

describe("date difference", () => {
  it("splits into years, months and days", () => {
    const r = dateDifference(d(2024, 1, 31), d(2026, 3, 15));
    expect([r.years, r.months, r.days]).toEqual([2, 1, 15]);
    expect(r.totalDays).toBe(774);
  });
  it("counts business days and can include the end date", () => {
    // Mon 5 Oct 2026 → Mon 12 Oct 2026: 5 weekdays; inclusive adds the second Monday.
    expect(dateDifference(d(2026, 10, 5), d(2026, 10, 12)).businessDays).toBe(5);
    const inclusive = dateDifference(d(2026, 10, 5), d(2026, 10, 12), { includeEnd: true });
    expect([inclusive.totalDays, inclusive.businessDays]).toEqual([8, 6]);
  });
  it("handles reversed dates", () => {
    const r = dateDifference(d(2026, 12, 25), d(2026, 1, 1));
    expect(r.reversed).toBe(true);
    expect(r.totalDays).toBe(358);
  });
  it("adds and subtracts", () => {
    expect(shiftDate(d(2026, 1, 31), { months: 1 })).toEqual(d(2026, 2, 28));
    expect(shiftDate(d(2026, 3, 1), { days: 1 }, -1)).toEqual(d(2026, 2, 28));
    expect(addBusinessDays(d(2026, 10, 2), 1)).toEqual(d(2026, 10, 5)); // Friday → Monday
  });
});

describe("time difference", () => {
  it("parses clock times", () => {
    expect(parseClock("09:30")).toBe(34_200);
    expect(parseClock("23:59:59")).toBe(86_399);
    expect(parseClock("24:00")).toBeNull();
  });
  it("wraps past midnight and subtracts breaks", () => {
    expect(clockDifference(parseClock("22:00")!, parseClock("06:30")!)).toEqual({ seconds: 30_600, overnight: true });
    expect(clockDifference(parseClock("09:00")!, parseClock("18:00")!, 3600).seconds).toBe(28_800);
  });
  it("formats durations", () => {
    expect(formatDuration(30_600)).toBe("8 hours, 30 minutes");
    expect(formatDuration(90_061)).toBe("1 day, 1 hour, 1 minute, 1 second");
  });
});

describe("time zones", () => {
  it("knows offsets, including half hours and DST", () => {
    expect(zoneOffset("Asia/Kolkata", new Date("2026-07-01T00:00:00Z"))).toBe(330);
    expect(zoneOffset("Asia/Kathmandu", new Date("2026-07-01T00:00:00Z"))).toBe(345);
    expect(zoneOffset("America/New_York", new Date("2026-07-01T00:00:00Z"))).toBe(-240);
    expect(zoneOffset("America/New_York", new Date("2026-01-15T00:00:00Z"))).toBe(-300);
    expect(formatOffset(330)).toBe("UTC+05:30");
    expect(formatOffset(-240)).toBe("UTC−04:00");
  });
  it("converts wall-clock times between zones", () => {
    const instant = zonedTimeToInstant("2026-10-01T09:30", "Asia/Kolkata")!;
    expect(instant.toISOString()).toBe("2026-10-01T04:00:00.000Z");
    expect(instantToZonedInput(instant, "America/New_York")).toBe("2026-10-01T00:00");
    expect(instantToZonedInput(instant, "Asia/Tokyo")).toBe("2026-10-01T13:00");
    expect(dayShift(instant, "Asia/Kolkata", "America/Los_Angeles")).toBe(-1);
  });
  it("settles the offset across a DST change", () => {
    // London switches to GMT on 25 Oct 2026; 12:00 that day is GMT (UTC+0).
    expect(zonedTimeToInstant("2026-10-25T12:00", "Europe/London")!.toISOString()).toBe("2026-10-25T12:00:00.000Z");
    expect(zonedTimeToInstant("2026-10-24T12:00", "Europe/London")!.toISOString()).toBe("2026-10-24T11:00:00.000Z");
  });
});
