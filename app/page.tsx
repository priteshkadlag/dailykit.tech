import Link from "next/link";
import { ArrowRight, Gauge, IndianRupee, LockKeyhole, Smartphone, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site";
import { CATEGORY_TINT } from "@/lib/category-style";
import { categories, getPopularTools, getTool, getToolsInCategory, liveTools, type Tool } from "@/lib/tools";
import { ToolIcon } from "@/components/shared/tool-icon";
import { ToolExplorer } from "@/components/home/tool-explorer";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const benefits = [
  { icon: IndianRupee, title: "Made for India", text: "₹ with lakh and crore grouping, GST splits, Indian tax rules and 20+ Indian languages built in." },
  { icon: Gauge, title: "Instant results", text: "Answers update as you type. No sign-up, no waiting, no clutter." },
  { icon: LockKeyhole, title: "Private by default", text: "Calculators, PDF and image tools run in your browser — your files and numbers stay on your device." },
  { icon: Smartphone, title: "Works on any phone", text: "Large touch targets and layouts built for the shop counter as much as the desk." },
];

// Signature tools for the floating hero mosaic: [slug, tilt in degrees, float delay in seconds].
const MOSAIC: [string, number, number][] = [
  ["gst-calculator", -6, 0], ["merge-pdf", 4, 1.2], ["hindi-mangal-keyboard", -3, 2.4], ["qr-code-generator", 5, 0.6],
  ["income-tax-calculator", 3, 1.8], ["image-compressor", -5, 3], ["invoice-generator", -2, 0.9], ["json-formatter", 6, 2.1],
  ["random-picker", -4, 1.5], ["emi-calculator", 2, 2.7], ["speech-to-text", -6, 0.3], ["unit-converter", 4, 3.3],
];

function Mosaic() {
  const items = MOSAIC.map(([slug, tilt, delay]) => ({ tool: tryTool(slug), tilt, delay })).filter((m): m is { tool: Tool; tilt: number; delay: number } => !!m.tool);
  return (
    <div className="relative mx-auto aspect-square max-w-md">
      <div aria-hidden className="absolute inset-8 rounded-full bg-linear-to-br from-primary/25 via-sky-300/20 to-fuchsia-300/20 blur-2xl" />
      <ul className="relative grid h-full grid-cols-4 grid-rows-3 gap-3" aria-label="Featured tools">
        {items.map(({ tool, tilt, delay }, i) => (
          <li key={tool.slug} className={cn(i % 4 === 1 && "translate-y-6", i % 4 === 3 && "-translate-y-4")}>
            <Link
              href={`/${tool.slug}`}
              title={tool.name}
              style={{ "--tilt": `${tilt}deg`, animationDelay: `${delay}s` } as React.CSSProperties}
              className="group flex h-full flex-col items-center justify-center gap-1.5 rounded-2xl bg-card/90 p-2 text-center shadow-md ring-1 ring-foreground/10 backdrop-blur transition-[box-shadow,scale] hover:z-10 hover:scale-110 hover:shadow-xl hover:ring-primary/40 motion-safe:animate-[float_6s_ease-in-out_infinite] [rotate:var(--tilt)]"
            >
              <span className={cn("flex size-10 items-center justify-center rounded-xl", CATEGORY_TINT[tool.categories[0]].icon)}><ToolIcon name={tool.icon} className="size-5" /></span>
              <span className="line-clamp-2 text-[11px] leading-tight font-medium text-muted-foreground group-hover:text-foreground">{tool.name.replace(/ Calculator$/, "")}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function tryTool(slug: string): Tool | null {
  try { return getTool(slug); } catch { return null; }
}

function Stats() {
  const stats = [
    { value: `${liveTools.length}+`, label: "free tools" },
    { value: String(categories.length), label: "categories" },
    { value: `${getToolsInCategory("typing-tools").length}+`, label: "language keyboards" },
    { value: "0", label: "sign-ups needed" },
  ];
  return (
    <dl className="mt-8 grid max-w-lg grid-cols-4 gap-3 border-t pt-6">
      {stats.map((s) => (
        <div key={s.label}>
          <dt className="sr-only">{s.label}</dt>
          <dd className="text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">{s.value}</dd>
          <dd className="text-xs text-muted-foreground">{s.label}</dd>
        </div>
      ))}
    </dl>
  );
}

function Popular() {
  const [feature, ...rest] = getPopularTools().slice(0, 9);
  return (
    <section aria-labelledby="popular-heading" className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-primary"><Sparkles className="size-4" aria-hidden /> Most used</p>
          <h2 id="popular-heading" className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Start with a favourite</h2>
        </div>
      </div>
      <ul className="mt-6 grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {feature && (
          <li className="sm:col-span-2 lg:row-span-2">
            <Link href={`/${feature.slug}`} className="group relative flex h-full min-h-56 flex-col justify-between overflow-hidden rounded-2xl bg-linear-to-br from-blue-700 to-sky-600 p-6 text-white shadow-lg transition-transform hover:-translate-y-1">
              <div aria-hidden className="absolute -top-16 -right-16 size-64 rounded-full bg-white/10" />
              <div aria-hidden className="absolute -right-6 -bottom-20 size-48 rounded-full bg-white/10" />
              <span className="relative flex size-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25"><ToolIcon name={feature.icon} className="size-7" /></span>
              <div className="relative">
                <p className="text-xs font-semibold tracking-wide text-white/75 uppercase">#1 most used</p>
                <h3 className="mt-1 text-2xl font-bold">{feature.name}</h3>
                <p className="mt-2 max-w-sm text-white/85">{feature.shortDescription}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition-transform group-hover:translate-x-1">Open tool <ArrowRight className="size-4" /></span>
              </div>
            </Link>
          </li>
        )}
        {rest.map((tool) => (
          <li key={tool.slug}>
            <Link href={`/${tool.slug}`} className="group flex h-full flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/30">
              <span className={cn("flex size-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110", CATEGORY_TINT[tool.categories[0]].icon)}><ToolIcon name={tool.icon} className="size-5" /></span>
              <span className="font-semibold leading-snug">{tool.name}</span>
              <span className="line-clamp-2 text-sm text-muted-foreground">{tool.shortDescription}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <ToolExplorer
        intro={
          <>
            <p className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:hidden" /><span className="relative inline-flex size-2 rounded-full bg-emerald-500" /></span>
              {liveTools.length} tools live · free · no sign-up
            </p>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Every tool you need,{" "}
              <span className="bg-linear-to-r from-primary via-sky-500 to-fuchsia-500 bg-clip-text text-transparent">one search away.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground text-pretty">
              Calculators, PDF and image tools, Indian-language typing, converters and developer utilities — fast, private and made for India.
            </p>
          </>
        }
        aside={<Mosaic />}
        stats={<Stats />}
        popular={<Popular />}
      />

      <div className="mx-auto max-w-6xl space-y-16 px-4 pb-16 sm:px-6">
        <section aria-labelledby="why-heading" className="rounded-3xl bg-muted/50 p-6 sm:p-10">
          <h2 id="why-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">Why people use {siteConfig.name}</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map(({ icon: Icon, title, text }) => (
              <div key={title} className="space-y-2">
                <span className="flex size-11 items-center justify-center rounded-xl bg-card text-primary shadow-sm ring-1 ring-foreground/10"><Icon className="size-5" aria-hidden /></span>
                <h3 className="pt-1 font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-blue-700 to-sky-600 px-6 py-12 text-center text-white sm:px-12">
          <div aria-hidden className="absolute -top-24 -left-24 size-72 rounded-full bg-white/10" />
          <div aria-hidden className="absolute -right-20 -bottom-28 size-80 rounded-full bg-white/10" />
          <h2 className="relative text-2xl font-bold tracking-tight sm:text-3xl">Can&apos;t find the tool you need?</h2>
          <p className="relative mx-auto mt-2 max-w-md text-white/85">Browse the full directory of {liveTools.length} tools, or tell us what to build next.</p>
          <div className="relative mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/tools" className="inline-flex h-11 items-center rounded-lg bg-white px-6 text-sm font-semibold text-blue-700 shadow-sm hover:bg-white/90">Browse all tools</Link>
            <Link href="/contact" className="inline-flex h-11 items-center rounded-lg border border-white/40 px-6 text-sm font-semibold text-white hover:bg-white/10">Suggest a tool</Link>
          </div>
        </section>
      </div>
    </>
  );
}
