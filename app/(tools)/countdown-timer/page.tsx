import { CountdownTimer } from "@/components/productivity/time-tools";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "countdown-timer";
const description = "A simple online countdown timer with presets and an alarm, or a live countdown to any date — a birthday, exam, launch or New Year.";
export const metadata = toolMetadata(slug, { title: "Countdown Timer – Online Timer with Alarm", description });
const faqs: Faq[] = [
  { question: "Will the timer keep running in a background tab?", answer: "Yes. It's based on the clock time it should finish, so it stays accurate even when the browser slows down background tabs. Keep the tab open to hear the alarm." },
  { question: "Does the timer make a sound?", answer: "Yes, it beeps when the time is up and the display flashes. Make sure your device isn't muted." },
  { question: "Can I count down to a specific date?", answer: "Yes. Switch to 'Countdown to a date', name your event and pick the date and time to see the days, hours, minutes and seconds remaining." },
];
export default function Page() { return <ToolPage slug={slug} heading="Online Countdown Timer" description={description} faqs={faqs}><CountdownTimer /></ToolPage>; }
