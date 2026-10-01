import { FdCalculator } from "@/components/calculators/investment-calculators";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "fd-calculator";
const description = "Calculate the maturity amount and interest earned on a fixed deposit with quarterly compounding.";
export const metadata = toolMetadata(slug, { title: "FD Calculator – Fixed Deposit Maturity", description });
const faqs: Faq[] = [
  { question: "How is FD maturity calculated?", answer: "This calculator uses compound interest with quarterly compounding, a common convention for Indian fixed deposits." },
  { question: "Can the actual maturity amount differ?", answer: "Yes. A bank may use a different compounding schedule, day-count method or rate for your tenure." },
  { question: "Is tax deducted from this result?", answer: "No. The estimate shows gross interest before TDS or income tax." },
];
export default function Page() { return <ToolPage slug={slug} heading="FD Calculator" description={description} faqs={faqs}><FdCalculator /></ToolPage>; }
