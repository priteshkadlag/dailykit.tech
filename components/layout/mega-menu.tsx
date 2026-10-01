"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown, LayoutGrid, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  categories, getToolSections, getToolsInCategory, liveTools, toolHref,
  type CategorySlug, type IconName, type Tool,
} from "@/lib/tools";
import { ToolIcon } from "@/components/shared/tool-icon";

/** The header's top-level menus, each gathering related categories. */
export const MENUS: { id: string; label: string; icon: IconName; categories: CategorySlug[] }[] = [
  { id: "business", label: "Business", icon: "briefcase", categories: ["business-tools", "finance-tools", "real-estate-tools"] },
  { id: "calculators", label: "Calculators", icon: "calculator", categories: ["calculators", "health-fitness"] },
  { id: "pdf", label: "PDF", icon: "file-stack", categories: ["pdf-tools"] },
  { id: "media", label: "Image & Video", icon: "image", categories: ["image-tools", "creator-tools"] },
  { id: "languages", label: "Languages", icon: "languages", categories: ["typing-tools", "font-converters"] },
  { id: "text", label: "Text & Utilities", icon: "file-text", categories: ["text-tools", "productivity", "qr-security", "communication"] },
  { id: "developer", label: "Developer", icon: "code", categories: ["developer-tools"] },
];

/** A category's tools, split into the same sections its category page uses. */
export const categorySections = getToolSections;

const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

function menuForPath(pathname: string) {
  const slug = pathname.split("/")[pathname.startsWith("/category/") ? 2 : 1];
  return MENUS.find((menu) => menu.categories.some((c) => c === slug || getToolsInCategory(c).some((t) => t.slug === slug)))?.id;
}

