"use client";

import Script from "next/script";
import { useEffect, useSyncExternalStore } from "react";
import { useAccount } from "@/lib/account/client";
import { trackingAllowed } from "@/lib/analytics/consent";
import { ADSENSE_CLIENT, ADSENSE_ENABLED } from "@/lib/ads";

const noSubscription = () => () => {};
type AdsQueue = unknown[] & { requestNonPersonalizedAds?: number };

/**
 * Google AdSense (Auto ads are configured in the AdSense dashboard).
 * - Loads after the page is idle (lazyOnload), so ads never delay the page itself.
 * - Never loads for Pro accounts ("No ads, ever"); it waits until the account check has finished.
 * - Visitors who switched statistics off on /privacy, or whose browser sends Do Not Track / Global Privacy
 *   Control, get non-personalised ads only.
 */
export function AdSense() {
  const account = useAccount();
  const personalised = useSyncExternalStore(noSubscription, trackingAllowed, () => false);
  const show = ADSENSE_ENABLED && account.status !== "loading" && !(account.status === "user" && account.user.plan === "PRO");

  // Runs before the lazyOnload script is injected (that waits for the browser to be idle).
  useEffect(() => {
    if (!show || personalised) return;
    const w = window as unknown as { adsbygoogle?: AdsQueue };
    (w.adsbygoogle ??= []).requestNonPersonalizedAds = 1;
  }, [show, personalised]);

  if (!show) return null;
  return (
    <Script
      id="adsbygoogle-js"
      strategy="lazyOnload"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
    />
  );
}
