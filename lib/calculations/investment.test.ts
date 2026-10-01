import { describe, expect, it } from "vitest";
import { calculateFd, calculateSimpleInterest, calculateSip } from "./investment";

describe("investment calculators", () => {
  it("calculates a zero-return SIP", () => expect(calculateSip(5000, 0, 2)).toEqual({ invested: 120000, returns: 0, maturity: 120000 }));
  it("calculates quarterly-compounded FD interest", () => expect(calculateFd(100000, 8, 1).maturity).toBeCloseTo(108243.216, 2));
  it("calculates simple interest", () => expect(calculateSimpleInterest(100000, 8, 3)).toEqual({ principal: 100000, interest: 24000, total: 124000 }));
});
