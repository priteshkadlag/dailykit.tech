"use client";

import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// The popup (with the full tool registry and search index) is fetched only when search first opens.
const SearchPalette = dynamic(() => import("@/components/layout/search-palette").then((m) => m.SearchPalette), { ssr: false });

const SearchContext = createContext<{ open: () => void }>({ open: () => {} });

export const useToolSearch = () => useContext(SearchContext);

/** Global ⌘K / Ctrl+K and "/" tool search, available anywhere via `useToolSearch().open()`. */
export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const show = useCallback(() => {
    setLoaded(true);
    setOpen(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // A page with its own search box (the homepage) may handle "/" first.
      if (e.defaultPrevented) return;
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !isTyping(e.target))) {
        e.preventDefault();
        show();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show]);

  const context = useMemo(() => ({ open: show }), [show]);

  return (
    <SearchContext.Provider value={context}>
      {children}
      {loaded && <SearchPalette open={open} setOpen={setOpen} />}
    </SearchContext.Provider>
  );
}

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}
