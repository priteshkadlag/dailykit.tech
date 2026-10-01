import Link from "next/link";
import { ArrowRight, BadgeIndianRupee, ChevronDown, Gift, LockKeyhole, Zap } from "lucide-react";
import { siteConfig } from "@/lib/site";
import { CATEGORY_TINT } from "@/lib/category-style";
import { categories, getToolsInCategory, liveTools, type CategorySlug, type Tool } from "@/lib/tools";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/logo";
import { ToolIcon } from "@/components/shared/tool-icon";
import { BackToTop, FooterSearch } from "@/components/layout/footer-search";

// Same grouping as the header's mega menu (kept here because that module is client-only).
const GROUPS: { label: string; categories: CategorySlug[] }[] = [
  { label: "Business & Money", categories: ["business-tools", "finance-tools", "real-estate-tools"] },
  { label: "Calculators", categories: ["calculators", "health-fitness"] },
  { label: "PDF", categories: ["pdf-tools"] },
  { label: "Image & Video", categories: ["image-tools", "creator-tools"] },
  { label: "Languages", categories: ["typing-tools", "font-converters"] },
  { label: "Text & Utilities", categories: ["text-tools", "productivity", "qr-security", "communication"] },
  { label: "Developer", categories: ["developer-tools"] },
];
const PER_CATEGORY = 6;

