import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { categories, liveTools } from "@/lib/tools";
import { blogCategories } from "@/lib/blog";
import { getAllPosts } from "@/lib/blog-store";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const posts = await getAllPosts();
  return [
    { url: absoluteUrl("/"), lastModified, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/tools"), lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/blog"), lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/pricing"), lastModified, changeFrequency: "monthly", priority: 0.5 },
    ...["/about", "/contact", "/privacy"].map((path) => ({ url: absoluteUrl(path), lastModified, changeFrequency: "yearly" as const, priority: 0.3 })),
    ...categories.map((c) => ({
      url: absoluteUrl(`/category/${c.slug}`),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...blogCategories.map((category) => ({
      url: absoluteUrl(`/blog/category/${category.slug}`),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(`${post.publishedAt}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    // Only tools that are live — "coming soon" tools have no page yet.
    ...liveTools.map((t) => ({
      url: absoluteUrl(`/${t.slug}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
  ];
}
