import Link from "next/link";
import { siteConfig } from "@/lib/site";

export function Logo() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${siteConfig.name} home`}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="4" y="4" width="7" height="7" rx="1.5" />
          <rect x="13" y="4" width="7" height="7" rx="1.5" />
          <rect x="4" y="13" width="7" height="7" rx="1.5" />
          <path d="M16.5 13.5v6M13.5 16.5h6" />
        </svg>
      </span>
      <span className="text-lg font-bold tracking-tight">{siteConfig.name}</span>
    </Link>
  );
}
