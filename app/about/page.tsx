import type { Metadata } from "next";
import Link from "next/link";
import { liveTools } from "@/lib/tools";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

export const metadata: Metadata = {
  title: "About",
  description: `${siteConfig.name} makes simple, free tools for India's shopkeepers, freelancers and small businesses — GST, invoices, EMI, PDFs and more.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
      <Breadcrumbs items={[{ name: "About", href: "/about" }]} />
      <h1 className="text-3xl font-bold tracking-tight">{siteConfig.tagline}</h1>
      <div className="prose-section space-y-4 leading-relaxed">
        <p>
          {siteConfig.name} brings the everyday tools a small business needs into one place: working out GST, sending a professional invoice, checking a loan EMI,
          converting a PDF or making a UPI QR code. No downloads, no clutter, and it works on any phone.
        </p>
        <h2>What we believe</h2>
        <ul>
          <li>
            <strong>Tools should be free.</strong> All {liveTools.length} tools work without an account.
          </li>
          <li>
            <strong>Your files are yours.</strong> PDF and image tools run inside your browser. Files are never uploaded.
          </li>
          <li>
            <strong>Correct numbers matter.</strong> GST, EMI and invoice maths are tested line by line and round exactly the way returns are filed.
          </li>
          <li>
            <strong>Built for India.</strong> Rupee formatting, CGST/SGST/IGST, HSN codes, UPI and WhatsApp are built in, not bolted on.
          </li>
        </ul>
        <p>A free account keeps your invoices, quotations, expenses and tasks in sync across devices. Pro removes the monthly document limit for growing businesses.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/tools" className={cn(buttonVariants(), "h-11 px-5")}>
          Browse tools
        </Link>
        <Link href="/contact" className={cn(buttonVariants({ variant: "outline" }), "h-11 px-5")}>
          Contact us
        </Link>
      </div>
    </div>
  );
}
