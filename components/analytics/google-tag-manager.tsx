"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";
import { trackingAllowed } from "@/lib/analytics/consent";
import { GTM_ENABLED, GTM_ID } from "@/lib/analytics/gtm";

const noSubscription = () => () => {};

/**
 * Google Tag Manager, loaded after the page is idle (lazyOnload) so it doesn't compete with the page itself.
 * Not rendered on the server, so it never loads before the visitor's opt-out choice has been checked.
 */
export function GoogleTagManager() {
  const allowed = useSyncExternalStore(noSubscription, trackingAllowed, () => false);
  if (!GTM_ENABLED || !allowed) return null;
  return (
    <Script id="gtm" strategy="lazyOnload">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
    </Script>
  );
}
