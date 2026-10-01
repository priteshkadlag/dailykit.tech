import { MutualFundCalculator } from "@/components/calculators/loan-fund-calculators";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "mutual-fund-calculator";
const description = "Estimate mutual fund returns for monthly SIP, step-up SIP or lump sum, with a year-by-year table and the value in today's money after inflation.";
export const metadata = toolMetadata(slug, { title: "Mutual Fund Calculator – SIP, Step-up SIP & Lump Sum Returns", description });
const faqs: Faq[] = [
  { question: "How are mutual fund returns calculated?", answer: "SIP instalments are invested at the start of each month and grow at the monthly equivalent of your expected annual return. A lump sum compounds monthly over the whole period." },
  { question: "What is a step-up SIP?", answer: "A SIP whose instalment rises by a fixed percentage every year, usually in line with your salary. Even a 10% yearly step-up adds a lot to the final value." },
  { question: "What return should I assume?", answer: "Past long-term averages are roughly 7% for debt funds, 10% for hybrid funds and 12–14% for equity funds, but returns aren't guaranteed and vary year to year. Try a few rates to see a range." },
  { question: "What does 'worth in today's money' mean?", answer: "It discounts the final value by inflation, showing what that amount would buy at today's prices." },
  { question: "Are taxes and expense ratios included?", answer: "No. Returns from fund NAVs are already after the expense ratio. Capital gains tax on redemption isn't deducted." },
];
export default function Page() { return <ToolPage slug={slug} heading="Mutual Fund Returns Calculator" description={description} faqs={faqs}><MutualFundCalculator /></ToolPage>; }
