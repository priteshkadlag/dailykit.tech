import { brandIcon } from "@/lib/brand-icon";

// Google Search shows a site's favicon only if it is a square multiple of 48px; 192px also suits Android.
export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  return brandIcon(size.width);
}
