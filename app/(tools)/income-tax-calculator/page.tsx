import { IncomeTaxCalculator } from "@/components/calculators/salary-calculators";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "income-tax-calculator";
const description = "Compare your income tax under the old and new regimes for FY 2025-26 and FY 2026-27, with standard deduction, 80C, 80D, HRA, the 87A rebate, surcharge and cess.";
export const metadata = toolMetadata(slug, { title: "Income Tax Calculator FY 2026-27 – Old vs New Regime", description });
const faqs: Faq[] = [
  { question: "What are the new regime tax slabs for FY 2026-27?", answer: "Up to ₹4 lakh: nil; ₹4–8 lakh: 5%; ₹8–12 lakh: 10%; ₹12–16 lakh: 15%; ₹16–20 lakh: 20%; ₹20–24 lakh: 25%; above ₹24 lakh: 30%. Budget 2026 kept the FY 2025-26 slabs unchanged." },
  { question: "Why is there no tax on a ₹12.75 lakh salary in the new regime?", answer: "Salaried people get a ₹75,000 standard deduction, which brings ₹12.75 lakh down to ₹12 lakh taxable. Section 87A then gives a rebate of up to ₹60,000, which cancels the tax on income up to ₹12 lakh. Just above that, marginal relief keeps the tax from exceeding the income above ₹12 lakh." },
  { question: "Which regime should I choose?", answer: "The new regime usually wins unless your deductions (80C, 80D, HRA, home loan interest, NPS) are large. The calculator works out both and highlights the cheaper one for your numbers." },
  { question: "Which deductions are allowed in the new regime?", answer: "The standard deduction of ₹75,000 and your employer's NPS contribution under 80CCD(2) (up to 14% of basic). Most others — 80C, 80D, HRA, home loan interest on a self-occupied house — are only in the old regime." },
  { question: "Are surcharge and cess included?", answer: "Yes. Surcharge applies above ₹50 lakh (10%), ₹1 crore (15%), ₹2 crore (25%) and ₹5 crore (37% in the old regime; the new regime is capped at 25%), with marginal relief. 4% health and education cess is added on top." },
  { question: "Does it include capital gains?", answer: "No. Capital gains, lottery winnings and other income taxed at special rates follow different rules and aren't included. Use this for salary and other normal income." },
];
export default function Page() { return <ToolPage slug={slug} heading="Income Tax Calculator (FY 2025-26 & 2026-27)" description={description} faqs={faqs}><IncomeTaxCalculator /></ToolPage>; }
