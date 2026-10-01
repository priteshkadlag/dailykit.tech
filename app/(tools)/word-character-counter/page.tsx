import { WordCharacterCounter } from "@/components/text/content-tools";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "word-character-counter";
const description = "Count words, characters, sentences and paragraphs, estimate reading time, and review frequently used keywords and density as you type.";
export const metadata = toolMetadata(slug, { title: "Word & Character Counter – Reading Time and Keywords", description });
const faqs = [
  { question: "How are words counted?", answer: "The counter identifies groups of letters and numbers, including common apostrophes and hyphens inside words. Results can differ slightly from editors with different counting rules." },
  { question: "Does the character count include spaces?", answer: "The page shows both totals: all characters, including spaces and line breaks, and characters with whitespace removed." },
  { question: "How is reading time estimated?", answer: "Reading time uses an average pace of about 200 words per minute. Actual reading speed varies with language, complexity and audience." },
  { question: "What does keyword density mean?", answer: "Keyword density is the number of times a word appears divided by the total word count. It is a descriptive check, not a target or guarantee of search ranking." },
  { question: "Is my text uploaded?", answer: "No. Analysis runs in your browser as you type or paste text." },
];
export default function Page() { return <ToolPage slug={slug} heading="Word & Character Counter" description={description} faqs={faqs} guide={<><h2>Useful length checks</h2><p>Use character totals for form limits and metadata drafts, word counts for assignments or briefs, and reading time for audience planning. Write naturally rather than repeating phrases to reach a density target.</p></>}><WordCharacterCounter /></ToolPage>; }
