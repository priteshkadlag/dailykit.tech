"use client";

import { useSyncExternalStore } from "react";
import { BarChart3, ShieldCheck } from "lucide-react";
import { ANALYTICS_OPT_OUT_KEY } from "@/lib/analytics/client";
import { cn } from "@/lib/utils";

type Choice = "loading" | "browser-off" | "off" | "on";

const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => { listeners.delete(listener); window.removeEventListener("storage", listener); };
}
function read(): Choice {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (nav.doNotTrack === "1" || nav.globalPrivacyControl) return "browser-off";
  try { return window.localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === "1" ? "off" : "on"; } catch { return "on"; }
}
function write(off: boolean) {
  try {
    if (off) window.localStorage.setItem(ANALYTICS_OPT_OUT_KEY, "1");
    else window.localStorage.removeItem(ANALYTICS_OPT_OUT_KEY);
  } catch { /* storage blocked: nothing is remembered, and nothing can be counted either */ }
  listeners.forEach((listener) => listener());
}

/** Lets any visitor switch usage statistics — our own counts and Google Tag Manager / Analytics — off (or back on) for this browser. */
export function AnalyticsChoice() {
  const choice = useSyncExternalStore(subscribe, read, (): Choice => "loading");
  const on = choice === "on";
  return (
    <div className="not-prose flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-primary/20 sm:flex-row sm:items-center">
      <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", on ? "bg-brand" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300")}>
        {on ? <BarChart3 className="size-5" aria-hidden /> : <ShieldCheck className="size-5" aria-hidden />}
      </span>
      <div className="min-w-0 flex-1" aria-live="polite">
        <p className="font-semibold text-foreground">Statistics and personalised ads in this browser</p>
        <p className="text-sm text-muted-foreground">
          {choice === "loading" && "Checking your setting…"}
          {choice === "on" && "On — our tool counts and Google Analytics help us see which tools are useful, and ads may be personalised. Your inputs and files are never included."}
          {choice === "off" && "Off — no usage statistics are sent, Google Analytics isn't loaded, and ads are non-personalised."}
          {choice === "browser-off" && "Off — your browser sends Do Not Track or Global Privacy Control, so nothing is counted and ads are non-personalised."}
        </p>
      </div>
      {(choice === "on" || choice === "off") && (
        <button type="button" role="switch" aria-checked={on} aria-label="Allow usage statistics and personalised ads" onClick={() => write(on)}
          className={cn("relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none", on ? "bg-primary" : "bg-muted-foreground/30")}>
          <span className={cn("inline-block size-5 rounded-full bg-white shadow transition-transform", on ? "translate-x-6" : "translate-x-1")} />
        </button>
      )}
    </div>
  );
}
