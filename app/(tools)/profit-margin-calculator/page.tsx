import { toolMetadata } from "@/lib/seo";
import { ProfitCalculator } from "@/components/calculators/profit-calculator";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";

const slug = "profit-margin-calculator";
const description =
  "Find your real profit after cost, shipping, packaging, gateway fees and marketing. See margin, markup, break-even and the price for a target profit.";

export const metadata = toolMetadata(slug, {
  title: "Profit Margin Calculator – Margin, Markup & Selling Price",
  description,
});

const faqs: Faq[] = [
  {
    question: "What is the difference between margin and markup?",
    answer: "Margin is profit as a percentage of the selling price; markup is profit as a percentage of cost. Buying at ₹100 and selling at ₹125 is a 25% markup but a 20% margin (₹25 of ₹125).",
  },
  {
    question: "Why include shipping, packaging and gateway fees?",
    answer: "They are real costs of every sale. A product that looks 40% profitable on purchase price alone can make much less once courier, packaging, a 2% gateway fee and ad spend are counted. This calculator includes all of them.",
  },
  {
    question: "How is the target selling price calculated?",
    answer: "It solves for the price at which, after every cost including the percentage fee that grows with price, your profit equals the target — either as a share of the selling price (margin) or of total cost (markup).",
  },
  {
    question: "What is the break-even price?",
    answer: "The selling price per unit at which you make neither profit nor loss after all costs. Selling below it means a loss on every unit.",
  },
];

export default function Page() {
  return (
    <ToolPage slug={slug} heading="Profit Margin Calculator" description={description} faqs={faqs}>
      <ProfitCalculator />
    </ToolPage>
  );
}
