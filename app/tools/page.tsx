import type { Metadata } from "next";
import Link from "next/link";
import { categories, getPdfToolsByGroup, getToolsInCategory, tools } from "@/lib/tools";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { SearchForm } from "@/components/shared/search-form";
import { CategoryTools } from "@/components/shared/tool-card";

export const metadata: Metadata = {
  title: "All Tools – Calculators, Business, PDF & Image Tools",
  description: "Browse every free tool: GST, EMI, discount, percentage and age calculators, invoice and quotation generators, PDF, image and QR tools.",
  alternates: { canonical: "/tools" },
};

export default function ToolsPage() {
  const sections = categories.filter((c) => c.slug !== "calculators");
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-6 sm:px-6 sm:py-10">
      <header className="space-y-4">
        <Breadcrumbs items={[{ name: "All tools", href: "/tools" }]} />
        <h1 className="text-3xl font-bold tracking-tight">All tools</h1>
        <p className="max-w-2xl text-muted-foreground">
          {tools.length} tools for everyday calculations and business paperwork. More are added regularly.
        </p>
        <div className="max-w-xl">
          <SearchForm size="md" />
        </div>
        <nav aria-label="Jump to category" className="flex flex-wrap gap-2">
          {sections.map((c) => (
            <Link key={c.slug} href={`#${c.slug}`} className="inline-flex min-h-9 items-center rounded-full border bg-card px-3.5 text-sm hover:bg-accent">
              {c.name}
            </Link>
          ))}
        </nav>
      </header>
      {sections.map((c) => (
        <section key={c.slug} id={c.slug} aria-labelledby={`${c.slug}-heading`} className="scroll-mt-32 space-y-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id={`${c.slug}-heading`} className="text-xl font-semibold tracking-tight">
              {c.name}
            </h2>
            <Link href={`/category/${c.slug}`} className="text-sm font-medium text-primary hover:underline">
              View category
            </Link>
          </div>
          <CategoryTools
            tools={getToolsInCategory(c.slug).filter((t) => t.categories[0] === c.slug)}
            groups={c.slug === "pdf-tools" ? getPdfToolsByGroup() : undefined}
          />
        </section>
      ))}
    </div>
  );
}
