import { CarLoanCalculator } from "@/components/calculators/loan-fund-calculators";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "car-loan-calculator";
const description = "Calculate your car loan EMI from the on-road price, down payment, interest rate and tenure — with total interest, processing fee and the total cost of the car.";
export const metadata = toolMetadata(slug, { title: "Car Loan EMI Calculator – On-Road Price & Down Payment", description });
const faqs: Faq[] = [
  { question: "How is the car loan EMI calculated?", answer: "With the standard reducing-balance formula: EMI = P × r × (1+r)^n ÷ ((1+r)^n − 1), where P is the loan amount (on-road price minus down payment), r the monthly interest rate and n the number of months." },
  { question: "How much down payment should I make?", answer: "Most lenders fund 80–90% of the on-road price, so you'll pay at least 10–20% up front. A bigger down payment lowers the EMI and total interest." },
  { question: "What tenure is best for a car loan?", answer: "Car loans usually run 1 to 7 years. A shorter tenure means a higher EMI but much less interest; a longer one is easier on the budget but costs more overall." },
  { question: "What is the total cost of the car?", answer: "Your down payment plus all EMIs plus the processing fee — what you actually pay for the car over the loan." },
];
export default function Page() { return <ToolPage slug={slug} heading="Car Loan EMI Calculator" description={description} faqs={faqs}><CarLoanCalculator /></ToolPage>; }
