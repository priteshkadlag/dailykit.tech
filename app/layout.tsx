import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { absoluteUrl, siteConfig } from "@/lib/site";
import { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AccountRefresh } from "@/components/account/account-refresh";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SearchProvider } from "@/components/layout/search-dialog";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { JsonLd } from "@/components/shared/json-ld";
import { GoogleTagManager } from "@/components/analytics/google-tag-manager";
import { GTM_ENABLED, GTM_ID } from "@/lib/analytics/gtm";
import { getNavSummary } from "@/lib/nav-summary";
import { AdSense } from "@/components/ads/adsense";
import { ADSENSE_CLIENT } from "@/lib/ads";
import "./globals.css";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.title, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
  },
  twitter: { card: "summary_large_image", title: siteConfig.title, description: siteConfig.description },
  formatDetection: { telephone: false },
  // AdSense site verification (Google reads it from the HTML; the ad script itself loads lazily).
  ...(ADSENSE_CLIENT ? { other: { "google-adsense-account": ADSENSE_CLIENT } } : {}),
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col pb-16 md:pb-0">
        {GTM_ENABLED && (
          <noscript>
            <iframe src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`} height="0" width="0" style={{ display: "none", visibility: "hidden" }} title="Google Tag Manager" />
          </noscript>
        )}
        <GoogleTagManager />
        <AdSense />
        <SearchProvider>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2">
            Skip to content
          </a>
          <SiteHeader nav={getNavSummary()} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
          <MobileNav />
        </SearchProvider>
        <Toaster position="top-center" richColors />
        <Suspense>
          <AccountRefresh />
        </Suspense>
        <JsonLd
          data={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": `${siteConfig.url}#website`,
            name: siteConfig.name,
            url: siteConfig.url,
            publisher: { "@id": `${siteConfig.url}#organization` },
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": `${siteConfig.url}#organization`,
            name: siteConfig.name,
            url: siteConfig.url,
            logo: absoluteUrl("/icon"),
          },
          ]}
        />
      </body>
    </html>
  );
}
