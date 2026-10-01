import { SimpleInterestCalculator } from "@/components/calculators/investment-calculators";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "simple-interest-calculator";
const description = "Calculate simple interest and the final amount from a principal, annual interest rate and time period.";
export const metadata = toolMetadata(slug, { title: "Simple Interest Calculator – Principal, Rate & Time", description });
const faqs: Faq[] = [
  { question: "What is the simple interest formula?", answer: "Simple interest equals principal × annual rate × time ÷ 100." },
  { question: "How is simple interest different from compound interest?", answer: "Simple interest is calculated only on the original principal. Compound interest also earns interest on previously accumulated interest." },
  { question: "What time unit should I enter?", answer: "Enter time in years because the rate is annual. For six months, enter 0.5 years." },
];
export default function Page() { return <ToolPage slug={slug} heading="Simple Interest Calculator" description={description} faqs={faqs}><SimpleInterestCalculator /></ToolPage>; }
