import { toolMetadata } from "@/lib/seo";
import { ExpenseTrackerLoader } from "@/components/expenses/tracker-loader";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";

const slug = "expense-tracker";
const description =
  "Record daily personal and business expenses by category and payment method. See spending charts by day, week and month, and export to CSV or PDF.";

export const metadata = toolMetadata(slug, {
  title: "Daily Expense Tracker – Track Spending with Charts & Reports",
  description,
});

const faqs: Faq[] = [
  {
    question: "Do I need an account to track expenses?",
    answer: "No. Without an account, expenses are saved in this browser on this device, so you can start immediately. Log in with a free account to keep them in sync across your phone and computer.",
  },
  {
    question: "Can I export my expenses?",
    answer: "Yes. Export the expenses currently shown (after filters) as a CSV file for Excel or Google Sheets, or as a PDF report with a category summary.",
  },
  {
    question: "Which week does “This week” cover?",
    answer: "Weeks run Monday to Sunday. “This month” is the current calendar month.",
  },
  {
    question: "Can I track business and personal expenses separately?",
    answer: "Use categories such as Office, Marketing and Salary for business spending and filter by category to see each separately.",
  },
];

export default function Page() {
  return (
    <ToolPage slug={slug} heading="Daily Expense Tracker" description={description} faqs={faqs}>
      <ExpenseTrackerLoader />
    </ToolPage>
  );
}
