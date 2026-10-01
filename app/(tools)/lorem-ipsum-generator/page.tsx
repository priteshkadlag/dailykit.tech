import { LoremIpsumGenerator } from "@/components/text/content-tools";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "lorem-ipsum-generator";
const description = "Generate Lorem Ipsum placeholder text by paragraph, sentence or word count for website mockups, documents, prototypes and design layouts.";
export const metadata = toolMetadata(slug, { title: "Lorem Ipsum Generator – Free Dummy Text Online", description });
const faqs = [
  { question: "What is Lorem Ipsum?", answer: "Lorem Ipsum is conventional placeholder text used to evaluate layout and typography without distracting readers with meaningful copy." },
  { question: "Can I choose the amount of dummy text?", answer: "Yes. Generate a selected number of paragraphs, sentences or words." },
  { question: "Should Lorem Ipsum be published on a live website?", answer: "No. Replace placeholder content with accurate, reviewed copy before launch so visitors and search engines receive useful information." },
  { question: "Is generated text unique?", answer: "No. It is assembled from standard Lorem Ipsum phrases and should not be treated as original editorial content." },
  { question: "Can I use it in commercial mockups?", answer: "Lorem Ipsum is commonly used as placeholder copy, but always replace it where the final deliverable requires meaningful or legally reviewed text." },
];
export default function Page() { return <ToolPage slug={slug} heading="Lorem Ipsum Dummy Text Generator" description={description} faqs={faqs}><LoremIpsumGenerator /></ToolPage>; }
