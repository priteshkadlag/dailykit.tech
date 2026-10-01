import { RandomPicker } from "@/components/productivity/random-tools";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "random-picker";
const description = "Spin a wheel of names to pick a random winner, pick several entries at once, or shuffle a list — fair, random and free for classrooms, giveaways and lucky draws.";
export const metadata = toolMetadata(slug, { title: "Random Picker & Wheel Spinner – Spin the Wheel Online", description });
const faqs: Faq[] = [
  { question: "Is the wheel really random?", answer: "Yes. The winner is chosen with your browser's cryptographic random number generator before the wheel spins, so every entry has exactly the same chance." },
  { question: "How do I add names?", answer: "Type or paste them in the entries box, one per line or separated by commas. The wheel shows up to 100 entries." },
  { question: "Can I remove the winner after each spin?", answer: "Yes. Tick 'Remove the winner after each spin' to draw several winners without repeats, or use 'Pick several' to choose them all at once." },
  { question: "Are my entries saved or uploaded?", answer: "No. Everything happens in your browser and nothing is sent to us." },
];
export default function Page() { return <ToolPage slug={slug} heading="Random Picker / Wheel Spinner" description={description} faqs={faqs}><RandomPicker /></ToolPage>; }
