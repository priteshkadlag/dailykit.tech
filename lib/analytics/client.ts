import { getAccountState } from "@/lib/account/client";
import type { AnalyticsEventName, EventPayload } from "./events";

const VISITOR_KEY = "dailykit:visitor";
export const ANALYTICS_OPT_OUT_KEY = "dailykit:analytics-opt-out";

let sessionVisitor: string | null = null;

function visitorId() {
  try {
    let id = window.localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    // Storage blocked: count this page session only.
    return (sessionVisitor ??= crypto.randomUUID());
  }
}

export function analyticsAllowed() {
  if (navigator.doNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return false;
  try {
    if (window.localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === "1") return false;
  } catch {
    // ignore
  }
  const account = getAccountState();
  return !(account.status === "user" && account.analyticsOptOut);
}

/** The tool the current page belongs to (tool pages live at /<slug>). */
function currentTool() {
  return window.location.pathname.split("/")[1] || undefined;
}

/**
 * Record an anonymous usage event. Fire-and-forget: never throws, never delays the UI, and does
 * nothing when the browser sends Do Not Track / Global Privacy Control or the user opted out.
 */
export function track(name: AnalyticsEventName, tool = currentTool()) {
  if (typeof window === "undefined" || !analyticsAllowed()) return;
  const payload: EventPayload = { name, tool, visitorId: visitorId() };
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon?.("/api/events", new Blob([body], { type: "application/json" }))) return;
  } catch {
    // fall through to fetch
  }
  fetch("/api/events", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => undefined);
}

const trackedThisPage = new Set<string>();

/** Track an event at most once per page view (e.g. the first completed calculation). */
export function trackOnce(name: AnalyticsEventName) {
  const key = `${window.location.pathname}:${name}`;
  if (trackedThisPage.has(key)) return;
  trackedThisPage.add(key);
  track(name);
}
