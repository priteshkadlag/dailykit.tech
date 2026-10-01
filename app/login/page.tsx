import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { safeCallbackUrl } from "@/lib/auth/schemas";
import { AuthCard, AuthLink } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/auth-forms";
import { FormMessage } from "@/components/auth/auth-fields";
import { GoogleSignIn } from "@/components/auth/google-button";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to see your saved invoices, quotations, expenses, tasks and favourite tools.",
  robots: { index: false },
};

// Errors Auth.js reports via ?error= after a Google sign-in.
const AUTH_ERRORS: Record<string, string> = {
  AccessDenied: "Google didn't confirm that email address. Use an account with a verified email, or sign up with email and password.",
  OAuthCallbackError: "Google sign-in was cancelled or failed. Please try again.",
  Configuration: "Sign-in is temporarily unavailable. Please try again later.",
};

export default async function Page(props: PageProps<"/login">) {
  const params = await props.searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);
  if (await getSessionUser()) redirect(callbackUrl);

  const error = typeof params.error === "string" ? (AUTH_ERRORS[params.error] ?? "Couldn't sign you in. Please try again.") : undefined;
  const registerHref = callbackUrl === "/dashboard" ? "/register" : `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <AuthCard
      title="Welcome back"
      description="Log in to your saved invoices, expenses, tasks and favourite tools."
      footer={
        <>
          New here? <AuthLink href={registerHref}>Create a free account</AuthLink>
        </>
      }
    >
      {params.reset === "1" && <FormMessage tone="success" message="Your password has been changed. Log in with your new password." />}
      {params.changed === "1" && <FormMessage tone="success" message="Password updated. Please log in again on your devices." />}
      {error && <FormMessage message={error} />}
      <GoogleSignIn callbackUrl={callbackUrl} />
      <LoginForm callbackUrl={callbackUrl} />
    </AuthCard>
  );
}
