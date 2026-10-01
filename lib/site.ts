export const siteConfig = {
  name: "DailyKit",
  title: "DailyKit – Free GST, EMI, PDF & Business Tools for India",
  tagline: "Simple tools for everyday work.",
  description:
    "Free GST, EMI, income tax and percentage calculators, invoice maker, PDF and image tools — built for Indian shopkeepers, freelancers and small businesses.",
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
