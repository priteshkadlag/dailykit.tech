import Link from "next/link";
import { cn } from "@/lib/utils";
import { getPopularTools } from "@/lib/tools";
import { buttonVariants } from "@/components/ui/button";
import { SearchForm } from "@/components/shared/search-form";
import { ToolGrid } from "@/components/shared/tool-card";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-16 text-center sm:px-6">
      <div className="space-y-3">
        <p className="text-sm font-semibold text-primary">404</p>
        <h1 className="text-3xl font-bold tracking-tight">We couldn&apos;t find that page</h1>
        <p className="text-muted-foreground">The link may be broken or the tool may have moved. Try searching instead.</p>
      </div>
      <div className="mx-auto max-w-xl">
        <SearchForm size="md" />
      </div>
      <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "h-11 px-5")}>
        Back to home
      </Link>
      <div className="text-left">
        <ToolGrid tools={getPopularTools().slice(0, 4)} />
      </div>
    </div>
  );
}
