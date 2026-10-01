import { DateDifferenceCalculator } from "@/components/productivity/time-tools";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "date-difference-calculator";
const description = "Find the number of days, weeks, months and years between two dates, count weekdays, or add and subtract days, weeks, months and business days from a date.";
export const metadata = toolMetadata(slug, { title: "Date Difference Calculator – Days Between Two Dates", description });
const faqs: Faq[] = [
  { question: "Does it count the end date?", answer: "Not by default — from 1 to 2 January is one day. Tick 'Include the end date' to count both the first and last day, which is what you want for leave, hotel nights or event days." },
  { question: "How are business days counted?", answer: "Monday to Friday are counted and Saturdays and Sundays skipped. Public holidays vary by state and organisation, so they aren't removed." },
  { question: "What happens when I add a month to 31 January?", answer: "You get the last day of February (28th, or 29th in a leap year), because February has no 31st." },
  { question: "Can I count backwards?", answer: "Yes. If the end date is before the start date the calculator still shows the gap, or use 'Add or subtract days' to go back in time." },
];
export default function Page() { return <ToolPage slug={slug} heading="Date Difference Calculator" description={description} faqs={faqs}><DateDifferenceCalculator /></ToolPage>; }
