import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { planLabel } from "@/lib/billing/plans";
import { currentPlan } from "@/lib/billing/subscriptions";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { AnalyticsToggle, DeleteAccountForm, NameForm, PasswordForm, SignOutEverywhere } from "@/components/dashboard/settings-forms";

export const metadata: Metadata = { title: "Account settings" };

function Section({ title, description, children, danger }: { title: string; description?: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <section aria-label={title} className={cn("space-y-4 rounded-xl bg-card p-5 ring-1 sm:p-6", danger ? "ring-destructive/30" : "ring-foreground/10")}>
      <div className="space-y-1">
        <h2 className={cn("text-base font-semibold", danger && "text-destructive")}>{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export default async function Page() {
  const session = await requireUser("/dashboard/settings");
  const [user, plan] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: session.id },
      select: { name: true, email: true, createdAt: true, passwordHash: true, accounts: { select: { provider: true } }, settings: { select: { analyticsOptOut: true } } },
    }),
    currentPlan(session.id),
  ]);
  const hasPassword = Boolean(user.passwordHash);
  const google = user.accounts.some((a) => a.provider === "google");

  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Account settings</h1>
        <p className="text-sm text-muted-foreground">
          {user.email} · member since {format(user.createdAt, "MMMM yyyy")}
        </p>
      </div>

      <Section title="Profile">
        <NameForm name={user.name ?? ""} />
      </Section>

      <Section title="Plan">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">
            You&apos;re on the <strong>{planLabel(plan.plan)}</strong> plan
            {plan.periodEnd && <> until {format(plan.periodEnd, "d MMMM yyyy")}</>}.
          </p>
          <Link href="/pricing" className={cn(buttonVariants({ variant: "outline" }), "h-10")}>
            {plan.plan === "PRO" ? "View plan" : "Compare plans"}
          </Link>
        </div>
      </Section>

      <Section
        title={hasPassword ? "Password" : "Set a password"}
        description={
          hasPassword
            ? google
              ? "You can log in with Google or with your email and password."
              : undefined
            : "You log in with Google. Set a password to also log in with your email."
        }
      >
        <PasswordForm hasPassword={hasPassword} />
      </Section>

      <Section title="Privacy">
        <AnalyticsToggle optOut={user.settings?.analyticsOptOut ?? false} />
      </Section>

      <Section title="Sessions" description="Used a shared or public computer? End every session in one step.">
        <SignOutEverywhere />
      </Section>

      <Section title="Delete account" danger>
        <DeleteAccountForm email={user.email} />
      </Section>
    </div>
  );
}
