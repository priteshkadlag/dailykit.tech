import { ANALYTICS_OPT_OUT_KEY } from "@/lib/analytics/client";

/**
 * The visitor's privacy choice, shared by our statistics, Google Tag Manager and AdSense: false when the
 * browser sends Do Not Track or Global Privacy Control, or the visitor switched statistics off on /privacy.
 * Browser-only; callers use it through useSyncExternalStore with a `false` server snapshot.
 */
export function trackingAllowed() {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (nav.doNotTrack === "1" || nav.globalPrivacyControl) return false;
  try {
    return window.localStorage.getItem(ANALYTICS_OPT_OUT_KEY) !== "1";
  } catch {
    return true;
  }
}
