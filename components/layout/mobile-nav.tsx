"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Newspaper, Search, Wrench } from "lucide-react";
import { useToolSearch } from "@/components/layout/search-dialog";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home", icon: House, match: (p: string) => p === "/" },
  { href: "/tools", label: "Tools", icon: Wrench, match: (p: string) => p.startsWith("/tools") || p.startsWith("/category") },
  { href: "/blog", label: "Blog", icon: Newspaper, match: (p: string) => p.startsWith("/blog") },
];

const tab = "flex h-16 w-full flex-col items-center justify-center gap-1 text-xs font-medium";

/** Bottom tab bar on phones. The page body reserves space for it via `pb-16 md:pb-0` in the root layout. */
export function MobileNav() {
  const pathname = usePathname();
  const { open } = useToolSearch();
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="grid grid-cols-4">
        {links.slice(0, 2).map((item) => <TabLink key={item.href} {...item} active={item.match(pathname)} />)}
        <li>
          <button type="button" onClick={open} className={cn(tab, "text-muted-foreground")}>
            <Search className="size-5" aria-hidden />
            Search
          </button>
        </li>
        {links.slice(2).map((item) => <TabLink key={item.href} {...item} active={item.match(pathname)} />)}
      </ul>
    </nav>
  );
}

function TabLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof House; active: boolean }) {
  return (
    <li>
      <Link href={href} aria-current={active ? "page" : undefined} className={cn(tab, active ? "text-primary" : "text-muted-foreground")}>
        <Icon className="size-5" aria-hidden />
        {label}
      </Link>
    </li>
  );
}
