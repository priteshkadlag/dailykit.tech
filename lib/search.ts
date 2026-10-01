import { categories, tools, type CategorySlug, type IconName } from "@/lib/tools";

export interface SearchResult {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: IconName;
  categoryName: string;
  /** Every category the tool belongs to; the first is its primary one. */
  categories: CategorySlug[];
  live: boolean;
}

interface Entry extends SearchResult {
  haystack: { name: string; keywords: string[]; category: string };
}

const categoryName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? "";

const entries: Entry[] = tools.flatMap((tool) => {
  const category = categoryName(tool.categories[0]);
  const base: Entry = {
    id: tool.slug,
    name: tool.name,
    description: tool.shortDescription,
    href: `/${tool.slug}`,
    icon: tool.icon,
    categoryName: category,
    categories: tool.categories,
    live: tool.status === "live",
    haystack: {
      name: tool.name.toLowerCase(),
      keywords: tool.keywords,
      category: tool.categories.map(categoryName).join(" ").toLowerCase(),
    },
  };
  const shortcuts: Entry[] = (tool.shortcuts ?? []).map((s) => ({
    ...base,
    id: `${tool.slug}#${s.hash}`,
    name: s.name,
    href: `/${tool.slug}#${s.hash}`,
    haystack: { ...base.haystack, name: s.name.toLowerCase(), keywords: s.keywords },
  }));
  return [base, ...shortcuts];
});

/**
 * Ranks tools by how well they match the query across name, keywords and category.
 * Every query term must match somewhere for a tool to be included.
 */
export function searchTools(query: string, limit = 20): SearchResult[] {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const scored = entries
    .map((entry) => {
      let score = 0;
      for (const term of terms) {
        const { name, keywords, category } = entry.haystack;
        let termScore = 0;
        if (name.startsWith(term)) termScore = 10;
        else if (name.split(/\s+/).some((w) => w.startsWith(term))) termScore = 8;
        else if (name.includes(term)) termScore = 6;
        else if (keywords.some((k) => k === term)) termScore = 5;
        else if (keywords.some((k) => k.includes(term))) termScore = 3;
        else if (category.includes(term)) termScore = 1;
        if (termScore === 0) return null;
        score += termScore;
      }
      if (entry.live) score += 0.5;
      return { entry, score };
    })
    .filter((r): r is { entry: Entry; score: number } => r !== null)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(({ entry }) => {
    const { haystack: _haystack, ...result } = entry;
    void _haystack;
    return result;
  });
}