const companyLinks = [
  { href: "/tools", label: "All tools A–Z" },
  { href: "/blog", label: "Blog" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact & suggestions" },
  { href: "/privacy", label: "Privacy" },];

const promises = [
  { icon: Gift, label: "Free to use" },
  { icon: LockKeyhole, label: "Private — runs in your browser" },
  { icon: BadgeIndianRupee, label: "Made for India" },
  { icon: Zap, label: "No sign-up needed" },
];

/** A category's best tools first: popular, then live, in registry order. */
function topTools(slug: CategorySlug): Tool[] {
  return [...getToolsInCategory(slug)].sort((a, b) => Number(!!b.popular) - Number(!!a.popular) || Number(b.status === "live") - Number(a.status === "live")).slice(0, PER_CATEGORY);
}

function CategoryLinks({ slug }: { slug: CategorySlug }) {
  const category = categories.find((c) => c.slug === slug)!;
  const count = getToolsInCategory(slug).length;
  return (
    <div className="space-y-2.5">
      <Link href={`/category/${slug}`} className="group flex items-center gap-2 text-sm font-semibold text-slate-100 transition-colors hover:text-sky-300">
        <span className={cn("flex size-6 items-center justify-center rounded-md", CATEGORY_TINT[slug].icon)}><ToolIcon name={category.icon} className="size-3.5" /></span>
        {category.name}
      </Link>
      <ul className="space-y-1.5 text-sm">
        {topTools(slug).map((t) => (
          <li key={t.slug}>
            {t.status === "live"
              ? <Link href={`/${t.slug}`} className="text-slate-300 transition-colors hover:text-white hover:underline">{t.name}</Link>
              : <span className="text-slate-400">{t.name} <span className="text-[10px] uppercase">soon</span></span>}
          </li>
        ))}
        {count > PER_CATEGORY && (
          <li><Link href={`/category/${slug}`} className="inline-flex items-center gap-1 font-medium text-sky-300 hover:text-sky-200 hover:underline">All {count} <ArrowRight className="size-3.5" aria-hidden /></Link></li>
        )}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="dark relative isolate mt-16 rounded-t-[2.5rem] bg-linear-to-b from-[#0a1230] via-[#0b0f2a] to-[#050714] text-slate-100 sm:rounded-t-[4rem]" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">Site footer</h2>

      {/* Background art, clipped to the curved top (kept separate so the search dropdown isn’t clipped). */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-t-[2.5rem] sm:rounded-t-[4rem]">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-sky-400/80 to-transparent" />
        <div className="absolute -top-40 left-1/2 h-80 w-[48rem] -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute top-1/4 -left-32 size-[28rem] rounded-full bg-blue-600/25 blur-3xl motion-safe:animate-[aurora_18s_ease-in-out_infinite_alternate]" />
        <div className="absolute top-1/2 -right-40 size-[32rem] rounded-full bg-fuchsia-600/15 blur-3xl motion-safe:animate-[aurora_22s_ease-in-out_infinite_alternate-reverse]" />
        <div className="absolute -bottom-40 left-1/3 size-[26rem] rounded-full bg-cyan-500/15 blur-3xl motion-safe:animate-[aurora_26s_ease-in-out_infinite_alternate]" />
        <div className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.09)_1px,transparent_1px)] mask-[linear-gradient(to_bottom,black,transparent_75%)] bg-size-[22px_22px]" />
      </div>

      {/* Search band */}
      <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
        <section aria-labelledby="footer-search-heading" className="relative z-10 rounded-3xl bg-linear-to-r from-sky-400/60 via-fuchsia-400/40 to-blue-500/60 p-px shadow-2xl shadow-blue-950/50">
          <div className="relative rounded-[calc(1.5rem-1px)] bg-slate-900/70 p-6 text-white backdrop-blur-xl sm:p-10">
          {/* Decorations are clipped separately so the results dropdown can extend past the band. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[calc(1.5rem-1px)]">
            <div className="absolute -top-24 -right-16 size-72 rounded-full bg-sky-500/20 blur-2xl" />
            <div className="absolute -bottom-32 left-1/4 size-80 rounded-full bg-fuchsia-500/15 blur-3xl" />
          </div>
          <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <h3 id="footer-search-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">Looking for a <span className="bg-linear-to-r from-sky-300 to-fuchsia-300 bg-clip-text text-transparent">tool?</span></h3>
              <p className="mt-2 max-w-md text-white/85">Search all {liveTools.length} free tools by name or task. Use ↑ ↓ to choose and Enter to open.</p>
            </div>
            <FooterSearch />
          </div>
          </div>
        </section>
      </div>

      {/* Tool directory: desktop grid */}
      <nav aria-label="All tools by category" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="hidden gap-x-10 md:block md:columns-3 lg:columns-4">
          {GROUPS.flatMap((group) => group.categories).filter((slug) => getToolsInCategory(slug).length).map((slug) => (
            <div key={slug} className="mb-9 break-inside-avoid"><CategoryLinks slug={slug} /></div>
          ))}
          <div className="mb-9 break-inside-avoid space-y-2.5">
            <p className="text-sm font-semibold text-white">{siteConfig.name}</p>
            <ul className="space-y-1.5 text-sm">
              {companyLinks.map((l) => <li key={l.href}><Link href={l.href} className="text-slate-300 transition-colors hover:text-white hover:underline">{l.label}</Link></li>)}
            </ul>
          </div>
        </div>

        {/* Phones: collapsible groups */}
        <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/5 md:hidden">
          {GROUPS.map((group) => (
            <details key={group.label} className="group">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 font-medium [&::-webkit-details-marker]:hidden">
                {group.label}
                <ChevronDown className="size-4 text-slate-300 transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <div className="space-y-5 px-4 pb-5">
                {group.categories.filter((slug) => getToolsInCategory(slug).length).map((slug) => <CategoryLinks key={slug} slug={slug} />)}
              </div>
            </details>
          ))}
          <details className="group">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 font-medium [&::-webkit-details-marker]:hidden">
              {siteConfig.name}
              <ChevronDown className="size-4 text-slate-300 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <ul className="space-y-2 px-4 pb-5 text-sm">
              {companyLinks.map((l) => <li key={l.href}><Link href={l.href} className="text-slate-300 transition-colors hover:text-white">{l.label}</Link></li>)}
            </ul>
          </details>
        </div>
      </nav>

      {/* Brand strip */}
      <div className="relative overflow-hidden border-t border-white/10">
        <p aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-6 bg-linear-to-b from-white/12 to-transparent bg-clip-text text-center text-[18vw] leading-none font-black tracking-tighter text-transparent select-none lg:text-[14rem]">
          {siteConfig.name}
        </p>
        <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Logo />
            <p className="max-w-sm text-sm text-slate-300">{siteConfig.tagline} Free calculators, PDF and image tools, Indian-language typing and developer utilities.</p>
          </div>
          <ul className="flex flex-wrap gap-2" aria-label="Our promises">
            {promises.map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200">
                <Icon className="size-3.5 text-sky-300" aria-hidden /> {label}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col-reverse gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-slate-400">
              © {year} {siteConfig.name}. Results are for guidance only — please verify important financial and tax figures with a qualified professional.
            </p>
            <BackToTop />
          </div>
        </div>
      </div>
    </footer>
  );
}
