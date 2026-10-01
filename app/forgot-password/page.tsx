import type { Metadata } from "next";
import { AuthCard, AuthLink } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false } };

export default function Page() {
  return (
    <AuthCard
      title="Forgot your password?"
      description="Enter the email you signed up with and we'll send you a link to choose a new one."
      footer={
        <>
          Remembered it? <AuthLink href="/login">Back to login</AuthLink>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
