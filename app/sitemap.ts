import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { categories, liveTools } from "@/lib/tools";
import { blogCategories } from "@/lib/blog";
import { getAllPosts } from "@/lib/blog-store";

export const revalidate = 300;

const date = (day: string) => new Date(`${day}T00:00:00Z`);
const newest = (days: string[]) => (days.length ? date(days.reduce((a, b) => (a > b ? a : b))) : undefined);

/**
 * Only real dates are given as lastModified (blog posts and the listings they change). Tool and static
 * pages leave it out: stamping them with the deploy time teaches Google to ignore the whole sitemap's dates.
 * priority / changefreq are omitted because Google ignores them.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();
  return [
    { url: absoluteUrl("/") },
    { url: absoluteUrl("/tools") },
    { url: absoluteUrl("/blog"), lastModified: newest(posts.map((p) => p.updatedAt)) },
    ...["/pricing", "/about", "/contact", "/privacy"].map((path) => ({ url: absoluteUrl(path) })),
    ...categories.map((c) => ({ url: absoluteUrl(`/category/${c.slug}`) })),
    ...blogCategories.map((category) => ({
      url: absoluteUrl(`/blog/category/${category.slug}`),
      lastModified: newest(posts.filter((p) => p.category === category.slug).map((p) => p.updatedAt)),
    })),
    ...posts.map((post) => ({ url: absoluteUrl(`/blog/${post.slug}`), lastModified: date(post.updatedAt) })),
    // Only tools that are live — "coming soon" tools have no page yet.
    ...liveTools.map((t) => ({ url: absoluteUrl(`/${t.slug}`) })),
  ];
}
