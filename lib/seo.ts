import type { Metadata } from "next";
import { absoluteUrl, defaultOgImage, siteConfig } from "@/lib/site";
import { getTool } from "@/lib/tools";

interface ToolSeo {
  /** Full <title> text before the site-name suffix. */
  title: string;
  description: string;
}

/** Canonical, Open Graph and Twitter metadata for a tool page, keyed off the registry slug. */
export function toolMetadata(slug: string, { title, description }: ToolSeo): Metadata {
  const tool = getTool(slug);
  const path = `/${tool.slug}`;
  return {
    title,
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
