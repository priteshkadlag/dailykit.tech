import { HraCalculator } from "@/components/calculators/salary-calculators";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "hra-calculator";
const description = "Calculate how much of your house rent allowance is exempt from tax, including the new 8-city metro rule from FY 2026-27.";
export const metadata = toolMetadata(slug, { title: "HRA Calculator – House Rent Allowance Exemption", description });
const faqs: Faq[] = [
  { question: "How is the HRA exemption calculated?", answer: "It's the lowest of three amounts: the HRA you actually receive, the rent you pay minus 10% of your salary, and 50% of salary in a metro city (40% elsewhere). Salary here means basic pay plus dearness allowance that counts for retirement benefits, plus any commission fixed as a percentage of turnover." },
  { question: "Which cities count as metros for HRA?", answer: "Until FY 2025-26: Delhi, Mumbai, Kolkata and Chennai. From FY 2026-27, under the Income-tax Rules 2026, Bengaluru, Hyderabad, Pune and Ahmedabad also get the 50% limit. Choose the financial year in the calculator." },
  { question: "Can I claim HRA in the new tax regime?", answer: "No. The HRA exemption is only available if you choose the old regime. Use the income tax calculator to see which regime works out cheaper." },
  { question: "Do I need my landlord's PAN?", answer: "Yes, if the rent you pay is more than ₹1 lakh in the year. Keep rent receipts and the rental agreement as proof." },
  { question: "Can I claim HRA if I pay rent to my parents?", answer: "Yes, if you genuinely pay them rent and they own the house. Your parents must show that rent as income in their own tax return." },
];
export default function Page() { return <ToolPage slug={slug} heading="HRA Exemption Calculator" description={description} faqs={faqs}><HraCalculator /></ToolPage>; }