export function MegaMenuBar() {
  const pathname = usePathname();
  const [openId, setOpenId] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const activeMenu = useMemo(() => menuForPath(pathname), [pathname]);

  const close = useCallback(() => setOpenId(null), []);
  // Close on navigation, outside clicks and Escape.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpenId(null);
  }
  useEffect(() => {
    if (!openId) return;
    const onPointer = (event: PointerEvent) => { if (!barRef.current?.contains(event.target as Node)) close(); };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      document.getElementById(`menu-trigger-${openId}`)?.focus();
      close();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onPointer); document.removeEventListener("keydown", onKey); };
  }, [openId, close]);

  // Hover opens menus on devices with a mouse; a short delay stops menus flashing as the pointer passes over.
  const hover = (event: React.PointerEvent, id: string | null, delay: number) => {
    if (event.pointerType !== "mouse") return;
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpenId(id), delay);
  };

  const openMenu = MENUS.find((menu) => menu.id === openId);

  return (
    <div ref={barRef} className="relative hidden border-t lg:block" onPointerLeave={(event) => hover(event, null, 200)} onPointerEnter={() => clearTimeout(hoverTimer.current)}>
      <nav aria-label="Tool categories" className="mx-auto flex h-12 max-w-6xl items-center gap-1 px-4 sm:px-6">
        {MENUS.map((menu) => {
          const open = openId === menu.id;
          return (
            <button
              key={menu.id}
              id={`menu-trigger-${menu.id}`}
              type="button"
              aria-expanded={open}
              aria-controls={`menu-panel-${menu.id}`}
              onClick={() => setOpenId(open ? null : menu.id)}
              onPointerEnter={(event) => hover(event, menu.id, openId ? 0 : 120)}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-full px-2.5 text-sm xl:px-3 font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                open ? "bg-brand text-white shadow-md shadow-blue-950/40" : activeMenu === menu.id ? "bg-white/15 text-white" : "text-slate-100 hover:bg-white/10 hover:text-white",
              )}
            >
              {menu.label}
              <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden />
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-1">
          <Link href="/tools" className={cn("flex h-9 items-center gap-1.5 rounded-full px-2.5 text-sm xl:px-3 font-medium whitespace-nowrap transition-colors", pathname === "/tools" ? "bg-white/15 text-white" : "text-slate-100 hover:bg-white/10 hover:text-white")}>
            <LayoutGrid className="size-4" aria-hidden />
            All tools
            <span className="rounded-full bg-sky-400/20 px-1.5 text-xs font-semibold text-sky-200 tabular-nums">{liveTools.length}</span>
          </Link>
        </div>
      </nav>
      {openMenu && <MenuPanel key={openMenu.id} menu={openMenu} onNavigate={close} />}
    </div>
  );
}

function MenuPanel({ menu, onNavigate }: { menu: (typeof MENUS)[number]; onNavigate: () => void }) {
  const [selected, setSelected] = useState<CategorySlug>(menu.categories[0]);
  const [query, setQuery] = useState("");
  const filterId = useId();
  const category = categoryBySlug.get(selected)!;
  const sections = useMemo(() => categorySections(selected), [selected]);
  const needle = query.trim().toLocaleLowerCase();
  // While filtering, search every category in this menu at once.
  const matches = useMemo(() => {
    if (!needle) return [];
    const seen = new Set<string>();
    return menu.categories.flatMap((slug) => getToolsInCategory(slug).map((tool) => ({ tool, slug })))
      .filter(({ tool }) => !seen.has(tool.slug) && seen.add(tool.slug) && [tool.name, tool.shortDescription, ...tool.keywords].some((text) => text.toLocaleLowerCase().includes(needle)));
  }, [menu, needle]);

  return (
    <div id={`menu-panel-${menu.id}`} role="region" aria-label={`${menu.label} tools`} className="absolute inset-x-0 top-full isolate z-50 overflow-hidden border-b border-white/10 bg-linear-to-br from-[#0f1d52] via-[#1c1868] to-[#0a1838] shadow-2xl shadow-blue-950/50 animate-in fade-in-0 slide-in-from-top-1 duration-150">
      {/* Background art, matching the header. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-sky-400/60 via-fuchsia-400/60 to-blue-500/60" />
        <div className="absolute -top-32 left-[8%] size-96 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute top-1/3 right-[5%] size-[26rem] rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="absolute -bottom-40 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.05)_1px,transparent_1px)] mask-[linear-gradient(to_bottom,black,transparent_85%)] bg-size-[18px_18px]" />
      </div>
      <div className="mx-auto grid max-w-6xl grid-cols-[15rem_minmax(0,1fr)] px-4 sm:px-6">
        {/* Categories in this menu */}
        <div className="flex flex-col gap-1 border-r border-white/10 bg-white/3 py-4 pr-4 pl-1">
          {menu.categories.map((slug) => {
            const c = categoryBySlug.get(slug)!;
            const count = getToolsInCategory(slug).length;
            const active = slug === selected && !needle;
            return (
              <button
                key={slug}
                type="button"
                onPointerEnter={(event) => event.pointerType === "mouse" && setSelected(slug)}
                onFocus={() => setSelected(slug)}
                onClick={() => { setSelected(slug); setQuery(""); }}
                className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring", active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/10 hover:text-foreground")}
              >
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-md", active ? "bg-primary text-primary-foreground" : "bg-muted")}>
                  <ToolIcon name={c.icon} className="size-4" />
                </span>
                <span className="min-w-0 flex-1 text-sm leading-tight font-medium">{c.name}</span>
                <span className="text-xs tabular-nums opacity-70">{count}</span>
              </button>
            );
          })}
          <Link href="/tools" onClick={onNavigate} className="mt-auto flex items-center gap-1 px-3 pt-4 text-sm font-medium text-primary hover:underline">
            Browse all tools <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>

        {/* Tools */}
        <div className="flex max-h-[min(70vh,40rem)] min-h-0 flex-col py-4 pl-6">
          <div className="flex flex-wrap items-start gap-3 pb-3">
            <div className="min-w-0 flex-1">
              {needle ? <p className="font-semibold">{matches.length} {matches.length === 1 ? "tool" : "tools"} matching “{query.trim()}”</p> : <>
                <Link href={`/category/${category.slug}`} onClick={onNavigate} className="group inline-flex items-center gap-1 font-semibold hover:text-primary">
                  {category.name}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
                <p className="line-clamp-1 text-sm text-slate-300">{category.description}</p>
              </>}
            </div>
            <label htmlFor={filterId} className="relative flex w-56 items-center">
              <span className="sr-only">Filter {menu.label} tools</span>
              <Search className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground" aria-hidden />
              <input
                id={filterId}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Filter ${menu.label.toLowerCase()}…`}
                className="h-9 w-full rounded-lg border border-white/15 bg-white/5 pr-8 pl-8 text-sm text-white outline-none placeholder:text-slate-400 focus-visible:border-sky-400/60 focus-visible:ring-2 focus-visible:ring-sky-400/30"
              />
              {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear filter" className="absolute right-2 text-muted-foreground hover:text-foreground"><X className="size-4" /></button>}
            </label>
          </div>
          <div className="min-h-0 overflow-y-auto overscroll-contain pr-1">
            {needle
              ? matches.length
                ? <ToolGrid tools={matches.map((m) => m.tool)} onNavigate={onNavigate} />
                : <p className="py-8 text-center text-sm text-muted-foreground">No tools here match “{query.trim()}”. Try the search box at the top.</p>
              : sections.map((section) => (
                <section key={section.name ?? "all"} className="mb-4 last:mb-0">
                  {section.name && <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-sky-300/90 uppercase">{section.name}</h3>}
                  <ToolGrid tools={section.tools} onNavigate={onNavigate} />
                </section>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolGrid({ tools, onNavigate }: { tools: Tool[]; onNavigate: () => void }) {
  return (
    <ul className="grid grid-cols-2 gap-x-2 xl:grid-cols-3">
      {tools.map((tool) => <li key={tool.slug}><ToolLink tool={tool} onNavigate={onNavigate} /></li>)}
    </ul>
  );
}

export function ToolLink({ tool, onNavigate, compact }: { tool: Tool; onNavigate?: () => void; compact?: boolean }) {
  const soon = tool.status !== "live";
  return (
    <Link
      href={toolHref(tool)}
      onClick={onNavigate}
      title={tool.shortDescription}
      className={cn("group flex items-center gap-2.5 rounded-md px-2 text-sm transition-colors hover:bg-primary/10", compact ? "min-h-10" : "min-h-9", soon ? "text-muted-foreground" : "text-foreground/90 hover:text-foreground")}
    >
      <ToolIcon name={tool.icon} className={cn("size-4 shrink-0", soon ? "opacity-50" : "text-primary/80 group-hover:text-primary")} />
      <span className="min-w-0 flex-1 truncate">{tool.name}</span>
      {soon && <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Soon</span>}
    </Link>
  );
}
