import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Panel({ title, href, linkLabel, children, className }: { title: string; href?: string; linkLabel?: string; children: React.ReactNode; className?: string }) {
  return (
    <section aria-label={title} className={cn("flex flex-col rounded-xl bg-card ring-1 ring-foreground/10", className)}>
      <div className="flex items-center justify-between gap-3 border-b px-5 py-3.5">
        <h2 className="text-base font-semibold">{title}</h2>
        {href && (
          <Link href={href} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            {linkLabel ?? "Open"} <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        )}
      </div>
      <div className="flex-1 px-5 py-3">{children}</div>
    </section>
  );
}

export function PanelEmpty({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 py-4 text-sm text-muted-foreground">
      <p>{children}</p>
      {action}
    </div>
  );
}

export function StatCard({ label, value, caption, tone = "default" }: { label: string; value: string; caption?: string; tone?: "default" | "warning" }) {
  return (
    <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <p className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>
      <p className={cn("mt-1 text-xl font-bold tracking-tight tabular-nums sm:text-2xl", tone === "warning" && "text-amber-700")}>{value}</p>
      {caption && <p className="mt-0.5 text-xs text-muted-foreground">{caption}</p>}
    </div>
  );
}

/** Usage bar for plan limits (e.g. invoices this month). */
export function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="tabular-nums text-muted-foreground">{limit === null ? `${used} · unlimited` : `${used} / ${limit}`}</span>
      </div>
      {limit !== null && (
        <div className="h-2 overflow-hidden rounded-full bg-muted" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={limit} aria-valuenow={used}>
          <div className={cn("h-full rounded-full", pct >= 90 ? "bg-amber-500" : "bg-primary")} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}
