"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { blogCategories, type BlogCategorySlug } from "@/lib/blog";
import { cn } from "@/lib/utils";
import { BlogCard, type BlogCardPost } from "@/components/blog/blog-card";

export type ExplorerPost = BlogCardPost & { description: string; featured?: boolean; searchText: string };
type Sort = "newest" | "oldest" | "quickest";
const PAGE = 12;

/** Searches title, summary, description, category, tags and headings; every word must match. */
function score(post: ExplorerPost, terms: string[]) {
  const category = blogCategories.find((c) => c.slug === post.category)?.name ?? "";
  const title = post.title.toLowerCase();
  const rest = `${post.excerpt} ${post.description} ${category} ${post.searchText}`.toLowerCase();
  let total = 0;
  for (const term of terms) {
    if (title.includes(term)) total += title.split(/\W+/).some((w) => w.startsWith(term)) ? 3 : 2;
    else if (rest.includes(term)) total += 1;
    else return 0;
  }
  return total;
}

export function BlogExplorer({ posts }: { posts: ExplorerPost[] }) {
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<BlogCategorySlug | "all">("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [shown, setShown] = useState(PAGE);
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const searching = terms.length > 0;

  // "/" jumps to the blog search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || (e.target as HTMLElement).closest("input, textarea, select, [contenteditable=true]")) return;
      e.preventDefault();
      input.current?.focus();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  const matched = useMemo(() => {
    const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return posts.map((post) => ({ post, score: words.length ? score(post, words) : 1 })).filter((x) => x.score > 0);
  }, [posts, query]);
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const { post } of matched) map.set(post.category, (map.get(post.category) ?? 0) + 1);
    return map;
  }, [matched]);
  const results = matched
    .filter(({ post }) => category === "all" || post.category === category)
    .sort((a, b) => (searching && sort === "newest" && b.score !== a.score ? b.score - a.score : 0)
      || (sort === "oldest" ? a.post.publishedAt.localeCompare(b.post.publishedAt) : sort === "quickest" ? a.post.readingMinutes - b.post.readingMinutes : b.post.publishedAt.localeCompare(a.post.publishedAt)))
    .map((x) => x.post);
  const featured = !searching && category === "all" && sort === "newest" ? posts.find((p) => p.featured) : undefined;
  const grid = results.filter((p) => p !== featured);
  const reset = () => { setQuery(""); setCategory("all"); setSort("newest"); setShown(PAGE); };

  return (
    <div className="space-y-8">
      <form role="search" onSubmit={(e) => e.preventDefault()} className="relative">
        <label htmlFor="blog-search" className="sr-only">Search {posts.length} articles</label>
        <div className="rounded-2xl bg-linear-to-r from-primary via-sky-400 to-fuchsia-400 p-0.5 shadow-lg shadow-primary/10">
          <div className="relative flex items-center rounded-[calc(1rem-2px)] bg-card">
            <Search className="pointer-events-none absolute left-4 size-5 text-muted-foreground" aria-hidden />
            <input ref={input} id="blog-search" type="search" value={query} autoComplete="off"
              onChange={(e) => { setQuery(e.target.value); setShown(PAGE); }}
              onKeyDown={(e) => { if (e.key === "Escape") setQuery(""); }}
              placeholder={`Search ${posts.length} articles — try "GST", "loan", "PDF", "AI"`}
              className="h-14 w-full rounded-[calc(1rem-2px)] bg-transparent pr-14 pl-12 text-base outline-none [&::-webkit-search-cancel-button]:hidden" />
            {query ? (
              <button type="button" onClick={() => { setQuery(""); input.current?.focus(); }} aria-label="Clear search" className="absolute right-3 flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
            ) : <kbd className="absolute right-4 hidden rounded-md border bg-muted px-2 py-1 font-mono text-xs text-muted-foreground sm:block">/</kbd>}
          </div>
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-3">
        <div className="-mx-4 flex flex-1 gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0" role="radiogroup" aria-label="Category">
          <button type="button" role="radio" aria-checked={category === "all"} onClick={() => { setCategory("all"); setShown(PAGE); }}
            className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium", category === "all" ? "border-transparent bg-brand text-white" : "bg-card hover:bg-accent")}>
            All <span className="tabular-nums opacity-70">{matched.length}</span>
          </button>
          {blogCategories.map((c) => {
            const count = counts.get(c.slug) ?? 0;
            if (!count && category !== c.slug) return null;
            return (
              <button key={c.slug} type="button" role="radio" aria-checked={category === c.slug} onClick={() => { setCategory(c.slug); setShown(PAGE); }}
                className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium", category === c.slug ? "border-transparent bg-brand text-white" : "bg-card hover:bg-accent")}>
                {c.name} <span className="tabular-nums opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-9 rounded-lg border bg-card px-2 text-sm">
            <option value="newest">{searching ? "Best match" : "Newest first"}</option>
            <option value="oldest">Oldest first</option>
            <option value="quickest">Quickest read</option>
          </select>
        </label>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {searching || category !== "all"
          ? <>{results.length} {results.length === 1 ? "article" : "articles"}{searching && <> for &ldquo;{query.trim()}&rdquo;</>}{category !== "all" && <> in {blogCategories.find((c) => c.slug === category)?.name}</>} · <button type="button" onClick={reset} className="font-medium text-primary hover:underline">Clear filters</button></>
          : <>All {posts.length} articles, newest first.</>}
      </p>

      {featured && <BlogCard post={featured} featured />}

      {grid.length ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{grid.slice(0, shown).map((post) => <BlogCard key={post.slug} post={post} />)}</div>
          {grid.length > shown && (
            <div className="text-center">
              <button type="button" onClick={() => setShown((n) => n + PAGE)} className="inline-flex min-h-11 items-center rounded-full border bg-card px-6 text-sm font-semibold hover:bg-accent">
                Show more articles <span className="ml-1.5 text-muted-foreground">({grid.length - shown} more)</span>
              </button>
            </div>
          )}
        </>
      ) : !featured && (
        <div className="rounded-2xl border-2 border-dashed p-10 text-center">
          <p className="text-lg font-semibold">No articles match</p>
          <p className="mt-1 text-sm text-muted-foreground">Try a shorter word or another category.</p>
          <button type="button" onClick={reset} className="mt-4 inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white">Show all articles</button>
        </div>
      )}
    </div>
  );
}
