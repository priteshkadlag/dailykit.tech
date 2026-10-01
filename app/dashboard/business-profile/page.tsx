import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { BusinessProfileLoader } from "@/components/dashboard/business-profile-loader";

export const metadata: Metadata = { title: "Business profile" };

export default async function Page() {
  await requireUser("/dashboard/business-profile");
  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Business profile</h1>
        <p className="text-sm text-muted-foreground">Saved once, filled in automatically on every new invoice and quotation.</p>
      </div>
      <BusinessProfileLoader />
    </div>
  );
}
