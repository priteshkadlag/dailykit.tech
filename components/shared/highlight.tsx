import { cn } from "@/lib/utils";

/** Marks the parts of `text` that match any search term. */
export function Highlight({ text, terms, className }: { text: string; terms: string[]; className?: string }) {
  if (!terms.length) return <>{text}</>;
  const pattern = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return <>{text.split(pattern).map((part, i) => (i % 2 ? <mark key={i} className={cn("rounded-sm bg-primary/15 px-0.5 text-inherit", className)}>{part}</mark> : part))}</>;
}
