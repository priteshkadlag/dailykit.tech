import { EpfCalculator } from "@/components/calculators/salary-calculators";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";
import { toolMetadata } from "@/lib/seo";

const slug = "epf-calculator";
const description = "Project your EPF balance at retirement from your basic salary, with the employer share, EPS pension split, salary hikes and the 8.25% interest rate.";
export const metadata = toolMetadata(slug, { title: "EPF Calculator – PF Balance at Retirement", description });
const faqs: Faq[] = [
  { question: "How much goes into my EPF each month?", answer: "You contribute 12% of basic pay plus DA. Your employer also pays 12%, but 8.33% of wages (on a wage of at most ₹15,000, so up to ₹1,250 a month) goes to the Employees' Pension Scheme; the rest goes into your EPF account." },
  { question: "What is the current EPF interest rate?", answer: "8.25% a year for FY 2025-26, the same as FY 2023-24 and FY 2024-25. Interest is worked out monthly on the running balance and credited once a year." },
  { question: "Is the EPS money included in the result?", answer: "No. EPS contributions fund a monthly pension after age 58 and don't sit in your EPF balance, so the calculator shows them separately." },
  { question: "Is EPF interest taxable?", answer: "Interest on your own contributions above ₹2.5 lakh a year (₹5 lakh if your employer doesn't contribute) is taxable. Withdrawals after five years of continuous service are tax-free." },
  { question: "What is VPF?", answer: "Voluntary Provident Fund lets you put in more than 12% of your wages. It earns the EPF rate; set your contribution above 12% to include it." },
];
export default function Page() { return <ToolPage slug={slug} heading="EPF Calculator" description={description} faqs={faqs}><EpfCalculator /></ToolPage>; }
