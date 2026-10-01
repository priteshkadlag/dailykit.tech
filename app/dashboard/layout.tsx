import type { Metadata } from "next";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

export const metadata: Metadata = { robots: { index: false, follow: false } };

// Each page checks the session itself (layouts render in parallel with pages, so they can't guard them).
export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
      <DashboardNav />
      {children}
    </div>
  );
}
