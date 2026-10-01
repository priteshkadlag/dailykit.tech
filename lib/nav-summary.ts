import "server-only";
import { MENUS, type NavSummary } from "@/lib/menus";
import { getToolsInCategory, liveTools } from "@/lib/tools";

/** Built on the server from the full registry; only this small summary is sent to the browser. */
export function getNavSummary(): NavSummary {
  const menuBySlug: Record<string, string> = {};
  for (const menu of MENUS) {
    for (const category of menu.categories) {
      menuBySlug[category] ??= menu.id;
      for (const tool of getToolsInCategory(category)) menuBySlug[tool.slug] ??= menu.id;
    }
  }
  return { liveCount: liveTools.length, menuBySlug };
}
