import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock3 } from "lucide-react";
import { BlogCard } from "@/components/blog/blog-card";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { FaqSection } from "@/components/shared/faq-section";
import { formatBlogDate, getBlogCategory, getBlogPost } from "@/lib/blog";
import { markdownHeadings, renderBlogMarkdown, slugify } from "@/lib/blog-markdown";
import { getAllPosts, getAllPostsInCategory, getDbPost, type DbBlogPost } from "@/lib/blog-store";
import { absoluteUrl, defaultOgImage, siteConfig } from "@/lib/site";

// Built-in guides and published editor posts are prerendered; posts published later render on first visit.
export const dynamicParams = true;
export const revalidate = 300;
export async function generateStaticParams() { return (await getAllPosts()).map((post) => ({ slug: post.slug })); }
type BlogPostPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const slug = (await params).slug;
  const post = getBlogPost(slug);
  if (!post) {
    const dbPost = await getDbPost(slug);
    // Checked here as well so crawlers (whose metadata is resolved before streaming) get a real 404.
    if (!dbPost) notFound();
    return dbMetadata(dbPost);
  }
  const path = `/blog/${post.slug}`;
  const seoTitle = post.seoTitle ?? post.title;
  return { title: { absolute: seoTitle.length < 60 ? seoTitle : post.title.slice(0, 57).trimEnd() + "…" }, description: post.description, keywords: [post.focusKeyword, ...(post.relatedKeywords ?? [])].filter((keyword): keyword is string => Boolean(keyword)), alternates: { canonical: path }, openGraph: { type: "article", title: post.title, description: post.description, url: absoluteUrl(path), siteName: siteConfig.name, locale: siteConfig.locale, publishedTime: post.publishedAt, modifiedTime: post.updatedAt, images: [{ ...defaultOgImage, alt: post.title }] }, twitter: { card: "summary_large_image", title: post.title, description: post.description, images: [defaultOgImage.url] } };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const slug = (await params).slug;
  const post = getBlogPost(slug);
  if (!post) {
    const dbPost = await getDbPost(slug);
    if (!dbPost) notFound();
    return <DbPostView post={dbPost} />;
  }
  const category = getBlogCategory(post.category)!;
  const related = (await getAllPostsInCategory(post.category)).filter((item) => item.slug !== post.slug).slice(0, 3);
  const url = absoluteUrl(`/blog/${post.slug}`);
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <Breadcrumbs items={[{ name: "Blog", href: "/blog" }, { name: category.name, href: `/blog/category/${category.slug}` }, { name: post.title, href: `/blog/${post.slug}` }]} />
      <article className="mx-auto mt-8 max-w-3xl">
        <header className="border-b pb-8"><Link href={`/blog/category/${category.slug}`} className="text-sm font-semibold text-primary hover:underline">{category.name}</Link><h1 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-5xl">{post.title}</h1><p className="mt-5 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p><div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground"><time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time><span aria-hidden>·</span><span className="inline-flex items-center gap-1"><Clock3 className="size-4" aria-hidden />{post.readingMinutes} min read</span></div></header>
        <div className="prose-section space-y-9 py-9">
          {post.sections.map((section) => <section key={section.heading} className="space-y-4"><h2>{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}</section>)}
          {post.comparison && <section className="space-y-4"><h2>Comparison table</h2><div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[36rem] text-left text-sm"><thead className="bg-muted"> <tr>{post.comparison.headers.map((header) => <th key={header} scope="col" className="px-4 py-3 font-semibold text-foreground">{header}</th>)}</tr></thead><tbody className="divide-y">{post.comparison.rows.map((row) => <tr key={row.join("-")}>{row.map((cell, index) => <td key={`${cell}-${index}`} className="px-4 py-3 text-muted-foreground">{cell}</td>)}</tr>)}</tbody></table></div></section>}
        </div>
        {post.faqs && <div className="mb-9"><FaqSection faqs={post.faqs} title={`${post.focusKeyword ?? post.title}: frequently asked questions`} /></div>}
        <aside aria-labelledby="related-tools-heading" className="rounded-2xl border bg-card p-5 sm:p-6"><h2 id="related-tools-heading" className="text-lg font-semibold">Put this guide into practice</h2><p className="mt-1 text-sm text-muted-foreground">Try the related DailyKit tools.</p><div className="mt-4 flex flex-wrap gap-3">{post.relatedTools.map((tool) => <Link key={tool.href} href={tool.href} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-white shadow-sm hover:brightness-110">{tool.name}<ArrowRight className="size-4" aria-hidden /></Link>)}</div></aside>
        <Link href="/blog" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft className="size-4" aria-hidden />Back to all articles</Link>
      </article>
      {related.length > 0 && <section aria-labelledby="related-articles-heading" className="mt-16 space-y-6"><h2 id="related-articles-heading" className="text-2xl font-bold tracking-tight">Related articles</h2><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{related.map((item) => <BlogCard key={item.slug} post={item} />)}</div></section>}
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description: post.description, datePublished: post.publishedAt, dateModified: post.updatedAt ?? post.publishedAt, mainEntityOfPage: url, url, articleSection: category.name, author: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url }, publisher: { "@id": `${siteConfig.url}#organization` }, keywords: [post.focusKeyword, ...(post.relatedKeywords ?? [])].filter(Boolean).join(", ") }} />
    </div>
  );
}

