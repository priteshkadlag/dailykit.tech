import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { FaqSection, type Faq } from "@/components/shared/faq-section";
import { JsonLd } from "@/components/shared/json-ld";
import { PricingPlans } from "@/components/shared/pricing-plans";

export const metadata: Metadata = {
  title: "Pricing – Free and Pro Plans",
  description: `Every ${siteConfig.name} tool is free. Pro (₹99/month or ₹999/year) adds unlimited invoices and quotations saved to your account.`,
  alternates: { canonical: "/pricing" },
};

const faqs: Faq[] = [
  { question: "Are the calculators really free?", answer: "Yes. Every calculator, PDF, image, QR and WhatsApp tool is free to use, with or without an account." },
  {
    question: "What's the limit on the Free plan?",
    answer: "With a free account you can save 20 invoices and 20 quotations a month to your account, plus unlimited expenses and tasks. Pro removes the document limit.",
  },
  { question: "How do I pay for Pro?", answer: `Online payment by UPI and card is coming soon. Until then, email ${siteConfig.supportEmail} and we'll activate Pro on your account.` },
  { question: "Can I cancel?", answer: "Yes. Pro simply ends at the close of the period you paid for and your account returns to Free. Nothing you saved is deleted." },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-6 sm:px-6 sm:py-10">
      <header className="space-y-4 text-center">
        <div className="flex justify-center">
          <Breadcrumbs items={[{ name: "Pricing", href: "/pricing" }]} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple pricing for everyday work</h1>
        <p className="mx-auto max-w-xl text-muted-foreground">All tools are free. Upgrade only when your business needs unlimited documents in the cloud.</p>
      </header>
      <PricingPlans />
      <div className="mx-auto max-w-3xl">
        <FaqSection faqs={faqs} />
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
        }}
      />
    </div>
  );
}
