import { toolMetadata } from "@/lib/seo";
import { ShippingCalculator } from "@/components/calculators/shipping-calculator";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";

const slug = "shipping-cost-calculator";
const description =
  "Estimate courier charges for any parcel in India. Calculates volumetric and chargeable weight, freight by zone, COD charges, GST and packaging — with a rate card you can edit to match your courier.";

export const metadata = toolMetadata(slug, {
  title: "Shipping Cost Calculator – Volumetric Weight & Courier Charges India",
  description,
});

const faqs: Faq[] = [
  {
    question: "How is volumetric weight calculated?",
    answer: "Volumetric weight (kg) = Length × Width × Height (in cm) ÷ 5000, the divisor most Indian couriers use. A 30 × 20 × 15 cm box has a volumetric weight of 1.8 kg even if it weighs less.",
  },
  {
    question: "What is chargeable weight?",
    answer: "Couriers charge for whichever is higher — actual or volumetric weight — rounded up to the next 0.5 kg slab. That is the chargeable weight.",
  },
  {
    question: "How are COD charges calculated?",
    answer: "Most couriers charge a fixed minimum or a percentage of the order value, whichever is higher — for example ₹35 or 2%. You can change both in the rate card.",
  },
  {
    question: "Are these the exact rates of my courier?",
    answer: "The built-in rates are illustrative samples in the typical range for Indian aggregators. Open the rate card and enter your courier's rates for accurate numbers. Live courier rate integration is planned.",
  },
  {
    question: "Is GST charged on shipping?",
    answer: "Yes, courier and COD charges attract 18% GST. Keep the GST option ticked to include it.",
  },
];

export default function Page() {
  return (
    <ToolPage slug={slug} heading="Shipping Cost Calculator" description={description} faqs={faqs}>
      <ShippingCalculator />
    </ToolPage>
  );
}
