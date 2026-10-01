import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { Bug, Lightbulb, Mail, Sparkles } from "lucide-react";
import { siteConfig } from "@/lib/site";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

export const metadata: Metadata = pageMetadata("/contact", {
  title: "Contact Us – Questions, Bugs and Tool Ideas",
  description: `Questions, bug reports or ideas for new tools? Email the ${siteConfig.name} team — we read every message and usually reply within one working day.`,
});

const reasons = [
  { icon: Bug, title: "Report a problem", text: "Tell us which tool, what you entered and what you expected. A screenshot helps." },
  { icon: Lightbulb, title: "Suggest a tool", text: "Missing something you use every day? We add new tools regularly." },
  { icon: Sparkles, title: "Upgrade to Pro", text: "Tell us your account email and whether you'd like monthly or yearly billing." },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
      <Breadcrumbs items={[{ name: "Contact", href: "/contact" }]} />
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Contact us</h1>
        <p className="text-muted-foreground">We read every message and usually reply within one working day.</p>
      </div>
      <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-primary/20 sm:flex-row sm:items-center sm:p-6">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand">
          <Mail className="size-6" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm text-muted-foreground">Email us at</span>
          <a href={`mailto:${siteConfig.supportEmail}`} className="block text-lg font-semibold break-all text-foreground hover:text-primary sm:text-xl">
            {siteConfig.supportEmail}
          </a>
        </span>
        <a href={`mailto:${siteConfig.supportEmail}?subject=${encodeURIComponent(`${siteConfig.name} — question or suggestion`)}`} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold shadow-sm hover:brightness-110">
          <Mail className="size-4" aria-hidden /> Send email
        </a>
      </div>
      <ul className="grid gap-4 sm:grid-cols-3">
        {reasons.map(({ icon: Icon, title, text }) => (
          <li key={title} className="space-y-2 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <Icon className="size-5 text-primary" aria-hidden />
            <h2 className="font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{text}</p>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">
        Looking for how we handle your data? Read the{" "}
        <Link href="/privacy" className="font-medium text-primary hover:underline">
          privacy policy
        </Link>
        .
      </p>
    </div>
  );
}