function dbMetadata(post: DbBlogPost): Metadata {
  const path = `/blog/${post.slug}`;
  return {
    title: { absolute: post.title.length < 60 ? post.title : post.title.slice(0, 57).trimEnd() + "…" },
    description: post.description, keywords: post.tags, alternates: { canonical: path },
    openGraph: { type: "article", title: post.title, description: post.description, url: absoluteUrl(path), siteName: siteConfig.name, locale: siteConfig.locale, publishedTime: post.publishedAt, modifiedTime: post.updatedAt, tags: post.tags, images: [{ ...defaultOgImage, alt: post.title }] },
    twitter: { card: "summary_large_image", title: post.title, description: post.description, images: [defaultOgImage.url] },
  };
}

/** An article written in the admin blog editor (Markdown content). */
async function DbPostView({ post }: { post: DbBlogPost }) {
  const category = getBlogCategory(post.category)!;
  const related = (await getAllPostsInCategory(post.category)).filter((item) => item.slug !== post.slug).slice(0, 3);
  const url = absoluteUrl(`/blog/${post.slug}`);
  // Give headings ids so the table of contents can link to them.
  const toc = markdownHeadings(post.content).filter((h) => h.level === 2);
  const html = renderBlogMarkdown(post.content).replace(/<h2>(.*?)<\/h2>/g, (_, inner: string) => `<h2 id="${slugify(inner.replace(/<[^>]+>/g, ""))}" class="scroll-mt-32">${inner}</h2>`);
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <Breadcrumbs items={[{ name: "Blog", href: "/blog" }, { name: category.name, href: `/blog/category/${category.slug}` }, { name: post.title, href: `/blog/${post.slug}` }]} />
      <article className="mx-auto mt-8 max-w-3xl">
        <header className="border-b pb-8">
          <Link href={`/blog/category/${category.slug}`} className="text-sm font-semibold text-primary hover:underline">{category.name}</Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-5xl">{post.title}</h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {post.authorName && <><span className="font-medium text-foreground">{post.authorName}</span><span aria-hidden>·</span></>}
            <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time><span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1"><Clock3 className="size-4" aria-hidden />{post.readingMinutes} min read</span>
          </div>
          {post.tags.length > 0 && <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tags">{post.tags.map((tag) => <li key={tag} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">#{tag}</li>)}</ul>}
        </header>
        {toc.length >= 3 && (
          <nav aria-label="On this page" className="mt-8 rounded-2xl border bg-card p-5">
            <p className="text-sm font-semibold">On this page</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">{toc.map((h) => <li key={h.text}><a href={`#${slugify(h.text)}`} className="text-muted-foreground hover:text-primary">{h.text}</a></li>)}</ol>
          </nav>
        )}
        <div className="blog-content py-9" dangerouslySetInnerHTML={{ __html: html }} />
        {post.relatedTools.length > 0 && (
          <aside aria-labelledby="related-tools-heading" className="rounded-2xl border bg-card p-5 sm:p-6"><h2 id="related-tools-heading" className="text-lg font-semibold">Put this guide into practice</h2><p className="mt-1 text-sm text-muted-foreground">Try the related DailyKit tools.</p><div className="mt-4 flex flex-wrap gap-3">{post.relatedTools.map((tool) => <Link key={tool.href} href={tool.href} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-white shadow-sm hover:brightness-110">{tool.name}<ArrowRight className="size-4" aria-hidden /></Link>)}</div></aside>
        )}
        <Link href="/blog" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft className="size-4" aria-hidden />Back to all articles</Link>
      </article>
      {related.length > 0 && <section aria-labelledby="related-articles-heading" className="mt-16 space-y-6"><h2 id="related-articles-heading" className="text-2xl font-bold tracking-tight">Related articles</h2><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{related.map((item) => <BlogCard key={item.slug} post={item} />)}</div></section>}
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description: post.description, datePublished: post.publishedAt, dateModified: post.updatedAt, mainEntityOfPage: url, url, articleSection: category.name, author: post.authorName ? { "@type": "Person", name: post.authorName } : { "@type": "Organization", name: siteConfig.name, url: siteConfig.url }, publisher: { "@id": `${siteConfig.url}#organization` }, keywords: post.tags.join(", ") }} />
    </div>
  );
}
