import { InvisibleCharacterTool } from "@/components/text/content-tools";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "invisible-character";
const description = "Copy a Braille blank, zero-width space or Hangul filler for compatible profile names, messages, layouts and text-formatting tasks.";
export const metadata = toolMetadata(slug, { title: "Invisible Character & Blank Space Copy Tool", description });
const faqs = [
  { question: "What is an invisible character?", answer: "It is a real Unicode character that has no visible mark or appears blank. It is different from a normal space and still has a code point." },
  { question: "Which blank character should I use?", answer: "Braille blank has visible width and often works for layout spacing. Zero-width space has no width. Hangul filler is wider, but support varies by font and platform." },
  { question: "Why was the invisible character removed?", answer: "Some apps normalize text, strip unsupported characters or block blank profile names. Try another supported character and follow the platform's rules." },
  { question: "Can people detect invisible text?", answer: "Yes. It can be detected by software, copied, counted or revealed with Unicode inspection tools. It should not be treated as secret or secure." },
  { question: "Can I copy several blank characters?", answer: "Yes. Choose a quantity from 1 to 100 and use the copy button for the character you need." },
];
export default function Page() { return <ToolPage slug={slug} heading="Invisible Character and Blank Space Copy" description={description} faqs={faqs}><InvisibleCharacterTool /></ToolPage>; }
