import { SipCalculator } from "@/components/calculators/investment-calculators";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "sip-calculator";
const description = "Estimate the future value of monthly SIP investments, including your total contribution and potential returns.";
export const metadata = toolMetadata(slug, { title: "SIP Calculator – Mutual Fund Returns", description });
const faqs: Faq[] = [
  { question: "How are SIP returns calculated?", answer: "The calculator compounds the expected annual return monthly and assumes each contribution is made at the beginning of the month." },
  { question: "Are SIP returns guaranteed?", answer: "No. Mutual fund returns vary with the market. This result is an estimate based on the rate you enter, not a guarantee." },
  { question: "What does total invested mean?", answer: "It is your monthly contribution multiplied by the total number of months, before any investment growth." },
];
export default function Page() { return <ToolPage slug={slug} heading="SIP Calculator" description={description} faqs={faqs}><SipCalculator /></ToolPage>; }
