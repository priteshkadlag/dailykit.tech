import { PregnancyDueDateCalculator } from "@/components/calculators/health-calculators";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "pregnancy-due-date-calculator";
const description = "Estimate a pregnancy due date, conception date and trimester milestones from the first day of the last menstrual period and cycle length.";
export const metadata = toolMetadata(slug, { title: "Pregnancy Due Date Calculator – LMP & Key Dates", description });
const faqs = [
  { question: "How is the estimated due date calculated?", answer: "The standard LMP method counts 280 days, or 40 weeks, from the first day of the last menstrual period, with an adjustment for cycle length." },
  { question: "Is the due date the exact day of birth?", answer: "No. It is an estimate used to track pregnancy. Birth can occur before or after this date." },
  { question: "What if periods are irregular?", answer: "LMP dating may be less reliable when cycles are irregular, the date is uncertain, or ovulation timing differs. A clinician may use ultrasound and clinical information to establish dating." },
  { question: "Can the estimated due date change?", answer: "A clinician may revise dating based on an early ultrasound and accepted clinical criteria. Follow the due date recorded by your maternity-care team." },
  { question: "Does this calculator confirm pregnancy?", answer: "No. It does not confirm pregnancy or assess health. Use an appropriate pregnancy test and contact a healthcare professional for care or concerns." },
  { question: "When should urgent medical help be sought?", answer: "Seek urgent local medical care for severe pain, heavy bleeding, fainting, breathing difficulty, or any symptom your healthcare team has told you requires immediate attention." },
];
export default function Page() { return <ToolPage slug={slug} heading="Pregnancy Due Date Calculator" description={description} faqs={faqs} guide={<><h2>Due dates are estimates</h2><p>The standard calculation assumes a 28-day cycle and counts 280 days from the first day of the last menstrual period. Cycle adjustment is approximate, and first-trimester ultrasound may provide more reliable clinical dating.</p><h2>Use the recorded clinical date</h2><p>This tool is for general information only. It cannot confirm pregnancy, fetal age or wellbeing. Use the estimated due date established by your obstetric or maternity-care professional.</p></>}><PregnancyDueDateCalculator /></ToolPage>; }
