import { YouTubeChapterGenerator } from "@/components/creator/creator-tools";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "youtube-chapter-generator";
const description = "Turn a rough list of timestamps into correctly formatted YouTube chapters, and check the rules YouTube needs before it shows them on your video.";

export const metadata = toolMetadata(slug, { title: "YouTube Chapter Generator – Timestamps for Chapters", description });

const faqs: Faq[] = [
  { question: "Why aren't my YouTube chapters showing?", answer: "YouTube only shows chapters when the list in your description starts at 0:00, has at least three timestamps in increasing order, and every chapter is at least 10 seconds long. The generator checks all three." },
  { question: "What format do YouTube timestamps need?", answer: "Put each chapter on its own line with the timestamp first, such as 0:00 Intro or 1:02:30 Q&A. Use minutes:seconds under an hour and hours:minutes:seconds after." },
  { question: "Where do I paste the chapters?", answer: "Paste them into the video's description in YouTube Studio and save. Chapters usually appear within a few minutes." },
  { question: "Can my titles come before the timestamp?", answer: "In the generator, yes — it accepts Setup - 2:15 or (2:15) Setup and rewrites them as 2:15 Setup, the format YouTube reads." },
  { question: "Do chapters help with search?", answer: "Chapters make long videos easier to navigate, and Google can show them as key moments in search results. They don't replace a good title and description." },
];

export default function Page() {
  return <ToolPage slug={slug} heading="YouTube Chapter Generator" description={description} faqs={faqs} guide={<>
    <h2>YouTube’s chapter rules</h2>
    <p>For YouTube to split your video into chapters, the timestamp list in the description must <strong>start at 0:00</strong>, contain <strong>at least three</strong> timestamps in <strong>ascending order</strong>, and give every chapter <strong>at least 10 seconds</strong>. The generator sorts your timestamps, removes duplicates, can add the 0:00 chapter for you, and tells you about anything that still breaks a rule.</p>
    <h2>Writing good chapter titles</h2>
    <p>Keep titles short and descriptive, since viewers see them in the progress bar. Name what happens in each part, like “Unboxing” or “Battery test”, rather than “Part 2”.</p>
  </>}><YouTubeChapterGenerator /></ToolPage>;
}
