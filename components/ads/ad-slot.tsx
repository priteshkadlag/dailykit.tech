"use client";

import { useEffect, useRef } from "react";
import { useAccount } from "@/lib/account/client";
import { ADSENSE_CLIENT, ADSENSE_ENABLED } from "@/lib/ads";
import { cn } from "@/lib/utils";

/**
 * An AdSense ad unit (the <ins class="adsbygoogle"> code from AdSense): a responsive display unit ("auto") or a
 * Multiplex grid ("autorelaxed"). The ad script itself is
 * loaded once by <AdSense /> in the root layout; this only adds the slot and queues it with `push({})`.
 * Same rules as the script: production only, never for Pro accounts, and it waits for the account check.
 * Space is reserved so content doesn't jump when the ad arrives; an unfilled slot collapses (see globals.css).
 */
export function AdSlot({ slot, format = "auto", className }: { slot: string; format?: "auto" | "autorelaxed"; className?: string }) {
  const account = useAccount();
  const ins = useRef<HTMLModElement>(null);
  const show = ADSENSE_ENABLED && account.status !== "loading" && !(account.status === "user" && account.user.plan === "PRO");

  useEffect(() => {
    // AdSense marks a slot it has handled; pushing it twice throws "already have ads in them".
    if (!show || !ins.current || ins.current.dataset.adsbygoogleStatus) return;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      (w.adsbygoogle ??= []).push({});
    } catch {
      // Ad blockers and AdSense errors must never break the page.
    }
  }, [show]);

  if (!show) return null;
  return (
    <aside aria-label="Advertisement" className={cn("ad-slot mx-auto w-full max-w-4xl", className)}>
      <p className="mb-1 text-center text-[10px] font-medium tracking-wider text-muted-foreground uppercase">Advertisement</p>
      <ins
        ref={ins}
        className={cn("adsbygoogle block", format === "autorelaxed" ? "min-h-75" : "min-h-62.5")}
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT ?? undefined}
        data-ad-slot={slot}
        data-ad-format={format}
        // Multiplex units size themselves; the full-width flag is only for responsive display units.
        data-full-width-responsive={format === "auto" ? "true" : undefined}
      />
    </aside>
  );
}
