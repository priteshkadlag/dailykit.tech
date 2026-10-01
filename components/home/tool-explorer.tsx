"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, CornerDownLeft, Search, X } from "lucide-react";
import { CATEGORY_TINT } from "@/lib/category-style";
import { searchTools } from "@/lib/search";
import { Highlight } from "@/components/shared/highlight";
import { categories, getToolOrNull, getToolSections, liveTools, tools, type CategorySlug, type IconName } from "@/lib/tools";
import { cn } from "@/lib/utils";
import { ToolIcon } from "@/components/shared/tool-icon";

const QUICK = ["GST", "PDF", "Income tax", "Hindi keyboard", "Image resize", "JSON", "QR code", "EMI", "Invoice"];
const SECTION_PREVIEW = 8;

interface Item { id: string; name: string; description: string; href: string; icon: IconName; category: CategorySlug; categories: CategorySlug[]; live: boolean }

const byPrimary = (slug: CategorySlug) => tools.filter((t) => t.categories[0] === slug);
const toItem = (t: (typeof tools)[number]): Item => ({ id: t.slug, name: t.name, description: t.shortDescription, href: `/${t.slug}`, icon: t.icon, category: t.categories[0], categories: t.categories, live: t.status === "live" });

function Tile({ item, terms = [], showCategory = false }: { item: Item; terms?: string[]; showCategory?: boolean }) {
  const tint = CATEGORY_TINT[item.category];
  const body = (
    <>
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110 group-hover:-rotate-3", tint.icon)}>
        <ToolIcon name={item.icon} className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-medium leading-snug">
          <span className="line-clamp-2"><Highlight text={item.name} terms={terms} /></span>
          {!item.live && <span className="shrink-0 rounded-full bg-muted px-1.5 py-px text-[10px] font-semibold uppercase text-muted-foreground">Soon</span>}
        </span>
        <span className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
          {showCategory && <span className="font-medium text-foreground/70">{categories.find((c) => c.slug === item.category)?.name} · </span>}
          {item.description}
        </span>
      </span>
      {item.live && <ArrowRight className="size-4 shrink-0 -translate-x-1 text-primary opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" aria-hidden />}
    </>
  );
  const base = "group flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10 transition-all";
  if (!item.live) return <div className={cn(base, "opacity-70")}>{body}</div>;
  return <Link href={item.href} className={cn(base, "hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none")}>{body}</Link>;
}

const TileGrid = ({ items, terms, showCategory }: { items: Item[]; terms?: string[]; showCategory?: boolean }) => (
  <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {items.map((item) => <li key={item.id} className="min-w-0"><Tile item={item} terms={terms} showCategory={showCategory} /></li>)}
  </ul>
);

