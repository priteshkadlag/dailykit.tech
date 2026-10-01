import { MacronutrientCalculator } from "@/components/calculators/health-calculators";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "macronutrient-calculator";
const description = "Estimate daily protein, carbohydrate and fat grams from maintenance calories and a weight goal using a balanced adult macronutrient split.";
export const metadata = toolMetadata(slug, { title: "Macronutrient Calculator – Protein, Carbs & Fat", description });
const faqs = [
  { question: "What are macronutrients?", answer: "Protein, carbohydrate and fat are nutrients the body uses in relatively large amounts. They provide energy and support different body functions." },
  { question: "How are macro grams calculated?", answer: "The tool assigns 25% of calories to protein, 45% to carbohydrate and 30% to fat, then converts calories to grams using 4 calories per gram for protein and carbohydrate and 9 for fat." },
  { question: "How does the goal change calories?", answer: "The calculator uses maintenance calories for maintenance, a 15% reduction for gradual loss, or a 10% increase for gradual gain." },
  { question: "Are these exact nutrition requirements?", answer: "No. They are general planning estimates. Needs vary with health, training, pregnancy, age, dietary pattern and clinical conditions." },
  { question: "Who should seek professional nutrition guidance?", answer: "Anyone who is pregnant, under 18, managing a medical condition or eating disorder, taking relevant medication, or pursuing a major body-weight change should seek qualified care." },
];
export default function Page() { return <ToolPage slug={slug} heading="Macronutrient Calculator" description={description} faqs={faqs} guide={<><h2>A balanced planning split</h2><p>The result uses 45% carbohydrate, 25% protein and 30% fat. These percentages fall within established adult acceptable distribution ranges, but there is no single ideal ratio for every person.</p><h2>Food quality still matters</h2><p>Macro totals do not describe fibre, vitamins, minerals, food allergies or overall dietary quality. Use the figures as a starting point, not a meal plan or medical prescription.</p></>}><MacronutrientCalculator /></ToolPage>; }
