import { TdeeCalculator } from "@/components/calculators/health-calculators";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "tdee-calculator";
const description = "Estimate total daily energy expenditure and maintenance calories from age, sex, height, weight and activity using Mifflin-St Jeor.";
export const metadata = toolMetadata(slug, { title: "TDEE Calculator – Daily Calories & Energy Expenditure", description });
const faqs = [
  { question: "What is TDEE?", answer: "Total daily energy expenditure is the energy your body uses across resting metabolism, daily movement, exercise and food digestion." },
  { question: "How is TDEE estimated?", answer: "The calculator estimates resting energy with the adult Mifflin-St Jeor equation, then multiplies it by the selected activity factor." },
  { question: "Is TDEE the same as BMR?", answer: "No. BMR estimates energy at rest. TDEE adds an activity multiplier to estimate total daily use." },
  { question: "How accurate is the estimate?", answer: "It is a population-based estimate. Body composition, health, medication, training and actual movement can produce a meaningfully different result." },
  { question: "Can children or pregnant people use this calculator?", answer: "This implementation is intended for non-pregnant adults. Children, pregnancy, breastfeeding and medical nutrition needs require appropriate clinical guidance." },
];
export default function Page() { return <ToolPage slug={slug} heading="TDEE Calculator" description={description} faqs={faqs} guide={<><h2>How the estimate is calculated</h2><p>The Mifflin-St Jeor equation estimates resting energy from weight, height, age and a sex-specific constant. An activity factor then estimates total daily expenditure.</p><h2>Use the result as a starting point</h2><p>Track intake, activity and weight trends over several weeks before adjusting. Predictive equations cannot measure individual metabolism and should not replace care from a qualified clinician or dietitian.</p></>}><TdeeCalculator /></ToolPage>; }
