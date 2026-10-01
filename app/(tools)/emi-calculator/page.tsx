import { toolMetadata } from "@/lib/seo";
import { EmiCalculator } from "@/components/calculators/emi-calculator";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";

const slug = "emi-calculator";
const description =
  "Calculate the monthly EMI for a home, car or personal loan. See total interest, total payment, a principal vs interest chart and the full month-by-month amortization schedule.";

export const metadata = toolMetadata(slug, {
  title: "EMI Calculator – Home, Car & Personal Loan EMI with Amortization",
  description,
});

const faqs: Faq[] = [
  {
    question: "How is EMI calculated?",
    answer: "EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1), where P is the loan amount, r is the monthly interest rate (annual rate ÷ 12 ÷ 100) and n is the number of monthly instalments.",
  },
  {
    question: "What is an amortization schedule?",
    answer: "It is a month-by-month table showing how each EMI is split between interest and principal, and the loan balance left after each payment. Early EMIs are mostly interest; later EMIs mostly repay principal.",
  },
  {
    question: "How can I reduce my EMI or total interest?",
    answer: "A longer tenure lowers the EMI but increases total interest. A shorter tenure, a lower interest rate, or part-prepayments of principal all reduce the total interest you pay.",
  },
  {
    question: "Does this include processing fees or insurance?",
    answer: "No. The EMI shown covers principal and interest only. Lenders may add processing fees, insurance or GST on fees, which are charged separately.",
  },
  {
    question: "Is the result exact?",
    answer: "It uses the standard reducing-balance method used by Indian banks. Your lender's figure may differ by a few rupees due to their rounding rules or if interest is calculated on a daily basis.",
  },
];

export default function Page() {
  return (
    <ToolPage slug={slug} heading="EMI Calculator" description={description} faqs={faqs}>
      <EmiCalculator />
    </ToolPage>
  );
}
