"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Mail } from "lucide-react";
import { useAccount } from "@/lib/account/client";
import { PLAN_FEATURES, PRICES, type BillingInterval } from "@/lib/billing/plans";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { SegmentedControl } from "@/components/shared/form-fields";

/** Plan cards. Online payment isn't connected yet, so Pro upgrades go through support. */
export function PricingPlans() {
  const [interval, setInterval] = useState<BillingInterval>("yearly");
  const account = useAccount();
  const signedIn = account.status === "user";
  const isPro = signedIn && account.user.plan === "PRO";
  const price = PRICES[interval];
  const upgradeSubject = encodeURIComponent(`Upgrade to ${siteConfig.name} Pro (${interval})`);
  const upgradeBody = encodeURIComponent(`Hi, I'd like to upgrade${signedIn ? ` my account (${account.user.email})` : ""} to Pro, billed ${interval}.`);

  return (
    <div className="space-y-6">
      <div className="mx-auto w-full max-w-xs">
        <SegmentedControl
          label="Billing"
          hideLabel
          value={interval}
          onChange={setInterval}
          options={[
            { value: "monthly", label: "Monthly" },
            { value: "yearly", label: "Yearly · save 16%" },
          ]}
        />
      </div>

      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        <article className="flex flex-col rounded-2xl bg-card p-6 ring-1 ring-foreground/10 sm:p-8">
          <h2 className="text-lg font-semibold">Free</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight">₹0</p>
          <p className="text-sm text-muted-foreground">Forever. No card needed.</p>
          <ul className="mt-6 flex-1 space-y-3">
            {PLAN_FEATURES.FREE.map((f) => (
              <li key={f} className="flex gap-2.5 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden /> {f}
              </li>
            ))}
          </ul>
          <Link href="/tools" className={cn(buttonVariants({ variant: "outline" }), "mt-8 h-11 text-base")}>
            Use the free tools
          </Link>
        </article>

        <article className="relative flex flex-col rounded-2xl bg-card p-6 ring-2 ring-primary sm:p-8">
          <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">For growing businesses</span>
          <h2 className="text-lg font-semibold">Pro</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight">
            ₹{price.amount}
            <span className="text-base font-medium text-muted-foreground"> / {interval === "yearly" ? "year" : "month"}</span>
          </p>
          <p className="text-sm text-muted-foreground">{interval === "yearly" ? "Just ₹83 a month, 2 months free." : "Cancel any time."}</p>
          <ul className="mt-6 flex-1 space-y-3">
            {PLAN_FEATURES.PRO.map((f) => (
              <li key={f} className="flex gap-2.5 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden /> {f}
              </li>
            ))}
          </ul>
          {isPro ? (
            <p className="mt-8 rounded-lg bg-emerald-50 px-3 py-2.5 text-center text-sm font-medium text-emerald-800">You&apos;re on Pro. Thank you!</p>
          ) : (
            <div className="mt-8 space-y-2">
              <a href={`mailto:${siteConfig.supportEmail}?subject=${upgradeSubject}&body=${upgradeBody}`} className={cn(buttonVariants(), "h-11 w-full text-base")}>
                <Mail /> Upgrade to Pro
              </a>
              <p className="text-center text-xs text-muted-foreground">Online payment (UPI, cards) is coming soon. Until then, email us and we&apos;ll activate Pro for you.</p>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
