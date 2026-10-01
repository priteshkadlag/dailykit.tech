import type { CategorySlug } from "@/lib/tools";

/** A colour per category, so tools are easy to tell apart at a glance. Literal class strings for Tailwind. */
export const CATEGORY_TINT: Record<CategorySlug, { icon: string; chip: string; dot: string }> = {
  "business-tools": { icon: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300", chip: "data-[on=true]:bg-blue-600", dot: "bg-blue-500" },
  "finance-tools": { icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", chip: "data-[on=true]:bg-emerald-600", dot: "bg-emerald-500" },
  calculators: { icon: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300", chip: "data-[on=true]:bg-violet-600", dot: "bg-violet-500" },
  "pdf-tools": { icon: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300", chip: "data-[on=true]:bg-red-600", dot: "bg-red-500" },
  "image-tools": { icon: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300", chip: "data-[on=true]:bg-pink-600", dot: "bg-pink-500" },
  "typing-tools": { icon: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300", chip: "data-[on=true]:bg-amber-600", dot: "bg-amber-500" },
  "font-converters": { icon: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300", chip: "data-[on=true]:bg-orange-600", dot: "bg-orange-500" },
  productivity: { icon: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300", chip: "data-[on=true]:bg-teal-600", dot: "bg-teal-500" },
  "qr-security": { icon: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200", chip: "data-[on=true]:bg-slate-700", dot: "bg-slate-500" },
  communication: { icon: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300", chip: "data-[on=true]:bg-green-600", dot: "bg-green-500" },
  "text-tools": { icon: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300", chip: "data-[on=true]:bg-indigo-600", dot: "bg-indigo-500" },
  "health-fitness": { icon: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300", chip: "data-[on=true]:bg-rose-600", dot: "bg-rose-500" },
  "real-estate-tools": { icon: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300", chip: "data-[on=true]:bg-cyan-600", dot: "bg-cyan-500" },
  "creator-tools": { icon: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300", chip: "data-[on=true]:bg-fuchsia-600", dot: "bg-fuchsia-500" },
  "developer-tools": { icon: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300", chip: "data-[on=true]:bg-sky-600", dot: "bg-sky-500" },
};
