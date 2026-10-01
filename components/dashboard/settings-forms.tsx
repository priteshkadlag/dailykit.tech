"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { changePasswordAction, deleteAccountAction, setAnalyticsOptOutAction, signOutEverywhereAction, updateNameAction } from "@/lib/account/actions";
import { ANALYTICS_OPT_OUT_KEY } from "@/lib/analytics/client";
import type { FormState } from "@/lib/auth/actions";
import { PASSWORD_MIN } from "@/lib/auth/schemas";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AuthField, FormMessage, SubmitButton } from "@/components/auth/auth-fields";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

const initial: FormState = {};

function useFollowRedirect(state: FormState) {
  useEffect(() => {
    if (state.redirectTo) window.location.assign(state.redirectTo);
  }, [state.redirectTo]);
}

export function NameForm({ name }: { name: string }) {
  const [state, action] = useActionState(updateNameAction, initial);
  useEffect(() => {
    if (state.success) toast.success(state.success);
  }, [state]);
  return (
    <form action={action} className="space-y-4" noValidate>
      <AuthField label="Your name" name="name" autoComplete="name" defaultValue={name} error={state.errors?.name} />
      <div className="sm:w-48">
        <SubmitButton pendingLabel="Saving…">Save name</SubmitButton>
      </div>
    </form>
  );
}

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, action] = useActionState(changePasswordAction, initial);
  useFollowRedirect(state);
  return (
    <form action={action} className="space-y-4" noValidate>
      {hasPassword && <AuthField label="Current password" name="current" type="password" autoComplete="current-password" error={state.errors?.current} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <AuthField
          label={hasPassword ? "New password" : "Password"}
          name="password"
          type="password"
          autoComplete="new-password"
          error={state.errors?.password}
          hint={`At least ${PASSWORD_MIN} characters, with a letter and a number.`}
        />
        <AuthField label="Confirm password" name="confirm" type="password" autoComplete="new-password" error={state.errors?.confirm} />
      </div>
      <FormMessage message={state.message} />
      <p className="text-xs text-muted-foreground">You&apos;ll be logged out on all devices, including this one.</p>
      <div className="sm:w-56">
        <SubmitButton pendingLabel="Saving…">{hasPassword ? "Change password" : "Set password"}</SubmitButton>
      </div>
    </form>
  );
}

export function AnalyticsToggle({ optOut: initialOptOut }: { optOut: boolean }) {
  const [optOut, setOptOut] = useState(initialOptOut);
  const [pending, startTransition] = useTransition();
  const change = (share: boolean) => {
    const next = !share;
    setOptOut(next);
    startTransition(async () => {
      try {
        await setAnalyticsOptOutAction(next);
        try {
          // Also remember it on this device so it applies before the account loads.
          if (next) window.localStorage.setItem(ANALYTICS_OPT_OUT_KEY, "1");
          else window.localStorage.removeItem(ANALYTICS_OPT_OUT_KEY);
        } catch {
          // Storage blocked — the account setting still applies.
        }
        toast.success(next ? "Anonymous usage stats turned off." : "Thanks! Anonymous usage stats turned on.");
      } catch {
        setOptOut(!next);
        toast.error("Couldn't update the setting. Please try again.");
      }
    });
  };
  return (
    <label className="flex items-start justify-between gap-4">
      <span className="space-y-1">
        <span className="block text-sm font-medium">Share anonymous usage stats</span>
        <span className="block text-sm text-muted-foreground">Which tools are opened and used — never what you type, upload or create. Helps us decide what to improve.</span>
      </span>
      <Switch checked={!optOut} onCheckedChange={change} disabled={pending} />
    </label>
  );
}

export function SignOutEverywhere() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <>
      <Button variant="outline" className="h-10" disabled={pending} onClick={() => setOpen(true)}>
        Log out of all devices
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Log out everywhere?"
        description="You'll be logged out on every device and browser, including this one."
        confirmLabel="Log out everywhere"
        onConfirm={() =>
          startTransition(async () => {
            try {
              await signOutEverywhereAction();
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload drops the signed-in state held in memory
              window.location.assign("/login");
            } catch {
              toast.error("Couldn't log out. Please try again.");
            }
          })
        }
      />
    </>
  );
}

export function DeleteAccountForm({ email }: { email: string }) {
  const [state, action] = useActionState(deleteAccountAction, initial);
  useFollowRedirect(state);
  return (
    <form action={action} className="space-y-4" noValidate>
      <p className="text-sm text-muted-foreground">
        This permanently deletes your account, invoices, quotations, expenses, tasks, business profile and saved calculations. It can&apos;t be undone. Download anything you need first.
      </p>
      <AuthField label={`Type ${email} to confirm`} name="confirm" type="email" autoComplete="off" error={state.errors?.confirm} />
      <Button type="submit" variant="destructive" className="h-11">
        Delete my account
      </Button>
    </form>
  );
}
