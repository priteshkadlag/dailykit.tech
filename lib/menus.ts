import type { CategorySlug, IconName } from "@/lib/tools";

/** The header's top-level menus, each gathering related categories. */
export const MENUS: { id: string; label: string; icon: IconName; categories: CategorySlug[] }[] = [
  { id: "business", label: "Business", icon: "briefcase", categories: ["business-tools", "finance-tools", "real-estate-tools"] },
  { id: "calculators", label: "Calculators", icon: "calculator", categories: ["calculators", "health-fitness"] },
  { id: "pdf", label: "PDF", icon: "file-stack", categories: ["pdf-tools"] },
  { id: "media", label: "Image & Video", icon: "image", categories: ["image-tools", "creator-tools"] },
  { id: "languages", label: "Languages", icon: "languages", categories: ["typing-tools", "font-converters"] },
  { id: "text", label: "Text & Utilities", icon: "file-text", categories: ["text-tools", "productivity", "qr-security", "communication"] },
  { id: "developer", label: "Developer", icon: "code", categories: ["developer-tools"] },
];

export type MenuDef = (typeof MENUS)[number];

/**
 * What the always-visible header needs, computed on the server so the browser doesn't have to load the
 * whole tool registry on every page: the live tool count, and which menu each tool or category page belongs to.
 */
export interface NavSummary {
  liveCount: number;
  /** Tool or category slug → id of the first menu that contains it. */
  menuBySlug: Record<string, string>;
}
