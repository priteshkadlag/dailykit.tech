import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";
import { blogCategories, formatBlogDate, type BlogPost } from "@/lib/blog";
import { cn } from "@/lib/utils";

export type BlogCardPost = Pick<BlogPost, "slug" | "title" | "excerpt" | "category" | "publishedAt" | "readingMinutes">;

export function BlogCard({ post, featured = false }: { post: BlogCardPost; featured?: boolean }) {
  const category = blogCategories.find((item) => item.slug === post.category)!;
  return (
    <article className={cn("group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md", featured && "md:grid md:grid-cols-[1.05fr_1fr]")}>
      <Link href={`/blog/${post.slug}`} className={cn("relative flex min-h-48 items-end overflow-hidden bg-gradient-to-br p-6", category.accent, featured && "md:min-h-80")} aria-label={`Read ${post.title}`}>
        <div aria-hidden className="absolute -top-16 -right-12 size-48 rounded-full border border-foreground/10" />
        <div aria-hidden className="absolute top-8 right-10 size-16 rounded-full bg-background/40" />
        <span className="relative rounded-full border border-foreground/10 bg-background/85 px-3 py-1 text-xs font-semibold backdrop-blur">{category.name}</span>
      </Link>
      <div className={cn("flex flex-1 flex-col p-5", featured && "justify-center sm:p-7")}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time><span aria-hidden>·</span><span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" aria-hidden />{post.readingMinutes} min read</span>
        </div>
        <h2 className={cn("mt-3 font-bold tracking-tight text-balance", featured ? "text-2xl sm:text-3xl" : "text-xl")}><Link href={`/blog/${post.slug}`} className="hover:text-primary">{post.title}</Link></h2>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
        <Link href={`/blog/${post.slug}`} className="mt-5 inline-flex min-h-10 items-center gap-2 self-start text-sm font-semibold text-primary">Read article <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden /></Link>
      </div>
    </article>
  );
}
