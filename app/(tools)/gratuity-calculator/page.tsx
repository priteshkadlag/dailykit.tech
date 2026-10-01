import { GratuityCalculator } from "@/components/calculators/salary-calculators";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "gratuity-calculator";
const description = "Calculate gratuity with the 15/26 formula under the Gratuity Act — with the 5-year rule, ₹20 lakh tax-free limit and the new labour code wage rule.";
export const metadata = toolMetadata(slug, { title: "Gratuity Calculator – 15/26 Formula & Tax-Free Limit", description });
const faqs: Faq[] = [
  { question: "What is the gratuity formula?", answer: "For employers covered by the Payment of Gratuity Act: 15 × last drawn monthly wages × years of service ÷ 26. Wages mean basic pay plus dearness allowance. For employers not covered by the Act it's half a month's average wages (last 10 months) for each completed year." },
  { question: "How are years of service counted?", answer: "Under the Act, a part year of more than six months counts as a full year — 8 years and 7 months counts as 9 years, but 8 years and 6 months counts as 8." },
  { question: "Who is eligible for gratuity?", answer: "Employees with at least five years of continuous service. The five-year condition doesn't apply on death or disablement, and under the labour codes fixed-term employees qualify after one year." },
  { question: "How much gratuity is tax-free?", answer: "For private-sector employees, up to ₹20 lakh over your whole career is exempt; anything above is taxed as salary. Gratuity paid to central and state government employees is fully exempt." },
  { question: "How do the new labour codes change gratuity?", answer: "Wages for gratuity must be at least half of your total pay: if allowances are more than 50% of your pay, the excess is added to wages. Enter your total monthly pay to apply this rule." },
];
export default function Page() { return <ToolPage slug={slug} heading="Gratuity Calculator" description={description} faqs={faqs}><GratuityCalculator /></ToolPage>; }
