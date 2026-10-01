import { SalaryHourlyCalculator } from "@/components/calculators/earnings-calculators";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "salary-to-hourly-calculator";
const description = "Convert annual salary to gross hourly wage, monthly pay and estimated take-home income using your weekly hours, working weeks and deductions.";

export const metadata = toolMetadata(slug, { title: "Salary to Hourly Wage Calculator – Gross & Take-Home Pay", description });

const faqs: Faq[] = [
  { question: "How do I convert annual salary to an hourly wage?", answer: "Divide annual gross salary by paid hours per year. Paid hours per year equal weekly paid hours multiplied by working weeks." },
  { question: "What is the standard number of working hours in a year?", answer: "A common full-time assumption is 2,080 hours: 40 hours a week for 52 weeks. Use fewer weeks if unpaid leave or unpaid holidays should be excluded." },
  { question: "Does the calculator show take-home pay?", answer: "It provides an estimate using the combined deduction percentage you enter. Actual take-home pay depends on tax rules, benefits, payroll deductions and individual circumstances." },
  { question: "Should paid holidays be included?", answer: "If your annual salary continues during paid holidays, include those weeks. Exclude only periods that reduce the salary or when comparing actual hours worked for a specific purpose." },
  { question: "Can I compare a salary with a freelance rate?", answer: "Yes, but include benefits, paid leave, equipment, insurance, taxes, non-billable time and business expenses when comparing employment with freelance work." },
];

export default function Page() {
  return <ToolPage slug={slug} heading="Salary to Hourly Wage Calculator" description={description} faqs={faqs} guide={<>
    <h2>Salary-to-hourly formula</h2>
    <p><strong>Gross hourly wage = annual salary ÷ (hours per week × working weeks).</strong> Estimated take-home figures apply your combined deduction estimate after the gross conversion.</p>
    <h2>How to use the result</h2>
    <p>Use the gross rate for job-offer comparisons that share the same benefits and schedule. Use the take-home estimate for budgeting, then verify actual payroll and tax deductions with the employer or a qualified adviser.</p>
  </>}><SalaryHourlyCalculator /></ToolPage>;
}
