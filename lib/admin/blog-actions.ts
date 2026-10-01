"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { blogCategories } from "@/lib/blog";
import { slugify } from "@/lib/blog-markdown";
import { BLOG_TAG, STATIC_BLOG_SLUGS } from "@/lib/blog-store";
import { getToolOrNull } from "@/lib/tools";

export interface BlogActionResult {
  ok: boolean;
  message: string;
  id?: string;
  slug?: string;
  /** Field-level problems, keyed by field name. */
  errors?: Record<string, string>;
}

const postSchema = z.object({
  id: z.string().min(1).max(64).optional(),
  title: z.string().trim().min(5, "Write a title of at least 5 characters.").max(160, "Keep the title under 160 characters."),
  slug: z.string().trim().max(80, "Keep the URL under 80 characters."),
  category: z.enum(blogCategories.map((c) => c.slug) as [string, ...string[]], { error: "Choose a category." }),
  excerpt: z.string().trim().min(20, "Write a summary of at least 20 characters.").max(300, "Keep the summary under 300 characters."),
  description: z.string().trim().max(200, "Keep the search description under 200 characters."),
  content: z.string().trim().min(50, "The article needs at least a few sentences (50+ characters).").max(100_000, "The article is too long."),
  tags: z.array(z.string().trim().min(1).max(40)).max(12, "Use at most 12 tags."),
  relatedTools: z.array(z.string()).max(6, "Link at most 6 tools."),
  featured: z.boolean(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")),
});
export type BlogPostInput = z.input<typeof postSchema>;

async function adminOrThrow() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") throw new Error("Not allowed.");
  return user;
}

function refresh(slug?: string) {
  revalidateTag(BLOG_TAG, { expire: 0 });
  revalidatePath("/blog", "layout");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/blog", "layout");
  if (slug) revalidatePath(`/blog/${slug}`);
}

export async function saveBlogPostAction(input: BlogPostInput): Promise<BlogActionResult> {
  const user = await adminOrThrow();
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) {
    const errors = Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message]));
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }
  const data = parsed.data;
  const slug = slugify(data.slug || data.title);
  if (!slug) return { ok: false, message: "Please fix the highlighted fields.", errors: { slug: "Use letters or numbers in the URL." } };
  if (STATIC_BLOG_SLUGS.has(slug)) return { ok: false, message: "That URL is already used.", errors: { slug: "A built-in article already uses this URL." } };
  const clash = await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } });
  if (clash && clash.id !== data.id) return { ok: false, message: "That URL is already used.", errors: { slug: "Another post already uses this URL." } };

  const existing = data.id ? await prisma.blogPost.findUnique({ where: { id: data.id }, select: { slug: true, publishedAt: true } }) : null;
  if (data.id && !existing) return { ok: false, message: "This post no longer exists." };

  // Publishing stamps a date (today, unless one was chosen); drafts keep whatever date they had.
  const chosenDate = data.publishedAt ? new Date(`${data.publishedAt}T09:00:00+05:30`) : null;
  const publishedAt = data.status === "PUBLISHED" ? chosenDate ?? existing?.publishedAt ?? new Date() : chosenDate ?? existing?.publishedAt ?? null;
  const fields = {
    slug, title: data.title, category: data.category, excerpt: data.excerpt,
    description: data.description || data.excerpt.slice(0, 160),
    content: data.content,
    tags: [...new Set(data.tags.map((t) => t.toLowerCase()))],
    relatedTools: [...new Set(data.relatedTools)].filter((s) => getToolOrNull(s)),
    featured: data.featured, status: data.status, publishedAt,
  };

  const post = data.id
    ? await prisma.blogPost.update({ where: { id: data.id }, data: fields })
    : await prisma.blogPost.create({ data: { ...fields, authorId: user.id } });
  refresh(post.slug);
  if (existing && existing.slug !== post.slug) revalidatePath(`/blog/${existing.slug}`);

  const scheduled = post.status === "PUBLISHED" && post.publishedAt && post.publishedAt > new Date();
  const message = post.status === "DRAFT" ? "Draft saved." : scheduled ? `Scheduled for ${post.publishedAt!.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.` : data.id ? "Post updated." : "Post published.";
  return { ok: true, message, id: post.id, slug: post.slug };
}

export async function deleteBlogPostAction(id: string): Promise<BlogActionResult> {
  await adminOrThrow();
  const postId = z.string().min(1).max(64).parse(id);
  const post = await prisma.blogPost.findUnique({ where: { id: postId }, select: { slug: true } });
  if (!post) return { ok: false, message: "This post no longer exists." };
  await prisma.blogPost.delete({ where: { id: postId } });
  refresh(post.slug);
  return { ok: true, message: "Post deleted." };
}

export async function setBlogStatusAction(id: string, status: "DRAFT" | "PUBLISHED"): Promise<BlogActionResult> {
  await adminOrThrow();
  const postId = z.string().min(1).max(64).parse(id);
  const next = z.enum(["DRAFT", "PUBLISHED"]).parse(status);
  const post = await prisma.blogPost.findUnique({ where: { id: postId }, select: { publishedAt: true } });
  if (!post) return { ok: false, message: "This post no longer exists." };
  const updated = await prisma.blogPost.update({ where: { id: postId }, data: { status: next, publishedAt: next === "PUBLISHED" ? post.publishedAt ?? new Date() : post.publishedAt } });
  refresh(updated.slug);
  return { ok: true, message: next === "PUBLISHED" ? "Post published." : "Post moved back to drafts.", slug: updated.slug };
}
