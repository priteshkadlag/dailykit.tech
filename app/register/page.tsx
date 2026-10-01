import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { safeCallbackUrl } from "@/lib/auth/schemas";
import { AuthCard, AuthLink } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/auth-forms";
import { GoogleSignIn } from "@/components/auth/google-button";

export const metadata: Metadata = {
  title: "Create a free account",
  description: "Save invoices, quotations, expenses and tasks to your free account and use them on any device.",
  robots: { index: false },
};

const perks = ["Invoices & quotations saved to your account", "Business profile fills in every document", "Expenses, tasks and favourites on every device"];

export default async function Page(props: PageProps<"/register">) {
  const params = await props.searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);
  if (await getSessionUser()) redirect(callbackUrl);

  return (
    <AuthCard
      title="Create your free account"
      description={
        <span className="mt-1 block space-y-1.5">
          {perks.map((p) => (
            <span key={p} className="flex items-center gap-2">
              <Check className="size-4 shrink-0 text-primary" aria-hidden /> {p}
            </span>
          ))}
        </span>
      }
      footer={
        <>
          Already have an account? <AuthLink href={callbackUrl === "/dashboard" ? "/login" : `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>Log in</AuthLink>
        </>
      }
    >
      <GoogleSignIn callbackUrl={callbackUrl} />
      <RegisterForm callbackUrl={callbackUrl} />
      <p className="text-xs text-muted-foreground">
        We never sell your data. See our <AuthLink href="/privacy">privacy policy</AuthLink>.
      </p>
    </AuthCard>
  );
}
