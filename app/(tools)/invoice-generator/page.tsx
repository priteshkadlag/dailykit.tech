import { toolMetadata } from "@/lib/seo";
import { DocumentWorkspaceLoader } from "@/components/documents/workspace-loader";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";

const slug = "invoice-generator";
const description =
  "Create GST and non-GST invoices with your logo, CGST/SGST/IGST, HSN codes, bank details and a UPI QR code. Download as PDF or print — free.";

export const metadata = toolMetadata(slug, {
  title: "Free GST Invoice Generator – Create Invoice PDF Online",
  description,
});

const faqs: Faq[] = [
  {
    question: "What must a GST tax invoice include?",
    answer: "Supplier name, address and GSTIN; a unique invoice number and date; customer name and address (and GSTIN for B2B); HSN or SAC codes; quantity, value and taxable value of each item; the GST rate and CGST/SGST or IGST amounts; place of supply; and a signature. This generator includes fields for all of them.",
  },
  {
    question: "When should I use CGST + SGST vs IGST?",
    answer: "If your business and the place of supply are in the same state, choose “Same state” and GST is split equally into CGST and SGST. For a customer in another state, choose “Other state” to charge IGST.",
  },
  {
    question: "Can I create an invoice without GST?",
    answer: "Yes. Choose “Without GST” for a simple invoice if you are not registered under GST or the supply is exempt. Tax columns are removed automatically.",
  },
  {
    question: "Where are my invoices saved?",
    answer: "Without an account, invoices, your business details and logo stay in this browser on this device and nothing is uploaded. With a free account they're saved to your account, so you can open them on any device and find them on your dashboard.",
  },
  {
    question: "How does the UPI QR code work?",
    answer: "Add your UPI ID under payment details. Unpaid invoices then show a QR code that opens any UPI app with your UPI ID, the invoice amount and the invoice number pre-filled.",
  },
];

export default function Page() {
  return (
    <ToolPage slug={slug} heading="Invoice Generator" description={description} faqs={faqs}>
      <DocumentWorkspaceLoader type="invoice" />
    </ToolPage>
  );
}
