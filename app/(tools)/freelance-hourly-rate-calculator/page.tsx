import { FreelanceRateCalculator } from "@/components/calculators/earnings-calculators";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "freelance-hourly-rate-calculator";
const description = "Estimate what to charge per hour or day from your income goal, business costs, taxes, working schedule, non-billable time and safety buffer.";

export const metadata = toolMetadata(slug, { title: "Freelance Hourly Rate Calculator – What to Charge", description });

const faqs: Faq[] = [
  { question: "How do I calculate my freelance hourly rate?", answer: "Start with desired take-home income, gross it up for estimated tax, add annual business expenses and a safety buffer, then divide the required revenue by realistic billable hours." },
  { question: "What counts as non-billable time?", answer: "Sales, proposals, invoicing, bookkeeping, marketing, training and general administration are common non-billable activities. They reduce the hours available for client work." },
  { question: "Which business expenses should I include?", answer: "Include software, hardware, internet, workspace, insurance, professional services, marketing, travel and other recurring costs that your rates need to recover." },
  { question: "Why is a freelance rate higher than an employee hourly wage?", answer: "Freelancers fund their own unpaid leave, benefits, equipment, administration, business risk and non-billable time. An employee wage does not include all of those costs." },
  { question: "Is the calculated rate the price I must charge?", answer: "No. It is a planning estimate. Your final price also depends on experience, demand, value delivered, project risk, scope, client budget and local market conditions." },
  { question: "Does this calculate my exact tax liability?", answer: "No. The tax field is a planning estimate only. Tax treatment varies by location and business structure, so use qualified tax guidance for filing or pricing decisions." },
];

export default function Page() {
  return <ToolPage slug={slug} heading="Freelance Hourly Rate Calculator" description={description} faqs={faqs} guide={<>
    <h2>Freelance rate formula</h2>
    <p>The calculator estimates pre-tax income needed for your take-home goal, adds annual expenses, applies a profit or safety buffer, and divides that revenue target by available billable hours.</p>
    <h2>Choose realistic billable hours</h2>
    <p>Do not divide by every working hour. Freelancers spend meaningful time winning work and operating the business. Adjust non-billable time and working weeks using your own records, then review the rate against your market and project value.</p>
  </>}><FreelanceRateCalculator /></ToolPage>;
}
