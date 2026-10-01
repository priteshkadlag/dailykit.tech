import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { blogCategories, blogPosts, type BlogCategorySlug, type BlogPost } from "@/lib/blog";
import { markdownHeadings, readingMinutes } from "@/lib/blog-markdown";
import { getToolOrNull } from "@/lib/tools";

export const BLOG_TAG = "blog-posts";

/** What listings, cards and search need — shared by built-in guides and editor-written posts. */
export interface BlogSummary {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  category: BlogCategorySlug;
  publishedAt: string;
  /** Last real content change (YYYY-MM-DD); the publish date if the post was never edited. */
  updatedAt: string;
  readingMinutes: number;
  featured?: boolean;
  /** Extra words to match in search: keywords, tags and section headings. */
  searchText: string;
}

export interface DbBlogPost extends BlogSummary {
  content: string;
  tags: string[];
  relatedTools: { name: string; href: string }[];
  authorName: string | null;
}

const isCategory = (slug: string): slug is BlogCategorySlug => blogCategories.some((c) => c.slug === slug);
const day = (date: Date) => date.toISOString().slice(0, 10);

function summarizeStatic(post: BlogPost): BlogSummary {
  return {
    slug: post.slug, title: post.title, description: post.description, excerpt: post.excerpt, category: post.category,
    publishedAt: post.publishedAt, updatedAt: post.updatedAt ?? post.publishedAt, readingMinutes: post.readingMinutes, featured: post.featured,
    searchText: [post.focusKeyword, ...(post.relatedKeywords ?? []), ...post.sections.map((s) => s.heading)].filter(Boolean).join(" "),
  };
}

// Published, already-due posts from the database. Cached and tagged so the editor can refresh it on save;
// a database outage leaves the blog showing the built-in guides instead of failing.
const loadDbPosts = unstable_cache(
  async (): Promise<DbBlogPost[]> => {
    try {
      const rows = await prisma.blogPost.findMany({
        where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
        orderBy: { publishedAt: "desc" },
        include: { author: { select: { name: true } } },
      });
      return rows.filter((r) => isCategory(r.category)).map((r) => ({
        slug: r.slug, title: r.title, description: r.description, excerpt: r.excerpt, category: r.category as BlogCategorySlug,
        publishedAt: day(r.publishedAt!), updatedAt: day(r.updatedAt), readingMinutes: readingMinutes(r.content), featured: r.featured,
        content: r.content, tags: r.tags, authorName: r.author?.name ?? null,
        relatedTools: r.relatedTools.flatMap((slug) => { const tool = getToolOrNull(slug); return tool ? [{ name: tool.name, href: `/${tool.slug}` }] : []; }),
        searchText: [...r.tags, ...markdownHeadings(r.content).map((h) => h.text)].join(" "),
      }));
    } catch (error) {
      console.error("Blog: couldn't load posts from the database.", error);
      return [];
    }
  },
  ["blog-db-posts"],
  { tags: [BLOG_TAG], revalidate: 300 },
);

export async function getDbPost(slug: string) {
  return (await loadDbPosts()).find((p) => p.slug === slug) ?? null;
}

/** Every published article, newest first. */
export async function getAllPosts(): Promise<BlogSummary[]> {
  const db = (await loadDbPosts()).map(({ slug, title, description, excerpt, category, publishedAt, updatedAt, readingMinutes, featured, searchText }) => ({ slug, title, description, excerpt, category, publishedAt, updatedAt, readingMinutes, featured, searchText }));
  const staticSlugs = new Set(blogPosts.map((p) => p.slug));
  return [...blogPosts.map(summarizeStatic), ...db.filter((p) => !staticSlugs.has(p.slug))].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getAllPostsInCategory(category: BlogCategorySlug) {
  return (await getAllPosts()).filter((p) => p.category === category);
}

/** Slugs taken by built-in guides, so editor posts can't shadow them. */
export const STATIC_BLOG_SLUGS = new Set(blogPosts.map((p) => p.slug));
