export const siteConfig = {
  name: "DailyKit",
  title: "DailyKit – Daily Utility & Business Tools",
  tagline: "Simple tools for everyday work.",
  description:
    "Free online GST, EMI, percentage, discount and age calculators, invoice tools and more — built for Indian shopkeepers, freelancers, small businesses and everyday users.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  locale: "en_IN",
  /** Shown on the contact, pricing and privacy pages. */
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "pritkadlag@gmail.com",
} as const;

export function absoluteUrl(path = "/") {
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}

/** The site-wide social card from app/opengraph-image.tsx. Pages that set their own `openGraph` must re-list it. */
export const defaultOgImage = { url: "/opengraph-image", width: 1200, height: 630, alt: siteConfig.title };
