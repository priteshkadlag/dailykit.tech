export function calculateSip(monthly: number, annualRate: number, years: number) {
  const months = years * 12;
  const monthlyRate = annualRate / 1200;
  const invested = monthly * months;
  const maturity = monthlyRate === 0
    ? invested
    : monthly * (((1 + monthlyRate) ** months - 1) / monthlyRate) * (1 + monthlyRate);
  return { invested, returns: maturity - invested, maturity };
}

export function calculateFd(principal: number, annualRate: number, years: number, compoundsPerYear = 4) {
  const maturity = principal * (1 + annualRate / 100 / compoundsPerYear) ** (compoundsPerYear * years);
  return { principal, interest: maturity - principal, maturity };
}

export function calculateSimpleInterest(principal: number, annualRate: number, years: number) {
  const interest = (principal * annualRate * years) / 100;
  return { principal, interest, total: principal + interest };
}

export type FundMode = "sip" | "lumpsum" | "step-up";
export interface FundYear { year: number; invested: number; value: number }

/**
 * Mutual fund projection with a yearly breakdown. SIPs are invested at the start of each month and grow at
 * the monthly equivalent of the expected annual return; a step-up SIP raises the instalment once a year.
 */
export function projectMutualFund({ mode, amount, annualRate, years, stepUp = 0, inflation = 0 }: { mode: FundMode; amount: number; annualRate: number; years: number; stepUp?: number; inflation?: number }) {
  const monthlyRate = annualRate / 1200;
  const months = Math.round(years * 12);
  const schedule: FundYear[] = [];
  let value = mode === "lumpsum" ? amount : 0;
  let invested = mode === "lumpsum" ? amount : 0;
  let instalment = amount;
  for (let month = 1; month <= months; month++) {
    if (mode !== "lumpsum") {
      value += instalment;
      invested += instalment;
    }
    value *= 1 + monthlyRate;
    if (month % 12 === 0 || month === months) {
      schedule.push({ year: Math.ceil(month / 12), invested, value });
      if (mode === "step-up" && month % 12 === 0) instalment *= 1 + stepUp / 100;
    }
  }
  const realValue = value / (1 + inflation / 100) ** years;
  return { invested, returns: value - invested, maturity: value, realValue, schedule };
}
