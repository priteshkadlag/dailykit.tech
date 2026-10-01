import { toolMetadata } from "@/lib/seo";
import { PercentageCalculator } from "@/components/calculators/percentage-calculator";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";

const slug = "percentage-calculator";
const description =
  "Work out X% of a number, what percent one value is of another, percentage increase or decrease, and add or subtract a percentage — all in one place.";

export const metadata = toolMetadata(slug, {
  title: "Percentage Calculator – % of, % Increase & Decrease",
  description,
});

const faqs: Faq[] = [
  {
    question: "How do I calculate a percentage of a number?",
    answer: "Multiply the number by the percentage and divide by 100. For example, 18% of 2,500 = 2,500 × 18 ÷ 100 = 450.",
  },
  {
    question: "How do I find what percent one number is of another?",
    answer: "Divide the part by the total and multiply by 100. If you scored 420 out of 500, that is 420 ÷ 500 × 100 = 84%.",
  },
  {
    question: "How is percentage increase or decrease calculated?",
    answer: "Subtract the original value from the new value, divide by the original value and multiply by 100. Sales going from 40,000 to 50,000 is (50,000 − 40,000) ÷ 40,000 × 100 = 25% increase.",
  },
  {
    question: "Why isn't a 10% increase followed by a 10% decrease back to the start?",
    answer: "Because the second percentage applies to the new value. 100 + 10% = 110, and 110 − 10% = 99, not 100.",
  },
];

export default function Page() {
  return (
    <ToolPage slug={slug} heading="Percentage Calculator" description={description} faqs={faqs}>
      <PercentageCalculator />
    </ToolPage>
  );
}