export function ToolExplorer({ intro, aside, stats, popular }: { intro: React.ReactNode; aside: React.ReactNode; stats: React.ReactNode; popular: React.ReactNode }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const results = useRef<HTMLElement>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategorySlug | "all">("all");
  const [expanded, setExpanded] = useState<Set<CategorySlug>>(() => new Set());
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const searching = terms.length > 0;

  // "/" focuses this search (instead of opening the header's search dialog) unless you're typing somewhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key !== "/" || e.metaKey || e.ctrlKey || target.closest("input, textarea, select, [contenteditable=true]")) return;
      e.preventDefault();
      input.current?.focus();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  const matches = useMemo<Item[]>(() => {
    if (!searching) return [];
    return searchTools(query, 500).flatMap((r) => {
      const tool = getToolOrNull(r.id.split("#")[0]);
      if (!tool) return [];
      return [{ id: r.id, name: r.name, description: r.description, href: r.href, icon: r.icon, category: tool.categories[0], categories: tool.categories, live: r.live }];
    });
  }, [query, searching]);

  const counts = useMemo(() => {
    const map = new Map<CategorySlug, number>();
    for (const c of categories) map.set(c.slug, searching ? matches.filter((m) => m.categories.includes(c.slug)).length : tools.filter((t) => t.categories.includes(c.slug)).length);
    return map;
  }, [matches, searching]);

  const filtered = category === "all" ? matches : matches.filter((m) => m.categories.includes(category));
  const total = searching ? matches.length : tools.length;
  const firstLive = filtered.find((m) => m.live);

  const pick = (slug: CategorySlug | "all") => {
    setCategory(slug);
    if (slug !== "all") results.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <section className="relative overflow-hidden border-b bg-card">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 size-[42rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute top-20 -right-32 size-96 rounded-full bg-sky-400/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-24 size-96 rounded-full bg-fuchsia-400/10 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_oklch,var(--foreground)_6%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklch,var(--foreground)_6%,transparent)_1px,transparent_1px)] mask-[radial-gradient(ellipse_at_center,black_30%,transparent_75%)] bg-size-[44px_44px]" />
        </div>
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_1fr]">
          <div>
            {intro}
            <form
              role="search"
              action="/search"
              method="get"
              className="relative mt-8"
              onSubmit={(e) => {
                e.preventDefault();
                if (firstLive) router.push(firstLive.href);
                else if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
              }}
            >
              <label htmlFor="home-search" className="sr-only">Search {liveTools.length} tools</label>
              <div className="group relative rounded-2xl bg-linear-to-r from-primary via-sky-400 to-fuchsia-400 p-[2px] shadow-lg shadow-primary/10 transition-shadow focus-within:shadow-xl focus-within:shadow-primary/20">
                <div className="relative flex items-center rounded-[calc(1rem-2px)] bg-card">
                  <Search className="pointer-events-none absolute left-4 size-5 text-muted-foreground" aria-hidden />
                  <input
                    ref={input}
                    id="home-search"
                    name="q"
                    type="search"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setCategory("all"); }}
                    onKeyDown={(e) => { if (e.key === "Escape") setQuery(""); }}
                    autoComplete="off"
                    placeholder={`Search ${liveTools.length} tools — try "GST", "merge PDF", "Hindi"`}
                    className="h-14 w-full rounded-[calc(1rem-2px)] bg-transparent pr-24 pl-12 text-base outline-none placeholder:text-muted-foreground/80 sm:h-16 sm:text-lg [&::-webkit-search-cancel-button]:hidden"
                    aria-controls="tool-results"
                  />
                  <div className="absolute right-3 flex items-center gap-1.5">
                    {query ? (
                      <button type="button" onClick={() => { setQuery(""); input.current?.focus(); }} className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted" aria-label="Clear search"><X className="size-4" /></button>
                    ) : (
                      <kbd className="hidden rounded-md border bg-muted px-2 py-1 font-mono text-xs text-muted-foreground sm:block">/</kbd>
                    )}
                  </div>
                </div>
              </div>
              <p className="mt-2 flex min-h-5 items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
                {searching ? (
                  filtered.length ? <>{filtered.length} {filtered.length === 1 ? "match" : "matches"} below{firstLive && <> · <CornerDownLeft className="size-3" aria-hidden /> Enter opens <b className="font-medium text-foreground">{firstLive.name}</b></>}</> : "No tools match yet — try another word"
                ) : "Results appear instantly as you type"}
              </p>
            </form>
            <div className="mt-4 flex flex-wrap gap-2" aria-label="Popular searches">
              {QUICK.map((q) => (
                <button key={q} type="button" onClick={() => { setQuery(q); setCategory("all"); }}
                  className="min-h-8 rounded-full border bg-background/70 px-3 text-sm backdrop-blur transition-colors hover:border-primary/40 hover:bg-accent">{q}</button>
              ))}
            </div>
            {stats}
          </div>
          <div className="hidden lg:block">{aside}</div>
        </div>
      </section>

      {!searching && popular}

      <section ref={results} id="tool-results" aria-labelledby="all-tools-heading" className="mx-auto max-w-6xl scroll-mt-32 px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="all-tools-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
              {searching ? <>Results for &ldquo;{query.trim()}&rdquo;</> : "Explore every tool"}
            </h2>
            <p className="mt-1 text-muted-foreground">{searching ? `${total} ${total === 1 ? "tool matches" : "tools match"} across ${[...counts.values()].filter(Boolean).length} categories.` : `${liveTools.length} live tools (plus ${tools.length - liveTools.length} coming soon) in ${categories.length} categories. Pick a category or search above.`}</p>
          </div>
          <Link href="/tools" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">Full A–Z directory <ArrowRight className="size-4" /></Link>
        </div>

        <div className="sticky top-[66px] z-20 -mx-4 mt-6 border-y bg-background/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-3 lg:top-[115px]" role="radiogroup" aria-label="Filter by category">
          <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] lg:flex-wrap">
            <button type="button" role="radio" aria-checked={category === "all"} data-on={category === "all"} onClick={() => pick("all")}
              className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border bg-card px-3.5 text-sm font-medium transition-colors hover:bg-accent data-[on=true]:border-transparent data-[on=true]:bg-foreground data-[on=true]:text-background">
              All <span className="tabular-nums opacity-70">{total}</span>
            </button>
            {categories.map((c) => {
              const count = counts.get(c.slug) ?? 0;
              if (searching && !count) return null;
              const tint = CATEGORY_TINT[c.slug];
              return (
                <button key={c.slug} type="button" role="radio" aria-checked={category === c.slug} data-on={category === c.slug} onClick={() => pick(c.slug)}
                  className={cn("inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border bg-card px-3.5 text-sm font-medium transition-colors hover:bg-accent data-[on=true]:border-transparent data-[on=true]:text-white", tint.chip)}>
                  <span className={cn("size-2 rounded-full", tint.dot)} aria-hidden />
                  {c.name.replace(/ (Tools|Calculators)$/, "").replace(" & Content", "")}
                  <span className="tabular-nums opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 space-y-12">
          {searching ? (
            filtered.length ? <TileGrid items={filtered} terms={terms} showCategory /> : (
              <div className="rounded-2xl border-2 border-dashed p-10 text-center">
                <p className="text-lg font-semibold">No tools found for &ldquo;{query.trim()}&rdquo;</p>
                <p className="mt-1 text-sm text-muted-foreground">Try a shorter or different word, or one of these:</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {["tax", "pdf", "image", "typing", "convert", "calculator"].map((q) => <button key={q} type="button" onClick={() => setQuery(q)} className="min-h-8 rounded-full border px-3 text-sm hover:bg-accent">{q}</button>)}
                </div>
              </div>
            )
          ) : category !== "all" ? (
            <CategoryView slug={category} />
          ) : (
            categories.map((c) => {
              const items = byPrimary(c.slug).map(toItem);
              if (!items.length) return null;
              const open = expanded.has(c.slug);
              return (
                <section key={c.slug} aria-labelledby={`sec-${c.slug}`} className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 id={`sec-${c.slug}`} className="flex items-center gap-2.5 text-lg font-semibold">
                      <span className={cn("flex size-8 items-center justify-center rounded-lg", CATEGORY_TINT[c.slug].icon)}><ToolIcon name={c.icon} className="size-4" /></span>
                      {c.name}
                      <span className="text-sm font-normal text-muted-foreground">{items.length}</span>
                    </h3>
                    <Link href={`/category/${c.slug}`} className="text-sm font-medium text-primary hover:underline">Category page →</Link>
                  </div>
                  <TileGrid items={open ? items : items.slice(0, SECTION_PREVIEW)} />
                  {items.length > SECTION_PREVIEW && (
                    <button type="button" aria-expanded={open} onClick={() => setExpanded((s) => { const next = new Set(s); if (open) next.delete(c.slug); else next.add(c.slug); return next; })}
                      className="mx-auto flex min-h-10 items-center gap-1.5 rounded-full border bg-card px-4 text-sm font-medium hover:bg-accent">
                      {open ? "Show fewer" : `Show all ${items.length} ${c.name.toLowerCase()}`}<ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
                    </button>
                  )}
                </section>
              );
            })
          )}
        </div>
      </section>
    </>
  );
}

function CategoryView({ slug }: { slug: CategorySlug }) {
  const category = categories.find((c) => c.slug === slug)!;
  const sections = getToolSections(slug);
  return (
    <div className="space-y-8">
      <p className="max-w-3xl text-muted-foreground">{category.description}</p>
      {sections.map((section, i) => (
        <div key={section.name ?? i} className="space-y-3">
          {section.name && <h3 className="text-base font-semibold">{section.name} <span className="text-sm font-normal text-muted-foreground">{section.tools.length}</span></h3>}
          <TileGrid items={section.tools.map((t) => ({ ...toItem(t), category: slug }))} />
        </div>
      ))}
      <Link href={`/category/${slug}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">Open the {category.name} page <ArrowRight className="size-4" /></Link>
    </div>
  );
}
