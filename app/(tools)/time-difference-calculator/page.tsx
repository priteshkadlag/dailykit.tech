import { TimeDifferenceCalculator } from "@/components/productivity/time-tools";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "time-difference-calculator";
const description = "Calculate the hours, minutes and seconds between two times — including overnight shifts and unpaid breaks — or between two dates and times.";
export const metadata = toolMetadata(slug, { title: "Time Difference Calculator – Hours Between Two Times", description });
const faqs: Faq[] = [
  { question: "What if the end time is past midnight?", answer: "If the end time is earlier than the start time, it's taken to be the next day — 10:00 PM to 6:30 AM is 8 hours 30 minutes." },
  { question: "How do I calculate hours worked?", answer: "Enter your start and finish times and the length of your break in minutes. The result is shown in hours and minutes and as decimal hours for timesheets." },
  { question: "What are decimal hours?", answer: "Hours written as a decimal number: 7 hours 30 minutes is 7.5 hours. Payroll and timesheet systems often use them." },
];
export default function Page() { return <ToolPage slug={slug} heading="Time Difference Calculator" description={description} faqs={faqs}><TimeDifferenceCalculator /></ToolPage>; }
