import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogCard } from "@/components/blog/blog-card";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { blogCategories, getBlogCategory } from "@/lib/blog";
import { getAllPostsInCategory } from "@/lib/blog-store";
import { absoluteUrl, defaultOgImage, siteConfig } from "@/lib/site";

export const dynamicParams = false;
export const revalidate = 300;
export function generateStaticParams() { return blogCategories.map((category) => ({ slug: category.slug })); }
type BlogCategoryPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: BlogCategoryPageProps): Promise<Metadata> {
  const category = getBlogCategory((await params).slug);
  if (!category) return {};
  const title = `${category.name} Guides & Articles | DailyKit Blog`;
  const description = `${category.description} Read clear, practical DailyKit articles with examples and related free tools.`;
  const path = `/blog/category/${category.slug}`;
  return { title: { absolute: title }, description, alternates: { canonical: path }, openGraph: { type: "website", title, description, url: absoluteUrl(path), siteName: siteConfig.name, locale: siteConfig.locale, images: [{ ...defaultOgImage, alt: `${category.name} guides from DailyKit` }] }, twitter: { card: "summary_large_image", title, description, images: [defaultOgImage.url] } };
}

export default async function BlogCategoryPage({ params }: BlogCategoryPageProps) {
  const category = getBlogCategory((await params).slug);
  if (!category) notFound();
  const posts = await getAllPostsInCategory(category.slug);
  const pageUrl = absoluteUrl(`/blog/category/${category.slug}`);
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-6 sm:px-6 sm:py-10">
      <header className="space-y-5">
        <Breadcrumbs items={[{ name: "Blog", href: "/blog" }, { name: category.name, href: `/blog/category/${category.slug}` }]} />
        <div className={`rounded-3xl border bg-gradient-to-br ${category.accent} px-5 py-10 sm:px-10 sm:py-14`}><p className="text-sm font-semibold text-primary">DailyKit Blog</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{category.name} guides</h1><p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground sm:text-lg">{category.description}</p></div>
      </header>
      <nav aria-label="Blog categories" className="flex gap-2 overflow-x-auto pb-2"><Link href="/blog" className="shrink-0 rounded-full border bg-card px-4 py-2 text-sm font-medium hover:bg-accent">All articles</Link>{blogCategories.map((item) => <Link key={item.slug} href={`/blog/category/${item.slug}`} aria-current={item.slug === category.slug ? "page" : undefined} className={item.slug === category.slug ? "shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" : "shrink-0 rounded-full border bg-card px-4 py-2 text-sm font-medium hover:bg-accent"}>{item.name}</Link>)}</nav>
      <section aria-labelledby="category-articles-heading" className="space-y-6"><div><h2 id="category-articles-heading" className="text-2xl font-bold tracking-tight">Latest {category.name.toLowerCase()} articles</h2><p className="mt-1 text-muted-foreground">{posts.length} {posts.length === 1 ? "guide" : "guides"} in this category.</p></div>{posts.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{posts.map((post) => <BlogCard key={post.slug} post={post} />)}</div> : <p className="rounded-xl border bg-card p-6 text-muted-foreground">New guides are being prepared for this category.</p>}</section>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: `${category.name} guides`, description: category.description, url: pageUrl, mainEntity: { "@type": "ItemList", numberOfItems: posts.length, itemListElement: posts.map((post, index) => ({ "@type": "ListItem", position: index + 1, name: post.title, url: absoluteUrl(`/blog/${post.slug}`) })) } }} />
    </div>
  );
}
