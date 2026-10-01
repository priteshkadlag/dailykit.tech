"use client";

import { useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CornerDownLeft, Search } from "lucide-react";
import { searchTools } from "@/lib/search";
import { cn } from "@/lib/utils";
import { ToolIcon } from "@/components/shared/tool-icon";

const CHIPS = ["GST", "Merge PDF", "Compress image", "Hindi typing", "Income tax", "JSON", "QR code", "Word counter"];

/** Footer tool search: an accessible combobox with live results, arrow-key navigation and Enter to open. */
export function FooterSearch() {
  const router = useRouter();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const results = useMemo(() => (query.trim() ? searchTools(query, 6) : []), [query]);
  const showList = open && query.trim().length > 0;

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && results.length) { e.preventDefault(); setOpen(true); setActive((a) => (a + 1) % results.length); }
    else if (e.key === "ArrowUp" && results.length) { e.preventDefault(); setActive((a) => (a - 1 + results.length) % results.length); }
    else if (e.key === "Escape") { if (open && query) setOpen(false); else setQuery(""); }
  };

  return (
    <div className="relative">
      <form
        role="search"
        action="/search"
        method="get"
        onSubmit={(e) => {
          e.preventDefault();
          const pick = results[active] ?? results[0];
          if (pick) go(pick.href);
          else if (query.trim()) go(`/search?q=${encodeURIComponent(query.trim())}`);
        }}
      >
        <label htmlFor={`${id}-input`} className="sr-only">Search all tools</label>
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-4 z-10 size-5 text-white/80" aria-hidden />
          <input
            ref={input}
            id={`${id}-input`}
            name="q"
            type="search"
            role="combobox"
            aria-expanded={showList}
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            aria-activedescendant={showList && results[active] ? `${id}-opt-${active}` : undefined}
            autoComplete="off"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 150)}
            onKeyDown={onKeyDown}
            placeholder="Search tools — GST, PDF, Hindi, JSON…"
            className="h-14 w-full rounded-2xl border border-white/25 bg-white/10 pr-28 pl-12 text-base text-white shadow-inner outline-none backdrop-blur placeholder:text-white/60 focus:border-white/60 focus:bg-white/15 focus:ring-4 focus:ring-white/20 [&::-webkit-search-cancel-button]:hidden"
          />
          <button type="submit" className="absolute right-2 inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-blue-700 shadow-sm transition-colors hover:bg-white/90">
            Find <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      </form>

      {showList && (
        <ul id={`${id}-list`} role="listbox" aria-label="Matching tools" className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border bg-popover p-1.5 text-popover-foreground shadow-2xl">
          {results.length ? results.map((r, i) => (
            <li key={r.id} id={`${id}-opt-${i}`} role="option" aria-selected={i === active}>
              <Link
                href={r.href}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setOpen(false)}
                className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5", i === active && "bg-accent")}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted"><ToolIcon name={r.icon} className="size-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{r.name}{!r.live && <span className="ml-1.5 text-xs text-muted-foreground">(soon)</span>}</span>
                  <span className="block truncate text-xs text-muted-foreground">{r.categoryName}</span>
                </span>
                {i === active && <CornerDownLeft className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
              </Link>
            </li>
          )) : (
            <li className="px-3 py-4 text-sm text-muted-foreground">No tools match &ldquo;{query.trim()}&rdquo;. Try a shorter word.</li>
          )}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Popular searches">
        {CHIPS.map((chip) => (
          <button key={chip} type="button" onClick={() => { setQuery(chip); setActive(0); setOpen(true); input.current?.focus(); }}
            className="min-h-8 rounded-full border border-white/25 bg-white/10 px-3 text-sm text-white/90 transition-colors hover:bg-white/20">{chip}</button>
        ))}
      </div>
    </div>
  );
}

export function BackToTop() {
  return (
    <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="inline-flex min-h-10 items-center gap-1.5 rounded-full border bg-background px-4 text-sm font-medium hover:bg-accent">
      Back to top <ArrowRight className="size-4 -rotate-90" aria-hidden />
    </button>
  );
}
