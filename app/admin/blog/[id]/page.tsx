import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/site";
import { BlogEditor } from "@/components/admin/blog-editor";

export const metadata: Metadata = { title: "Edit post" };

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) notFound();
  return (
    <div className="space-y-4">
      <Link href="/admin/blog" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> All posts</Link>
      <BlogEditor
        siteUrl={siteConfig.url}
        initial={{
          id: post.id, title: post.title, slug: post.slug, category: post.category, excerpt: post.excerpt,
          description: post.description === post.excerpt.slice(0, 160) ? "" : post.description,
          content: post.content, tags: post.tags, relatedTools: post.relatedTools, featured: post.featured, status: post.status,
          publishedAt: post.publishedAt ? post.publishedAt.toISOString().slice(0, 10) : "",
        }}
      />
    </div>
  );
}
