import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenText } from "lucide-react";
import { BlogExplorer } from "@/components/blog/blog-explorer";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { absoluteUrl, defaultOgImage, siteConfig } from "@/lib/site";
import { blogCategories } from "@/lib/blog";
import { getAllPosts } from "@/lib/blog-store";

// Built-in guides are static; editor posts refresh when published (and at most every 5 minutes).
export const revalidate = 300;

const title = "Practical Business & Utility Guides | DailyKit Blog";
const description = "Read practical guides about business, finance, productivity, PDFs, images and technology, with clear examples and useful free online tools.";

export const metadata: Metadata = {
  title: { absolute: title }, description, keywords: ["business guides", "finance guides", "productivity tips", "PDF guides", "image optimization", "technology tutorials"],
  alternates: { canonical: "/blog" },
  openGraph: { type: "website", title, description, url: absoluteUrl("/blog"), siteName: siteConfig.name, locale: siteConfig.locale, images: [{ ...defaultOgImage, alt: "DailyKit practical guides and tutorials" }] },
  twitter: { card: "summary_large_image", title, description, images: [defaultOgImage.url] },
};

export default async function BlogPage() {
  const posts = await getAllPosts();
  const pageUrl = absoluteUrl("/blog");
  return (
    <div className="mx-auto max-w-6xl space-y-14 px-4 py-6 sm:px-6 sm:py-10">
      <header className="space-y-6">
        <Breadcrumbs items={[{ name: "Blog", href: "/blog" }]} />
        <div className="relative overflow-hidden rounded-3xl border bg-card px-5 py-10 sm:px-10 sm:py-14">
          <div aria-hidden className="absolute -top-36 -right-28 size-80 rounded-full bg-primary/10 blur-2xl" />
          <div className="relative max-w-3xl">
            <span className="mb-5 flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground"><BookOpenText className="size-5" aria-hidden /></span>
            <p className="text-sm font-semibold text-primary">DailyKit Blog</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-5xl">Practical guides for work and everyday decisions</h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">Clear, useful articles about business, money, documents, design, productivity and technology—connected to tools that help you take the next step.</p>
          </div>
        </div>
      </header>

      <section aria-labelledby="all-articles-heading" className="space-y-6">
        <div><h2 id="all-articles-heading" className="text-2xl font-bold tracking-tight">Find an article</h2><p className="mt-1 text-muted-foreground">Search every guide by topic, tool or question, or filter by category.</p></div>
        <BlogExplorer posts={posts} />
      </section>

      <section aria-labelledby="blog-categories-heading" className="space-y-6">
        <div><h2 id="blog-categories-heading" className="text-2xl font-bold tracking-tight">Browse guides by category</h2><p className="mt-1 text-muted-foreground">Find articles for the task or decision in front of you.</p></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {blogCategories.map((category) => {
            const count = posts.filter((post) => post.category === category.slug).length;
            return <Link key={category.slug} href={`/blog/category/${category.slug}`} className={`group rounded-2xl border bg-linear-to-br ${category.accent} p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30`}><h3 className="font-semibold">{category.name}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{category.description}</p><span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">{count} {count === 1 ? "article" : "articles"}<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></span></Link>;
          })}
        </div>
      </section>

      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "Blog", "@id": `${pageUrl}#blog`, name: "DailyKit Blog", description, url: pageUrl, publisher: { "@id": `${siteConfig.url}#organization` } },
        { "@context": "https://schema.org", "@type": "ItemList", name: "DailyKit blog articles", numberOfItems: posts.length, itemListElement: posts.map((post, index) => ({ "@type": "ListItem", position: index + 1, name: post.title, url: absoluteUrl(`/blog/${post.slug}`) })) },
      ]} />
    </div>
  );
}
