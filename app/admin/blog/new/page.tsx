import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { siteConfig } from "@/lib/site";
import { BlogEditor, EMPTY_POST } from "@/components/admin/blog-editor";

export const metadata: Metadata = { title: "New post" };

export default async function NewBlogPostPage() {
  await requireAdmin();
  return (
    <div className="space-y-4">
      <Link href="/admin/blog" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> All posts</Link>
      <BlogEditor initial={EMPTY_POST} siteUrl={siteConfig.url} />
    </div>
  );
}
