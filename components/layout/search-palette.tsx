"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Command as CommandPrimitive } from "cmdk";
import { ArrowDown, ArrowRight, ArrowUp, Clock3, CornerDownLeft, LayoutGrid, Search, Sparkles, X } from "lucide-react";
import { CATEGORY_TINT } from "@/lib/category-style";
import { searchTools, type SearchResult } from "@/lib/search";
import { categories, getPopularTools, getToolOrNull, getToolsInCategory, tools, type CategorySlug, type Tool } from "@/lib/tools";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Highlight } from "@/components/shared/highlight";
import { ToolIcon } from "@/components/shared/tool-icon";

const QUICK = ["GST", "PDF", "Income tax", "EMI", "Image resize", "Hindi typing", "JSON", "QR code"];
const categoryName = new Map(categories.map((c) => [c.slug, c.name]));

const toResult = (t: Tool): SearchResult => ({ id: t.slug, name: t.name, description: t.shortDescription, href: `/${t.slug}`, icon: t.icon, categoryName: categoryName.get(t.categories[0]) ?? "", categories: t.categories, live: t.status === "live" });

// Recently opened tools live in this browser only (slugs, newest first).
const RECENT_KEY = "dailykit:recent-tools";
const recentListeners = new Set<() => void>();
function readRecent() {
  try { return localStorage.getItem(RECENT_KEY) ?? "[]"; } catch { return "[]"; }
}
function subscribeRecent(listener: () => void) {
  recentListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => { recentListeners.delete(listener); window.removeEventListener("storage", listener); };
}
function writeRecent(slugs: string[]) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(slugs)); } catch { /* storage unavailable */ }
  recentListeners.forEach((listener) => listener());
}
function parseRecent(raw: string): string[] {
  try { const value: unknown = JSON.parse(raw); return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : []; } catch { return []; }
}

/**
 * The search popup itself. Loaded on demand by SearchProvider (search-dialog.tsx) the first time search
 * opens, so the full tool registry and search index aren't downloaded and run on every page.
 */
