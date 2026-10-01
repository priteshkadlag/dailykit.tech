import { toolMetadata } from "@/lib/seo";
import { DiscountCalculator } from "@/components/calculators/discount-calculator";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";

const slug = "discount-calculator";
const description =
  "Find the final price and your savings for any discount. Handles stacked offers like 20% + 10% extra off, and discounts combined with GST.";

export const metadata = toolMetadata(slug, {
  title: "Discount Calculator – Sale Price, Multiple Discounts & GST",
  description,
});

const faqs: Faq[] = [
  {
    question: "How do I calculate a discount?",
    answer: "Discount = Price × Discount% ÷ 100, and Final price = Price − Discount. A ₹2,499 item at 20% off has a discount of ₹499.80 and costs ₹1,999.20.",
  },
  {
    question: "Is 20% + 10% off the same as 30% off?",
    answer: "No. Successive discounts apply to the already-reduced price. 20% off ₹1,000 gives ₹800, and a further 10% off gives ₹720 — an effective discount of 28%, not 30%.",
  },
  {
    question: "Is GST charged before or after a discount?",
    answer: "When a discount is given before or at the time of sale and shown on the invoice, GST is charged on the discounted price. So the discount is applied first and GST is calculated on the reduced amount.",
  },
  {
    question: "What if the price already includes GST, like an MRP?",
    answer: "Choose “Yes, it's the MRP” under Discount + GST. The calculator separates the GST, applies the discount on the taxable value, and shows the GST included in your final price.",
  },
];

export default function Page() {
  return (
    <ToolPage slug={slug} heading="Discount Calculator" description={description} faqs={faqs}>
      <DiscountCalculator />
    </ToolPage>
  );
}
