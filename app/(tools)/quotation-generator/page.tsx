import { toolMetadata } from "@/lib/seo";
import { DocumentWorkspaceLoader } from "@/components/documents/workspace-loader";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";

const slug = "quotation-generator";
const description =
  "Make professional quotations and estimates with your logo, item-wise discounts and GST, validity date and terms. Download as PDF, print, and turn an accepted quotation into an invoice in one click.";

export const metadata = toolMetadata(slug, {
  title: "Quotation Generator – Free Quotation & Estimate PDF Maker",
  description,
});

const faqs: Faq[] = [
  {
    question: "What is the difference between a quotation and an invoice?",
    answer: "A quotation is an offer sent before the sale, listing prices the customer can accept until a validity date. An invoice is issued after the sale to request payment. Once a quotation is accepted, use “To invoice” to create the invoice with the same items.",
  },
  {
    question: "Should a quotation include GST?",
    answer: "Showing GST on a quotation lets the customer see the full amount they will pay. Choose “Without GST” if you prefer to quote prices exclusive of tax.",
  },
  {
    question: "How long should a quotation be valid?",
    answer: "15 to 30 days is common. Set the “Valid until” date — prices for raw materials and services can change, so a clear validity protects you.",
  },
  {
    question: "Are my quotations stored online?",
    answer: "Only if you log in. Without an account, quotations stay in this browser on this device. With a free account they're saved to your account and available on every device.",
  },
];

export default function Page() {
  return (
    <ToolPage slug={slug} heading="Quotation Generator" description={description} faqs={faqs}>
      <DocumentWorkspaceLoader type="quotation" />
    </ToolPage>
  );
}
