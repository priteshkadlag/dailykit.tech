"use client";

import { useActionState, useEffect } from "react";
import { forgotPasswordAction, loginAction, registerAction, resetPasswordAction, type FormState } from "@/lib/auth/actions";
import { PASSWORD_MIN } from "@/lib/auth/schemas";
import { AuthLink } from "./auth-card";
import { AuthField, FormMessage, SubmitButton } from "./auth-fields";

const initial: FormState = {};

/** After signing in, load the destination fresh so the header, stores and dashboard see the session. */
function useRedirectOnSuccess(state: FormState) {
  useEffect(() => {
    if (state.redirectTo) window.location.assign(state.redirectTo);
  }, [state.redirectTo]);
}

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action] = useActionState(loginAction, initial);
  useRedirectOnSuccess(state);
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <AuthField label="Email" name="email" type="email" autoComplete="email" defaultValue={state.values?.email} error={state.errors?.email} autoFocus />
      <AuthField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        error={state.errors?.password}
        aside={
          <span className="text-sm">
            <AuthLink href="/forgot-password">Forgot password?</AuthLink>
          </span>
        }
      />
      <FormMessage message={state.message} />
      <SubmitButton pendingLabel="Logging in…">Log in</SubmitButton>
    </form>
  );
}

export function RegisterForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action] = useActionState(registerAction, initial);
  useRedirectOnSuccess(state);
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <AuthField label="Your name" name="name" autoComplete="name" defaultValue={state.values?.name} error={state.errors?.name} autoFocus />
      <AuthField label="Email" name="email" type="email" autoComplete="email" defaultValue={state.values?.email} error={state.errors?.email} />
      <AuthField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        error={state.errors?.password}
        hint={`At least ${PASSWORD_MIN} characters, with a letter and a number.`}
      />
      <FormMessage message={state.message} />
      <SubmitButton pendingLabel="Creating your account…">Create free account</SubmitButton>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, initial);
  if (state.success) return <FormMessage tone="success" message={state.success} />;
  return (
    <form action={action} className="space-y-4" noValidate>
      <AuthField label="Email" name="email" type="email" autoComplete="email" defaultValue={state.values?.email} error={state.errors?.email} autoFocus />
      <FormMessage message={state.message} />
      <SubmitButton pendingLabel="Sending…">Send reset link</SubmitButton>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, initial);
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />
      <AuthField
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        error={state.errors?.password}
        hint={`At least ${PASSWORD_MIN} characters, with a letter and a number.`}
        autoFocus
      />
      <AuthField label="Confirm new password" name="confirm" type="password" autoComplete="new-password" error={state.errors?.confirm} />
      <FormMessage message={state.message} />
      {state.message && (
        <p className="text-sm">
          <AuthLink href="/forgot-password">Request a new link</AuthLink>
        </p>
      )}
      <SubmitButton pendingLabel="Saving…">Set new password</SubmitButton>
    </form>
  );
}
