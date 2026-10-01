import type { Metadata } from "next";
import { AuthCard, AuthLink } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/auth-forms";
import { FormMessage } from "@/components/auth/auth-fields";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false },
  // The token is in the URL: don't leak it to other sites through the Referer header.
  referrer: "no-referrer",
};

export default async function Page(props: PageProps<"/reset-password">) {
  const { token } = await props.searchParams;
  return (
    <AuthCard
      title="Choose a new password"
      description="You'll be signed out on all devices after changing it."
      footer={<AuthLink href="/login">Back to login</AuthLink>}
    >
      {typeof token === "string" && token.length >= 20 ? (
        <ResetPasswordForm token={token} />
      ) : (
        <>
          <FormMessage message="This reset link is incomplete. Open the link from the email again, or request a new one." />
          <AuthLink href="/forgot-password">Request a new link</AuthLink>
        </>
      )}
    </AuthCard>
  );
}
