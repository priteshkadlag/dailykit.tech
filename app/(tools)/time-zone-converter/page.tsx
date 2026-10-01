import { TimeZoneConverter } from "@/components/productivity/time-tools";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "time-zone-converter";
const description = "Convert any date and time between India (IST) and cities and time zones around the world, with daylight saving time handled automatically.";
export const metadata = toolMetadata(slug, { title: "Time Zone Converter – IST to EST, PST, GMT & World Time", description });
const faqs: Faq[] = [
  { question: "Is daylight saving time handled?", answer: "Yes. The converter uses your browser's time-zone database, so dates in the US, UK, Europe and Australia automatically switch between summer and winter time." },
  { question: "What is IST in UTC?", answer: "India Standard Time is UTC+05:30 all year — India doesn't use daylight saving time." },
  { question: "How do I schedule a meeting across time zones?", answer: "Pick the time in your own zone, add your colleagues' cities, and check the converted times. Times before 8 AM or after 9 PM are marked as outside usual hours." },
  { question: "Why does a city show '+1 day' or '−1 day'?", answer: "The converted time falls on the next or previous calendar day compared with the time you entered." },
];
export default function Page() { return <ToolPage slug={slug} heading="Time Zone Converter" description={description} faqs={faqs}><TimeZoneConverter /></ToolPage>; }
