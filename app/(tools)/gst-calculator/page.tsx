import { toolMetadata } from "@/lib/seo";
import { GstCalculator } from "@/components/calculators/gst-calculator";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";

const slug = "gst-calculator";
const description =
  "Add GST to a price or remove GST from an inclusive amount. Get the base amount, GST, and the CGST + SGST or IGST split instantly for any GST rate.";

export const metadata = toolMetadata(slug, {
  title: "GST Calculator – Add or Remove GST Online (CGST, SGST, IGST)",
  description,
});

const faqs: Faq[] = [
  {
    question: "How do I calculate GST on an amount?",
    answer: "Multiply the amount by the GST rate and divide by 100. For ₹10,000 at 18%, GST is 10,000 × 18 ÷ 100 = ₹1,800, so the total is ₹11,800.",
  },
  {
    question: "How do I remove GST from an inclusive price?",
    answer: "Divide the inclusive amount by (100 + GST rate) and multiply by 100 to get the base price. For ₹11,800 at 18%: 11,800 × 100 ÷ 118 = ₹10,000. The GST included is ₹1,800.",
  },
  {
    question: "When do I charge CGST + SGST and when IGST?",
    answer: "If the supplier and the place of supply are in the same state, GST is split equally into CGST and SGST (for example 9% + 9% for 18%). If they are in different states, the full rate is charged as IGST.",
  },
  {
    question: "What are the current GST rates in India?",
    answer: "Following the GST rationalisation effective 22 September 2025, most goods and services fall under 5% or 18%, with 40% for luxury and sin goods, plus special rates such as 0%, 0.25% and 3% for specific items. The 12% and 28% slabs are included here for earlier invoices and items that still use them. Always confirm the rate for your HSN/SAC code.",
  },
  {
    question: "Is this GST calculator free, and is my data stored?",
    answer: "Yes, it is completely free. All calculations happen in your browser — the amounts you enter are not sent to or stored on our servers.",
  },
];

export default function Page() {
  return (
    <ToolPage
      slug={slug}
      heading="GST Calculator"
      description={description}
      faqs={faqs}
      guide={
        <>
          <h2>GST formulas used</h2>
          <ul>
            <li>
              <strong>Add GST (exclusive):</strong> GST = Amount × Rate ÷ 100; Total = Amount + GST
            </li>
            <li>
              <strong>Remove GST (inclusive):</strong> Base = Amount × 100 ÷ (100 + Rate); GST = Amount − Base
            </li>
            <li>
              <strong>Intra-state:</strong> CGST = SGST = GST ÷ 2. <strong>Inter-state:</strong> IGST = GST
            </li>
          </ul>
        </>
      }
    >
      <GstCalculator />
    </ToolPage>
  );
}
