import { toolMetadata } from "@/lib/seo";
import { AgeCalculator } from "@/components/calculators/age-calculator";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";

const slug = "age-calculator";
const description =
  "Calculate your exact age in years, months and days from your date of birth, with totals in months, weeks and days and a countdown to your next birthday.";

export const metadata = toolMetadata(slug, {
  title: "Age Calculator – Exact Age from Date of Birth",
  description,
});

const faqs: Faq[] = [
  {
    question: "How is age calculated?",
    answer: "We count complete years since your date of birth, then complete months since your last birthday, then the remaining days — the same way age is counted on official forms.",
  },
  {
    question: "Can I find my age on a specific date?",
    answer: "Yes. Change the “Age on” date to any date, such as an exam, job application or retirement cut-off date, to see your age on that day.",
  },
  {
    question: "How are 29 February birthdays handled?",
    answer: "In non-leap years, a 29 February birthday is counted as 28 February, so your age increases on 28 February.",
  },
  {
    question: "Is my date of birth saved?",
    answer: "No. The calculation happens entirely in your browser and nothing you enter is stored.",
  },
];

export default function Page() {
  return (
    <ToolPage slug={slug} heading="Age Calculator" description={description} faqs={faqs}>
      <AgeCalculator />
    </ToolPage>
  );
}
