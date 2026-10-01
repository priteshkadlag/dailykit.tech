import { OneRepMaxCalculator } from "@/components/calculators/health-calculators";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "one-rep-max-calculator";
const description = "Estimate your one-repetition maximum from a completed set using Epley and Brzycki formulas, with practical percentage-based training weights.";
export const metadata = toolMetadata(slug, { title: "One-Rep Max Calculator – Estimate Your 1RM", description });
const faqs = [
  { question: "What is a one-rep max?", answer: "A one-repetition maximum, or 1RM, is the greatest weight a person can lift once with acceptable technique for a specific exercise." },
  { question: "How is 1RM estimated?", answer: "The calculator averages the Epley and Brzycki estimates from the weight and repetitions entered. These formulas can produce different results." },
  { question: "Which set should I enter?", answer: "Use a recent challenging set of 1–12 controlled repetitions completed with consistent technique. Higher-repetition sets generally produce less reliable max estimates." },
  { question: "Should I test my true maximum?", answer: "A direct maximum attempt is not necessary for most training and carries greater risk. Beginners or people with injuries or health concerns should seek qualified coaching or clinical advice." },
  { question: "Why does 1RM differ by exercise?", answer: "Strength is movement-specific. Technique, muscle groups, equipment and range of motion all affect the maximum, so calculate each exercise separately." },
];
export default function Page() { return <ToolPage slug={slug} heading="One-Rep Max (1RM) Calculator" description={description} faqs={faqs} guide={<><h2>Estimate rather than max out</h2><p>Submaximal formulas let you estimate strength from a normal training set. The page averages two common formulas and shows percentage-based loads for planning.</p><h2>Train safely</h2><p>Stop if technique breaks down or pain occurs. Use suitable safety equipment, spotting and qualified instruction, and round suggested weights to plates or increments available to you.</p></>}><OneRepMaxCalculator /></ToolPage>; }
