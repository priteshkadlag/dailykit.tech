import { round2 } from "@/lib/format";

export function monthlyMortgagePayment(principal: number, annualRate: number, years: number) {
  const months = years * 12;
  const rate = annualRate / 1200;
  if (rate === 0) return principal / months;
  return principal * rate * (1 + rate) ** months / ((1 + rate) ** months - 1);
}

export function remainingMortgageBalance(principal: number, annualRate: number, originalYears: number, paymentsMade: number) {
  const payment = monthlyMortgagePayment(principal, annualRate, originalYears);
  const rate = annualRate / 1200;
  if (rate === 0) return Math.max(0, principal - payment * paymentsMade);
  return Math.max(0, principal * (1 + rate) ** paymentsMade - payment * (((1 + rate) ** paymentsMade - 1) / rate));
}

export function calculateRefinance(input: { balance: number; currentRate: number; remainingYears: number; newRate: number; newYears: number; closingCosts: number }) {
  const currentPayment = monthlyMortgagePayment(input.balance, input.currentRate, input.remainingYears);
  const newPayment = monthlyMortgagePayment(input.balance, input.newRate, input.newYears);
  const monthlySavings = currentPayment - newPayment;
  const breakEvenMonths = monthlySavings > 0 ? Math.ceil(input.closingCosts / monthlySavings) : Infinity;
  const currentInterest = currentPayment * input.remainingYears * 12 - input.balance;
  const newInterestAndCosts = newPayment * input.newYears * 12 - input.balance + input.closingCosts;
  return { currentPayment: round2(currentPayment), newPayment: round2(newPayment), monthlySavings: round2(monthlySavings), breakEvenMonths, currentInterest: round2(currentInterest), newInterestAndCosts: round2(newInterestAndCosts) };
}

export function calculateFha(input: { homePrice: number; downPercent: number; annualRate: number; years: number; propertyTaxAnnual: number; insuranceAnnual: number; hoaMonthly: number; upfrontMipPercent: number; annualMipPercent: number }) {
  const downPayment = input.homePrice * input.downPercent / 100;
  const baseLoan = input.homePrice - downPayment;
  const upfrontMip = baseLoan * input.upfrontMipPercent / 100;
  const financedLoan = baseLoan + upfrontMip;
  const principalInterest = monthlyMortgagePayment(financedLoan, input.annualRate, input.years);
  const monthlyMip = baseLoan * input.annualMipPercent / 100 / 12;
  const totalMonthly = principalInterest + monthlyMip + input.propertyTaxAnnual / 12 + input.insuranceAnnual / 12 + input.hoaMonthly;
  return { downPayment: round2(downPayment), baseLoan: round2(baseLoan), upfrontMip: round2(upfrontMip), financedLoan: round2(financedLoan), principalInterest: round2(principalInterest), monthlyMip: round2(monthlyMip), totalMonthly: round2(totalMonthly) };
}

export function calculateRentVsBuy(input: { homePrice: number; downPercent: number; mortgageRate: number; mortgageYears: number; yearsToCompare: number; buyingCostsPercent: number; sellingCostsPercent: number; propertyTaxPercent: number; maintenancePercent: number; appreciationPercent: number; monthlyRent: number; rentInflationPercent: number }) {
  const months = input.yearsToCompare * 12;
  const downPayment = input.homePrice * input.downPercent / 100;
  const loan = input.homePrice - downPayment;
  const payment = monthlyMortgagePayment(loan, input.mortgageRate, input.mortgageYears);
  const balance = remainingMortgageBalance(loan, input.mortgageRate, input.mortgageYears, months);
  let ownerPayments = downPayment + input.homePrice * input.buyingCostsPercent / 100;
  let rentPaid = 0;
  for (let year = 0; year < input.yearsToCompare; year++) {
    const homeValue = input.homePrice * (1 + input.appreciationPercent / 100) ** year;
    ownerPayments += payment * 12 + homeValue * (input.propertyTaxPercent + input.maintenancePercent) / 100;
    rentPaid += input.monthlyRent * 12 * (1 + input.rentInflationPercent / 100) ** year;
  }
  const futureHomeValue = input.homePrice * (1 + input.appreciationPercent / 100) ** input.yearsToCompare;
  const netSaleEquity = futureHomeValue * (1 - input.sellingCostsPercent / 100) - balance;
  const buyNetCost = ownerPayments - netSaleEquity;
  return { monthlyMortgage: round2(payment), futureHomeValue: round2(futureHomeValue), remainingBalance: round2(balance), netSaleEquity: round2(netSaleEquity), buyNetCost: round2(buyNetCost), rentNetCost: round2(rentPaid), difference: round2(Math.abs(buyNetCost - rentPaid)), lowerCost: buyNetCost < rentPaid ? "buy" as const : "rent" as const };
}
