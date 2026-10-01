import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tool } from "@/lib/tools";
import { Badge } from "@/components/ui/badge";
import { ToolIcon } from "@/components/shared/tool-icon";

export function ToolCard({ tool, className }: { tool: Tool; className?: string }) {
  const live = tool.status === "live";
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            live ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          <ToolIcon name={tool.icon} className="size-5" />
        </span>
        {!live && (
          <Badge variant="secondary" className="shrink-0">
            Coming soon
          </Badge>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="flex items-center gap-1 font-semibold">
          {tool.name}
          {live && (
            <ArrowRight
              className="size-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
              aria-hidden
            />
          )}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{tool.shortDescription}</p>
        {tool.features && (
          <ul className="mt-2 space-y-1 text-xs leading-relaxed text-muted-foreground">
            {tool.features.map((feature) => <li key={feature}>• {feature}</li>)}
          </ul>
        )}
      </div>
      {live && (
        <span className="mt-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-white shadow-sm shadow-blue-700/25 transition-[filter,box-shadow] group-hover:shadow-md group-hover:brightness-110">
          Use Tool <ArrowRight className="size-4" aria-hidden />
        </span>
      )}
    </>
  );

  const base =
    "group flex h-full flex-col gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 transition-all";

  if (!live) {
    return (
      <div className={cn(base, "opacity-75", className)} aria-label={`${tool.name} (coming soon)`}>
        {body}
      </div>
    );
  }

  return (
    <Link
      href={`/${tool.slug}`}
      className={cn(
        base,
        "hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {body}
    </Link>
  );
}

/** A category's tools, with PDF tools shown in their sections. */
export function CategoryTools({ tools, groups }: { tools: Tool[]; groups?: { id: string; name: string; tools: Tool[] }[] }) {
  if (!groups) return <ToolGrid tools={tools} />;
  return (
    <div className="space-y-8">
      {groups.map((g) => (
        <section key={g.id} aria-labelledby={`group-${g.id}`} className="space-y-3">
          <h2 id={`group-${g.id}`} className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            {g.name}
          </h2>
          <ToolGrid tools={g.tools} />
        </section>
      ))}
    </div>
  );
}

export function ToolGrid({ tools }: { tools: Tool[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tools.map((tool) => (
        <ToolCard key={tool.slug} tool={tool} />
      ))}
    </div>
  );
}
