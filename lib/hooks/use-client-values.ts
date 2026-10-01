"use client";

import { useMemo, useSyncExternalStore } from "react";
import { toDateInputValue } from "@/lib/calculations/age";

const noopSubscribe = () => () => {};

function subscribeHash(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

/** The URL hash without "#", or "" during server render. Lets search results deep-link into a tool mode. */
export function useLocationHash() {
  return useSyncExternalStore(
    subscribeHash,
    () => decodeURIComponent(window.location.hash.slice(1)),
    () => "",
  );
}

/** Today's date as yyyy-mm-dd in the visitor's timezone, or "" during server render (pages are static). */
export function useTodayInputValue() {
  return useSyncExternalStore(noopSubscribe, () => toDateInputValue(new Date()), () => "");
}

const TICK_MS = 30_000;

function subscribeClock(callback: () => void) {
  const timer = window.setInterval(callback, TICK_MS);
  return () => window.clearInterval(timer);
}

/**
 * The current time (to the last 30-second boundary), refreshed every 30 seconds so time-based
 * views like "overdue" stay current. Stable between ticks, so it is safe as a memo dependency.
 */
export function useClock(): Date {
  const tick = useSyncExternalStore(subscribeClock, () => Math.floor(Date.now() / TICK_MS), () => 0);
  return useMemo(() => new Date(tick * TICK_MS), [tick]);
}
