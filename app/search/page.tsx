import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { searchTools } from "@/lib/search";
import { getPopularTools } from "@/lib/tools";
import { Badge } from "@/components/ui/badge";
import { SearchForm } from "@/components/shared/search-form";
import { ToolGrid } from "@/components/shared/tool-card";
import { ToolIcon } from "@/components/shared/tool-icon";

export const metadata: Metadata = {
  title: "Search Tools",
  robots: { index: false, follow: true },
};

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.slice(0, 100) ?? "";
  const results = searchTools(query);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
      <header className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">{query ? <>Results for “{query}”</> : "Search tools"}</h1>
        <SearchForm size="md" defaultValue={query} autoFocus={!query} />
      </header>

      {query && results.length > 0 && (
        <ul className="divide-y rounded-xl bg-card ring-1 ring-foreground/10">
          {results.map((r) => {
            const content = (
              <>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <ToolIcon name={r.icon} className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 font-medium">
                    {r.name}
                    {!r.live && <Badge variant="secondary">Coming soon</Badge>}
                  </span>
                  <span className="block text-sm text-muted-foreground">{r.description}</span>
                </span>
                <span className="hidden text-xs text-muted-foreground sm:block">{r.categoryName}</span>
              </>
            );
            return (
              <li key={r.id}>
                {r.live ? (
                  <Link href={r.href} className="flex items-center gap-4 p-4 hover:bg-muted/50">
                    {content}
                  </Link>
                ) : (
                  <div className="flex items-center gap-4 p-4 opacity-75">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {query && results.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-10 text-center">
          <SearchX className="size-8 text-muted-foreground" aria-hidden />
          <p className="font-medium">No tools found for “{query}”</p>
          <p className="text-sm text-muted-foreground">Try a simpler word like “gst”, “loan” or “pdf”.</p>
        </div>
      )}

      {(!query || results.length === 0) && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Popular tools</h2>
          <ToolGrid tools={getPopularTools().slice(0, 6)} />
        </section>
      )}
    </div>
  );
}