export function SearchPalette({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategorySlug | "all">("all");
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const recentRaw = useSyncExternalStore(subscribeRecent, readRecent, () => "[]");

  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const searching = terms.length > 0;

  // Every match for the query, so the category chips can show how many fall in each.
  const matches = useMemo(() => (query.trim() ? searchTools(query, 500) : []), [query]);
  const counts = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const r of matches) for (const c of r.categories) map.set(c, (map.get(c) ?? new Set()).add(r.id.split("#")[0]));
    return map;
  }, [matches]);
  const toolCount = useMemo(() => new Set(matches.map((r) => r.id.split("#")[0])).size, [matches]);

  const results = useMemo(() => {
    if (searching) return matches.filter((r) => category === "all" || r.categories.includes(category)).slice(0, 40);
    if (category !== "all") return getToolsInCategory(category).map(toResult);
    return [];
  }, [searching, matches, category]);

  const recent = useMemo(
    () => parseRecent(recentRaw).map((slug) => getToolOrNull(slug)).filter((t): t is Tool => Boolean(t)).slice(0, 4).map(toResult),
    [recentRaw],
  );
  const popular = useMemo(() => getPopularTools().filter((t) => !recent.some((r) => r.id === t.slug)).slice(0, 8).map(toResult), [recent]);

  const close = () => setOpen(false);
  const go = (href: string) => {
    close();
    setQuery("");
    setCategory("all");
    router.push(href);
  };
  const openTool = (r: SearchResult) => {
    if (!r.live) return go(`/search?q=${encodeURIComponent(r.name)}`);
    const slug = r.id.split("#")[0];
    writeRecent([slug, ...parseRecent(readRecent()).filter((s) => s !== slug)].slice(0, 8));
    go(r.href);
  };
  const pickCategory = (slug: CategorySlug | "all") => {
    setCategory(slug);
    input.current?.focus();
  };
  const searchFor = (text: string) => {
    setQuery(text);
    input.current?.focus();
  };

  const activeName = category === "all" ? "" : categoryName.get(category);
  const chips = categories.filter((c) => !searching || counts.has(c.slug) || c.slug === category);

  return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          initialFocus={input}
          overlayClassName="bg-slate-950/55 supports-backdrop-filter:backdrop-blur-sm"
          className="top-3 flex max-w-[calc(100%-1.5rem)] translate-y-0 flex-col gap-0 overflow-hidden rounded-2xl p-0 shadow-2xl shadow-blue-950/40 ring-1 ring-white/10 sm:top-[10vh] sm:max-w-2xl"
        >
          <DialogTitle className="sr-only">Search tools</DialogTitle>
          <DialogDescription className="sr-only">Type to search {tools.length} tools. Use the arrow keys to move and Enter to open.</DialogDescription>
          <CommandPrimitive shouldFilter={false} loop label="Search tools" className="flex w-full min-w-0 flex-col">
            {/* Search header */}
            <div className="relative overflow-hidden bg-linear-to-br from-[#0f1d52] via-[#1c1868] to-[#0a1838] px-3 pt-3 pb-2.5 sm:px-4 sm:pt-4">
              <div aria-hidden className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-sky-500/25 blur-3xl" />
              <div aria-hidden className="pointer-events-none absolute -bottom-20 left-10 size-44 rounded-full bg-fuchsia-500/20 blur-3xl" />
              <div className="relative flex items-center gap-2">
                <div className="relative flex min-w-0 flex-1 items-center rounded-xl bg-white shadow-lg shadow-black/20 ring-2 ring-sky-400/40 focus-within:ring-sky-300">
                  <Search className="pointer-events-none absolute left-3.5 size-5 text-blue-600" aria-hidden />
                  <CommandPrimitive.Input
                    ref={input}
                    value={query}
                    onValueChange={setQuery}
                    placeholder={activeName ? `Search in ${activeName}…` : `Search ${tools.length}+ tools — GST, PDF, EMI, invoice…`}
                    className="h-12 w-full min-w-0 rounded-xl bg-transparent pr-10 pl-11 text-base text-slate-900 outline-none placeholder:text-slate-500"
                  />
                  {query && (
                    <button type="button" onClick={() => searchFor("")} aria-label="Clear search" className="absolute right-2 flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                      <X className="size-4" />
                    </button>
                  )}
                </div>
                <button type="button" onClick={close} className="h-12 shrink-0 rounded-xl border border-white/15 bg-white/10 px-3 text-xs font-semibold text-white hover:bg-white/20">
                  <span className="hidden sm:inline">Esc</span><X className="size-4 sm:hidden" aria-hidden /><span className="sr-only">Close search</span>
                </button>
              </div>
              <div role="radiogroup" aria-label="Filter by category" className="relative -mx-3 mt-2.5 flex gap-1.5 overflow-x-auto px-3 pb-0.5 scrollbar-none sm:-mx-4 sm:px-4">
                <Chip on={category === "all"} onClick={() => pickCategory("all")}>
                  <LayoutGrid className="size-3.5" aria-hidden />All{searching && <span className="tabular-nums opacity-75">{toolCount}</span>}
                </Chip>
                {chips.map((c) => (
                  <Chip key={c.slug} on={category === c.slug} onClick={() => pickCategory(c.slug)}>
                    <span className={cn("size-2 rounded-full", CATEGORY_TINT[c.slug].dot)} aria-hidden />
                    {c.name}{searching && <span className="tabular-nums opacity-75">{counts.get(c.slug)?.size ?? 0}</span>}
                  </Chip>
                ))}
              </div>
            </div>

            <CommandPrimitive.List className="max-h-[min(58vh,30rem)] scroll-py-2 overflow-y-auto overscroll-contain bg-popover p-2 outline-none">
              {searching || category !== "all" ? (
                <>
                  <CommandPrimitive.Empty className="px-4 py-10 text-center">
                    <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted"><Search className="size-5 text-muted-foreground" aria-hidden /></span>
                    <p className="mt-3 font-semibold">No tools match &ldquo;{query.trim()}&rdquo;{activeName && <> in {activeName}</>}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Try a shorter word, or one of these:</p>
                    <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                      {category !== "all" && <button type="button" onClick={() => pickCategory("all")} className="rounded-full bg-brand px-3 py-1 text-xs font-semibold">Search all categories</button>}
                      {QUICK.slice(0, 5).map((q) => <button key={q} type="button" onClick={() => searchFor(q)} className="rounded-full border bg-card px-3 py-1 text-xs font-medium hover:border-primary/40 hover:text-primary">{q}</button>)}
                    </div>
                  </CommandPrimitive.Empty>
                  {results.length > 0 && (
                    <Group heading={searching ? `${results.length === 40 ? "Top 40" : results.length} ${results.length === 1 ? "result" : "results"}${activeName ? ` in ${activeName}` : ""}` : `${activeName} · ${results.length} tools`}>
                      {results.map((r) => <ResultItem key={r.id} result={r} terms={terms} onSelect={() => openTool(r)} />)}
                    </Group>
                  )}
                  {category !== "all" && !searching && (
                    <CommandPrimitive.Item value="category-page" onSelect={() => go(`/category/${category}`)} className={itemClass}>
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand"><LayoutGrid className="size-5" aria-hidden /></span>
                      <span className="flex-1 font-semibold">Open the {activeName} page</span>
                      <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
                    </CommandPrimitive.Item>
                  )}
                </>
              ) : (
                <>
                  <div className="px-2 pt-1 pb-2">
                    <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase"><Sparkles className="size-3.5 text-amber-500" aria-hidden />Quick searches</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {QUICK.map((q) => <button key={q} type="button" onClick={() => searchFor(q)} className="rounded-full border bg-card px-3 py-1 text-xs font-medium text-foreground shadow-xs transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary">{q}</button>)}
                    </div>
                  </div>
                  {recent.length > 0 && (
                    <Group heading={<span className="flex items-center justify-between">Recently opened<button type="button" onClick={() => writeRecent([])} className="font-medium normal-case tracking-normal text-primary hover:underline">Clear</button></span>}>
                      {recent.map((r) => <ResultItem key={r.id} result={r} terms={[]} onSelect={() => openTool(r)} recent />)}
                    </Group>
                  )}
                  <Group heading="Popular tools">
                    {popular.map((r) => <ResultItem key={r.id} result={r} terms={[]} onSelect={() => openTool(r)} />)}
                  </Group>
                  <Group heading="Browse by category">
                    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                      {categories.map((c) => (
                        <CommandPrimitive.Item key={c.slug} value={`category-${c.slug}`} onSelect={() => pickCategory(c.slug)} className={cn(itemClass, "py-2")}>
                          <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", CATEGORY_TINT[c.slug].icon)}><ToolIcon name={c.icon} className="size-4" /></span>
                          <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
                          <span className="text-xs tabular-nums text-muted-foreground">{getToolsInCategory(c.slug).length}</span>
                        </CommandPrimitive.Item>
                      ))}
                    </div>
                  </Group>
                </>
              )}
            </CommandPrimitive.List>

            <div className="flex items-center justify-between gap-3 border-t bg-muted/60 px-4 py-2.5 text-xs text-muted-foreground">
              <div className="hidden items-center gap-3 sm:flex">
                <span className="flex items-center gap-1"><Kbd><ArrowUp className="size-3" /></Kbd><Kbd><ArrowDown className="size-3" /></Kbd>move</span>
                <span className="flex items-center gap-1"><Kbd><CornerDownLeft className="size-3" /></Kbd>open</span>
                <span className="flex items-center gap-1"><Kbd>esc</Kbd>close</span>
              </div>
              {searching ? toolCount > 0 && (
                <button type="button" onClick={() => go(`/search?q=${encodeURIComponent(query.trim())}`)} className="ml-auto inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                  See all {toolCount} on the search page<ArrowRight className="size-3.5" aria-hidden />
                </button>
              ) : (
                <span className="ml-auto">Open anywhere with <Kbd>/</Kbd> or <Kbd>Ctrl K</Kbd></span>
              )}
            </div>
          </CommandPrimitive>
        </DialogContent>
      </Dialog>
  );
}

