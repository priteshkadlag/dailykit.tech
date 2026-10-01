import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Plain GET form to /search — works before JavaScript loads and on every device. */
export function SearchForm({ defaultValue, size = "lg", autoFocus }: { defaultValue?: string; size?: "lg" | "md"; autoFocus?: boolean }) {
  return (
    <form action="/search" method="get" role="search" className="relative w-full">
      <label htmlFor="tool-search" className="sr-only">
        Search tools
      </label>
      <Search
        className={cn("pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground", size === "lg" ? "size-5" : "size-4")}
        aria-hidden
      />
      <input
        id="tool-search"
        name="q"
        type="search"
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        autoComplete="off"
        placeholder="Search tools… e.g. GST, EMI, invoice"
        className={cn(
          "w-full rounded-xl border bg-card pr-28 shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15",
          size === "lg" ? "h-14 pl-12 text-base" : "h-12 pl-11 text-base",
        )}
      />
      <Button type="submit" className={cn("absolute top-1/2 right-2 -translate-y-1/2 px-4", size === "lg" ? "h-10" : "h-9")}>
        Search
      </Button>
    </form>
  );
}
