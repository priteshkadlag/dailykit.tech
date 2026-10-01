import type { Metadata } from "next";
import Link from "next/link";
import { PenLine } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { blogPosts } from "@/lib/blog";
import { prisma } from "@/lib/prisma";
import { BlogPostList, type AdminPostRow } from "@/components/admin/blog-post-list";

export const metadata: Metadata = { title: "Blog" };

export default async function AdminBlogPage() {
  await requireAdmin();
  const now = new Date();
  const posts = await prisma.blogPost.findMany({ orderBy: { updatedAt: "desc" }, include: { author: { select: { name: true, email: true } } } });
  const rows: AdminPostRow[] = posts.map((p) => ({
    id: p.id, title: p.title, slug: p.slug, category: p.category, status: p.status,
    publishedAt: p.publishedAt?.toISOString() ?? null, updatedAt: p.updatedAt.toISOString(),
    scheduled: p.status === "PUBLISHED" && !!p.publishedAt && p.publishedAt > now,
    author: p.author?.name ?? p.author?.email ?? null,
  }));
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blog</h1>
          <p className="mt-1 text-sm text-muted-foreground">Write, publish and manage articles. The blog also includes {blogPosts.length} built-in guides that are edited in code.</p>
        </div>
        <Link href="/admin/blog/new" className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-white shadow-sm hover:brightness-110"><PenLine className="size-4" /> New post</Link>
      </div>
      <BlogPostList posts={rows} />
    </div>
  );
}
