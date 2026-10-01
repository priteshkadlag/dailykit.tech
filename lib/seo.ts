import type { Metadata } from "next";
import { absoluteUrl, defaultOgImage, siteConfig } from "@/lib/site";
import { getTool } from "@/lib/tools";

interface ToolSeo {
  /** Full <title> text before the site-name suffix. */
  title: string;
  description: string;
}

/**
 * Canonical, Open Graph and Twitter metadata for a regular page. Without it a page inherits the root
 * layout's Open Graph block, so shares of e.g. /about would show the homepage's title and URL.
 */
export function pageMetadata(path: string, { title, description }: { title: string; description: string }): Metadata {
  const fullTitle = `${title} | ${siteConfig.name}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", url: absoluteUrl(path), title: fullTitle, description, siteName: siteConfig.name, locale: siteConfig.locale, images: [defaultOgImage] },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [defaultOgImage.url] },
  };
}

/** Google shows roughly the first 60 characters of a title. */
export const TITLE_LIMIT = 60;
const brandSuffix = () => ` | ${siteConfig.name}`;

/** True when `title` plus the " | DailyKit" suffix still fits in a search result. */
export function fitsWithBrand(title: string) {
  return title.length + brandSuffix().length <= TITLE_LIMIT;
}

/** Canonical, Open Graph and Twitter metadata for a tool page, keyed off the registry slug. */
export function toolMetadata(slug: string, { title, description }: ToolSeo): Metadata {
  const tool = getTool(slug);
  const path = `/${tool.slug}`;
  // Keyword-rich tool titles keep their keywords: the brand suffix is dropped when it would push them past the limit.
  const fullTitle = fitsWithBrand(title) ? `${title}${brandSuffix()}` : title;
  return {
    title: { absolute: fullTitle },
    description,
    keywords: tool.keywords,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: absoluteUrl(path),
      title: `${title} | ${siteConfig.name}`,
      description,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      images: [defaultOgImage],
    },
    twitter: { card: "summary_large_image", title: `${title} | ${siteConfig.name}`, description, images: [defaultOgImage.url] },
  };
}

export function toolJsonLd(slug: string, description: string) {
  const tool = getTool(slug);
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    url: absoluteUrl(`/${tool.slug}`),
    description,
    applicationCategory: tool.categories.includes("finance-tools")
      ? "FinanceApplication"
      : tool.categories.some((c) => c === "pdf-tools" || c === "image-tools")
        ? "MultimediaApplication"
        : "BusinessApplication",
    operatingSystem: "Any (web browser)",
    browserRequirements: "Requires JavaScript",
    inLanguage: "en-IN",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
    publisher: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
  };
}
