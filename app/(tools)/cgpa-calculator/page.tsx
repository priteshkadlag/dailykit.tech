import { CgpaCalculator } from "@/components/calculators/study-unit-calculators";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "cgpa-calculator";
const description = "Calculate your CGPA from semester SGPAs or your SGPA from subject grades and credits, and convert CGPA to percentage with CBSE, AICTE and university formulas.";
export const metadata = toolMetadata(slug, { title: "CGPA Calculator – SGPA to CGPA & CGPA to Percentage", description });
const faqs: Faq[] = [
  { question: "How is CGPA calculated?", answer: "CGPA is the credit-weighted average of your semester SGPAs: multiply each SGPA by that semester's credits, add them up and divide by total credits. If you don't enter credits, each semester counts equally." },
  { question: "How is SGPA calculated?", answer: "Multiply each subject's grade point by its credits, add them, and divide by the total credits for the semester." },
  { question: "How do I convert CGPA to percentage?", answer: "It depends on your board or university. CBSE and many universities use CGPA × 9.5; AICTE and VTU use (CGPA − 0.75) × 10; some use CGPA × 10. Check your mark sheet or university rules for the official formula." },
  { question: "What grade points does the 10-point scale use?", answer: "The UGC/AICTE scale: O = 10, A+ = 9, A = 8, B+ = 7, B = 6, C = 5, P = 4 and F = 0. Some universities use different letters or cut-offs." },
];
export default function Page() { return <ToolPage slug={slug} heading="CGPA Calculator" description={description} faqs={faqs}><CgpaCalculator /></ToolPage>; }
