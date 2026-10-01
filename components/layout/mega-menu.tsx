"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { MENUS, type NavSummary } from "@/lib/menus";

// Panels need the full tool registry; they're fetched the first time a menu opens (and prefetched on hover).
const loadPanel = () => import("@/components/layout/menu-content");
const MenuPanel = dynamic(() => loadPanel().then((m) => m.MenuPanel), { ssr: false });

function menuForPath(pathname: string, nav: NavSummary) {
  const slug = pathname.split("/")[pathname.startsWith("/category/") ? 2 : 1];
  return slug ? nav.menuBySlug[slug] : undefined;
}

export function MegaMenuBar({ nav }: { nav: NavSummary }) {
  const pathname = usePathname();
  const [openId, setOpenId] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const activeMenu = menuForPath(pathname, nav);

  const close = useCallback(() => setOpenId(null), []);
  // Close on navigation, outside clicks and Escape.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpenId(null);
  }
  useEffect(() => {
    if (!openId) return;
    const onPointer = (event: PointerEvent) => { if (!barRef.current?.contains(event.target as Node)) close(); };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      document.getElementById(`menu-trigger-${openId}`)?.focus();
      close();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onPointer); document.removeEventListener("keydown", onKey); };
  }, [openId, close]);

  // Hover opens menus on devices with a mouse; a short delay stops menus flashing as the pointer passes over.
  const hover = (event: React.PointerEvent, id: string | null, delay: number) => {
    if (event.pointerType !== "mouse") return;
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpenId(id), delay);
  };

  const openMenu = MENUS.find((menu) => menu.id === openId);

  return (
    <div
      ref={barRef}
      className="relative hidden border-t lg:block"
      onPointerLeave={(event) => hover(event, null, 200)}
      onPointerEnter={() => { clearTimeout(hoverTimer.current); void loadPanel(); }}
      onFocus={() => void loadPanel()}
    >
      <nav aria-label="Tool categories" className="mx-auto flex h-12 max-w-6xl items-center gap-1 px-4 sm:px-6">
        {MENUS.map((menu) => {
          const open = openId === menu.id;
          return (
            <button
              key={menu.id}
              id={`menu-trigger-${menu.id}`}
              type="button"
              aria-expanded={open}
              aria-controls={`menu-panel-${menu.id}`}
              onClick={() => setOpenId(open ? null : menu.id)}
              onPointerEnter={(event) => hover(event, menu.id, openId ? 0 : 120)}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-full px-2.5 text-sm xl:px-3 font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                open ? "bg-brand text-white shadow-md shadow-blue-950/40" : activeMenu === menu.id ? "bg-white/15 text-white" : "text-slate-100 hover:bg-white/10 hover:text-white",
              )}
            >
              {menu.label}
              <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden />
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-1">
          <Link href="/tools" className={cn("flex h-9 items-center gap-1.5 rounded-full px-2.5 text-sm xl:px-3 font-medium whitespace-nowrap transition-colors", pathname === "/tools" ? "bg-white/15 text-white" : "text-slate-100 hover:bg-white/10 hover:text-white")}>
            <LayoutGrid className="size-4" aria-hidden />
            All tools
            <span className="rounded-full bg-sky-400/20 px-1.5 text-xs font-semibold text-sky-200 tabular-nums">{nav.liveCount}</span>
          </Link>
        </div>
      </nav>
      {openMenu && <MenuPanel key={openMenu.id} menu={openMenu} onNavigate={close} />}
    </div>
  );
}
