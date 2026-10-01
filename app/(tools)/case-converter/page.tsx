import { CaseConverter } from "@/components/text/content-tools";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "case-converter";
const description = "Convert text instantly to uppercase, lowercase, title case, sentence case, or programming cases such as camelCase, PascalCase, snake_case and kebab-case.";
export const metadata = toolMetadata(slug, { title: "Case Converter – Uppercase, Lowercase & Title Case", description });
const faqs = [
  { question: "Which text cases are supported?", answer: "Writing cases: uppercase, lowercase, title case, sentence case and alternating case. Programming cases: camelCase, PascalCase, snake_case, CONSTANT_CASE, kebab-case, dot.case and path/case." },
  { question: "How are programming cases converted?", answer: "Each line is split into words at spaces, punctuation, underscores, hyphens and capital-letter boundaries (so XMLHttpRequest becomes xml, http, request), then joined in the chosen style. Paste one name per line to convert a whole list at once." },
  { question: "What is title case?", answer: "Title case capitalizes the first letter of each word. Editorial style guides may keep short articles and prepositions lowercase, so review formal headlines manually." },
  { question: "What is sentence case?", answer: "Sentence case lowercases the text and capitalizes the first letter at the start and after sentence-ending punctuation." },
  { question: "Will names and acronyms remain correct?", answer: "Not always. Automatic conversion cannot reliably identify every proper name or acronym, so proofread the result before publishing." },
  { question: "Is the conversion private?", answer: "The case transformation runs in your browser and does not require uploading the text." },
];
export default function Page() { return <ToolPage slug={slug} heading="Online Case Converter" description={description} faqs={faqs}><CaseConverter /></ToolPage>; }