const itemClass = "group/item relative flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm outline-none select-none data-[selected=true]:bg-primary/10 data-[selected=true]:ring-1 data-[selected=true]:ring-primary/25";

function Group({ heading, children }: { heading: React.ReactNode; children: React.ReactNode }) {
  return (
    <CommandPrimitive.Group heading={heading} className="mb-1 **:[[cmdk-group-heading]]:px-2.5 **:[[cmdk-group-heading]]:pt-2 **:[[cmdk-group-heading]]:pb-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:tracking-wide **:[[cmdk-group-heading]]:text-muted-foreground **:[[cmdk-group-heading]]:uppercase">
      {children}
    </CommandPrimitive.Group>
  );
}

function ResultItem({ result, terms, onSelect, recent }: { result: SearchResult; terms: string[]; onSelect: () => void; recent?: boolean }) {
  const primary = result.categories[0];
  return (
    <CommandPrimitive.Item value={`${recent ? "recent-" : ""}${result.id}`} onSelect={onSelect} className={itemClass}>
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform group-data-[selected=true]/item:scale-105", CATEGORY_TINT[primary].icon)}>
        {recent ? <Clock3 className="size-4.5" aria-hidden /> : <ToolIcon name={result.icon} className="size-5" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-semibold text-foreground"><Highlight text={result.name} terms={terms} /></span>
          {!result.live && <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">Soon</span>}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          <span className="font-medium text-foreground/70">{result.categoryName}</span> · <Highlight text={result.description} terms={terms} />
        </span>
      </span>
      <span className="hidden shrink-0 items-center gap-1 rounded-lg bg-brand px-2 py-1 text-xs font-semibold group-data-[selected=true]/item:flex">
        Open<CornerDownLeft className="size-3" aria-hidden />
      </span>
    </CommandPrimitive.Item>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" role="radio" aria-checked={on} onClick={onClick}
      className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
        on ? "border-white bg-white text-blue-800 shadow-sm" : "border-white/15 bg-white/10 text-slate-100 hover:bg-white/20")}>
      {children}
    </button>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-card px-1 font-mono text-[10px] font-medium text-foreground shadow-xs">{children}</kbd>;
}
