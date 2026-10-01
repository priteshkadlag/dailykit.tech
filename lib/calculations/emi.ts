import { round2 } from "@/lib/format";

export interface EmiInput {
  principal: number;
  /** Annual interest rate in percent, e.g. 8.5 */
  annualRate: number;
  months: number;
}

export interface AmortizationRow {
  month: number;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface AmortizationYear {
  year: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface EmiResult {
  emi: number;
  totalInterest: number;
  totalPayment: number;
  principal: number;
  schedule: AmortizationRow[];
  yearly: AmortizationYear[];
}

/** Standard reducing-balance EMI: P·r·(1+r)^n / ((1+r)^n − 1), with r the monthly rate. */
export function monthlyEmi(principal: number, annualRate: number, months: number) {
  const r = annualRate / 12 / 100;
  if (r === 0) return principal / months;
  const factor = Math.pow(1 + r, months);
  return (principal * r * factor) / (factor - 1);
}

export function calculateEmi({ principal, annualRate, months }: EmiInput): EmiResult {
  const r = annualRate / 12 / 100;
  const emi = monthlyEmi(principal, annualRate, months);

  const schedule: AmortizationRow[] = [];
  let balance = principal;
  for (let month = 1; month <= months; month++) {
    const interest = balance * r;
    // The final instalment clears whatever is left so rounding never leaves a residue.
    const principalPart = month === months ? balance : emi - interest;
    balance = Math.max(0, balance - principalPart);
    schedule.push({
      month,
      emi: round2(principalPart + interest),
      principal: round2(principalPart),
      interest: round2(interest),
      balance: round2(balance),
    });
  }

  const yearly: AmortizationYear[] = [];
  for (let i = 0; i < schedule.length; i += 12) {
    const slice = schedule.slice(i, i + 12);
    yearly.push({
      year: i / 12 + 1,
      principal: round2(slice.reduce((s, row) => s + row.principal, 0)),
      interest: round2(slice.reduce((s, row) => s + row.interest, 0)),
      balance: slice[slice.length - 1].balance,
    });
  }

  const totalPayment = emi * months;
  return {
    emi: round2(emi),
    totalInterest: round2(totalPayment - principal),
    totalPayment: round2(totalPayment),
    principal: round2(principal),
    schedule,
    yearly,
  };
}
