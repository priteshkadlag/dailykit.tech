import { toolJsonLd } from "@/lib/seo";
import { getCategory, getRelatedTools, getTool } from "@/lib/tools";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { FaqSection, type Faq } from "@/components/shared/faq-section";
import { JsonLd } from "@/components/shared/json-ld";
import { ToolCard } from "@/components/shared/tool-card";
import { ToolIcon } from "@/components/shared/tool-icon";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { TrackOnce } from "@/components/shared/track";
import { AdSlot } from "@/components/ads/ad-slot";
import { AD_SLOTS } from "@/lib/ads";

interface ToolPageProps {
  slug: string;
  /** Visible H1 — can differ from the short tool name for SEO. */
  heading: string;
  description: string;
  faqs: Faq[];
  /** Optional explanatory content (formulas, worked examples) shown below the tool. */
  guide?: React.ReactNode;
  children: React.ReactNode;
}

/** Standard frame for every tool: breadcrumb, header, the tool itself, guide, FAQs, related tools and structured data. */
export function ToolPage({ slug, heading, description, faqs, guide, children }: ToolPageProps) {
  const tool = getTool(slug);
  const category = getCategory(tool.categories[0]);
  const related = getRelatedTools(tool);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-6 sm:px-6 sm:py-10">
      <header className="space-y-4">
        <Breadcrumbs
          items={[
            ...(category ? [{ name: category.name, href: `/category/${category.slug}` }] : []),
            { name: tool.name, href: `/${tool.slug}` },
          ]}
        />
        <div className="flex items-start gap-4">
          <span className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground sm:flex">
            <ToolIcon name={tool.icon} className="size-6" />
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">{heading}</h1>
            <p className="max-w-2xl text-muted-foreground text-pretty">{description}</p>
          </div>
          <FavoriteButton slug={tool.slug} name={tool.name} />
        </div>
      </header>

      {children}

      <AdSlot slot={AD_SLOTS.inContent} />

      {guide && <section className="prose-section max-w-3xl space-y-4 text-[0.95rem] leading-relaxed">{guide}</section>}

      <div className="max-w-3xl">
        <FaqSection faqs={faqs} />
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="space-y-4">
          <h2 id="related-heading" className="text-xl font-semibold tracking-tight">
            Related tools
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((t) => (
              <ToolCard key={t.slug} tool={t} />
            ))}
          </div>
        </section>
      )}

      <AdSlot slot={AD_SLOTS.multiplex} format="autorelaxed" />

      <JsonLd data={toolJsonLd(slug, description)} />
      <TrackOnce event="tool_opened" />
    </div>
  );
}
