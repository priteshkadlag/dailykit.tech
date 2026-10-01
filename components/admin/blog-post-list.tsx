"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, Pencil, Search, Trash2 } from "lucide-react";
import { deleteBlogPostAction, setBlogStatusAction } from "@/lib/admin/blog-actions";
import { blogCategories } from "@/lib/blog";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

export interface AdminPostRow {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: string | null;
  updatedAt: string;
  scheduled: boolean;
  author: string | null;
}

const date = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export function BlogPostList({ posts }: { posts: AdminPostRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "PUBLISHED" | "DRAFT">("all");
  const [pending, startTransition] = useTransition();
  const needle = query.trim().toLowerCase();
  const rows = posts.filter((p) => (status === "all" || p.status === status) && (!needle || p.title.toLowerCase().includes(needle) || p.slug.includes(needle)));
  const counts = { all: posts.length, PUBLISHED: posts.filter((p) => p.status === "PUBLISHED").length, DRAFT: posts.filter((p) => p.status === "DRAFT").length };

  const run = (action: () => Promise<{ ok: boolean; message: string }>) => startTransition(async () => {
    const result = await action();
    if (result.ok) toast.success(result.message); else toast.error(result.message);
    router.refresh();
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-60 flex-1">
          <span className="sr-only">Search posts</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your posts…" className="h-10 w-full rounded-lg border bg-card pr-3 pl-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40" />
        </label>
        <div className="flex rounded-lg bg-muted p-1" role="radiogroup" aria-label="Status">
          {(["all", "PUBLISHED", "DRAFT"] as const).map((s) => (
            <button key={s} type="button" role="radio" aria-checked={status === s} onClick={() => setStatus(s)}
              className={cn("rounded-md px-3 py-1.5 text-sm font-medium", status === s ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {s === "all" ? "All" : s === "PUBLISHED" ? "Published" : "Drafts"} <span className="tabular-nums opacity-60">{counts[s]}</span>
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-10 text-center">
          <p className="font-semibold">{posts.length ? "No posts match." : "No posts yet"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{posts.length ? "Try another word or status." : "Write your first article — it appears on the blog as soon as you publish."}</p>
          {!posts.length && <Link href="/admin/blog/new" className="mt-4 inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white">Write a post</Link>}
        </div>
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {rows.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
              <div className="min-w-0 flex-1">
                <Link href={`/admin/blog/${p.id}`} className="font-medium hover:text-primary">{p.title}</Link>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {blogCategories.find((c) => c.slug === p.category)?.name ?? p.category} · /blog/{p.slug} · edited {date(p.updatedAt)}{p.author && ` · ${p.author}`}
                </p>
              </div>
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", p.status === "DRAFT" ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200" : p.scheduled ? "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300")}>
                {p.status === "DRAFT" ? "Draft" : p.scheduled ? `Scheduled ${date(p.publishedAt!)}` : `Published ${date(p.publishedAt!)}`}
              </span>
              <div className="flex items-center gap-1">
                <Link href={`/admin/blog/${p.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}><Pencil /> Edit</Link>
                {p.status === "PUBLISHED" && !p.scheduled && <Link href={`/blog/${p.slug}`} target="_blank" className={buttonVariants({ variant: "ghost", size: "sm" })}><ExternalLink /> View</Link>}
                <Button variant="outline" size="sm" disabled={pending} onClick={() => run(() => setBlogStatusAction(p.id, p.status === "DRAFT" ? "PUBLISHED" : "DRAFT"))}>{p.status === "DRAFT" ? "Publish" : "Unpublish"}</Button>
                <Button variant="ghost" size="icon-sm" aria-label={`Delete ${p.title}`} disabled={pending} onClick={() => { if (window.confirm(`Delete "${p.title}"? This can't be undone.`)) run(() => deleteBlogPostAction(p.id)); }}><Trash2 className="text-destructive" /></Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
