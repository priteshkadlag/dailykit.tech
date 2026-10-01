import { Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrackOnce } from "./track";

export function InputCard({ title = "Enter details", children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section aria-label={title} className={cn("space-y-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6", className)}>
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

interface ResultCardProps {
  title?: string;
  /** The one number the user came for. */
  highlightLabel: string;
  highlightValue: string;
  highlightCaption?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  /** "negative" paints the headline red, e.g. for a loss. */
  tone?: "default" | "negative";
}

export function ResultCard({ title = "Result", highlightLabel, highlightValue, highlightCaption, children, actions, className, tone = "default" }: ResultCardProps) {
  return (
    <section aria-label={title} aria-live="polite" className={cn("overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10", className)}>
      <div className={cn("px-5 py-5 text-primary-foreground sm:px-6", tone === "negative" ? "bg-destructive" : "bg-primary")}>
        <p className="text-sm font-medium opacity-85">{highlightLabel}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums break-all sm:text-4xl">{highlightValue}</p>
        {highlightCaption && <p className="mt-1 text-sm opacity-85">{highlightCaption}</p>}
      </div>
      {children && <div className="px-5 py-4 sm:px-6">{children}</div>}
      {actions && <div className="flex flex-wrap gap-2 border-t bg-muted/40 px-5 py-4 sm:px-6">{actions}</div>}
      <TrackOnce event="calculation_completed" />
    </section>
  );
}

export function ResultRows({ rows }: { rows: { label: string; value: string; emphasis?: boolean; sub?: boolean }[] }) {
  return (
    <dl className="divide-y">
      {rows.map((row) => (
        <div key={row.label} className={cn("flex items-baseline justify-between gap-4 py-2.5", row.sub && "pl-4")}>
          <dt className={cn("text-sm", row.sub ? "text-muted-foreground" : "text-foreground/80")}>{row.label}</dt>
          <dd className={cn("text-right tabular-nums", row.emphasis ? "text-base font-semibold" : "text-sm font-medium")}>
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function EmptyResult({ message = "Enter your values to see the result instantly." }: { message?: string }) {
  return (
    <section
      aria-live="polite"
      className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-card/50 p-8 text-center"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Calculator className="size-6" aria-hidden />
      </span>
      <p className="max-w-xs text-sm text-muted-foreground">{message}</p>
    </section>
  );
}

export function ErrorResult({ message }: { message: string }) {
  return (
    <section
      role="alert"
      className="flex min-h-56 flex-col items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center"
    >
      <p className="font-medium text-destructive">Please check your inputs</p>
      <p className="max-w-xs text-sm text-muted-foreground">{message}</p>
    </section>
  );
}

/** Two-column calculator layout: inputs on the left, results on the right (stacked on mobile). */
export function CalculatorLayout({ inputs, result }: { inputs: React.ReactNode; result: React.ReactNode }) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {inputs}
      <div className="lg:sticky lg:top-24">{result}</div>
    </div>
  );
}
