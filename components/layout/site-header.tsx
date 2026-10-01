"use client";

import Link from "next/link";
import { ChevronRight, Menu, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { categories, getToolsInCategory } from "@/lib/tools";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/layout/logo";
import { useToolSearch } from "@/components/layout/search-dialog";
import { ToolIcon } from "@/components/shared/tool-icon";
import { AccountMenu, signOutAndReload } from "@/components/layout/account-menu";
import { useAccount } from "@/lib/account/client";
import { MENUS, MegaMenuBar, ToolLink, categorySections } from "@/components/layout/mega-menu";

const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

export function SiteHeader() {
  const { open } = useToolSearch();

  return (
    <header className="dark sticky top-0 isolate z-40 bg-linear-to-r from-[#0a1230]/95 via-[#16185a]/95 to-[#0b1a3d]/95 text-foreground shadow-lg shadow-blue-950/20 backdrop-blur-xl">
      {/* Background art: soft glows and a glowing bottom edge. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 left-[10%] h-48 w-96 rounded-full bg-sky-500/25 blur-3xl" />
        <div className="absolute -top-20 right-[15%] h-44 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute -bottom-24 left-1/2 h-40 w-[36rem] -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.06)_1px,transparent_1px)] bg-size-[18px_18px]" />
      </div>
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-sky-400/70 to-transparent" />
      <div aria-hidden className="h-0.5 bg-linear-to-r from-sky-400 via-fuchsia-400 to-blue-500" />
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Logo />

        <button
          type="button"
          onClick={open}
          className="ml-2 hidden h-10 flex-1 items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-slate-200 transition-colors hover:border-sky-400/50 hover:bg-white/10 md:flex md:max-w-sm"
        >
          <Search className="size-4" aria-hidden />
          Search tools…
          <kbd className="ml-auto rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">Ctrl K</kbd>
        </button>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" className="size-10 md:hidden" onClick={open} aria-label="Search tools">
            <Search className="size-5" />
          </Button>
          <Link href="/blog" className="hidden min-h-10 items-center rounded-md px-3 text-sm font-medium hover:bg-muted lg:flex">Blog</Link>
          <AccountMenu />
          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="size-10 lg:hidden" aria-label="Open menu" />}>
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Browse tools</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4 pb-6" aria-label="Categories">
                {MENUS.map((menu) => (
                  <div key={menu.id} className="mb-2">
                    <p className="px-3 pt-3 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{menu.label}</p>
                    {menu.categories.map((slug) => <SheetCategory key={slug} slug={slug} />)}
                  </div>
                ))}
                <div className="my-3 border-t" />
                <Link href="/tools" className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium hover:bg-muted">
                  All tools
                </Link>
                <Link href="/pricing" className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium hover:bg-muted">
                  Pricing
                </Link>
                <Link href="/blog" className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium hover:bg-muted">
                  Blog
                </Link>
                <SheetAccountLinks />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <MegaMenuBar />
    </header>
  );
}

function SheetAccountLinks() {
  const account = useAccount();
  const item = "flex min-h-11 items-center rounded-lg px-3 text-sm font-medium hover:bg-muted";
  // Login and registration are hidden from guests; only an already signed-in user sees these.
  if (account.status !== "user") return null;
  return (
    <>
      {account.user.role === "ADMIN" && (
        <Link href="/admin" className={item}>
          Admin
        </Link>
      )}
      <button type="button" onClick={signOutAndReload} className={cn(item, "text-left")}>
        Log out
      </button>
    </>
  );
}

/** A category in the phone menu that expands to list its tools. */
function SheetCategory({ slug }: { slug: (typeof MENUS)[number]["categories"][number] }) {
  const category = categoryBySlug.get(slug)!;
  const count = getToolsInCategory(slug).length;
  return (
    <details className="group rounded-lg open:bg-muted/50">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-lg px-3 text-sm font-medium hover:bg-muted [&::-webkit-details-marker]:hidden">
        <ToolIcon name={category.icon} className="size-4 text-muted-foreground" />
        <span className="flex-1">{category.name}</span>
        <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
        <ChevronRight className="size-4 text-muted-foreground transition-transform group-open:rotate-90" aria-hidden />
      </summary>
      <div className="px-2 pb-2">
        {categorySections(slug).map((section) => (
          <div key={section.name ?? "all"}>
            {section.name && <p className="px-2 pt-2 pb-0.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{section.name}</p>}
            {section.tools.map((tool) => <ToolLink key={tool.slug} tool={tool} compact />)}
          </div>
        ))}
        <Link href={`/category/${slug}`} className="flex min-h-10 items-center px-2 text-sm font-medium text-primary">View {category.name} →</Link>
      </div>
    </details>
  );
}
