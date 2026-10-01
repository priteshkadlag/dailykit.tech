import { BmiCalculator } from "@/components/calculators/bmi-calculator";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "bmi-calculator";
const description = "Calculate your body mass index from height and weight and see the corresponding adult weight category.";
export const metadata = toolMetadata(slug, { title: "BMI Calculator – Body Mass Index & Healthy Weight", description });
const faqs: Faq[] = [
  { question: "How is BMI calculated?", answer: "BMI is weight in kilograms divided by height in metres squared." },
  { question: "What is a healthy BMI?", answer: "For most adults, 18.5 to 24.9 is commonly described as the healthy range." },
  { question: "Is BMI a diagnosis?", answer: "No. BMI is a screening measure and does not account for muscle mass, age, pregnancy or body composition. Discuss health concerns with a qualified clinician." },
];
export default function Page() { return <ToolPage slug={slug} heading="BMI Calculator" description={description} faqs={faqs}><BmiCalculator /></ToolPage>; }
