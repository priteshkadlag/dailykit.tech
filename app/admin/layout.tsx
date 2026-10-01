import type { Metadata } from "next";
import { Download } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false, follow: false } };

const reports = [
  { href: "/admin/reports/users", label: "Users" },
  { href: "/admin/reports/tool-usage", label: "Tool usage" },
  { href: "/admin/reports/subscriptions", label: "Subscriptions" },
];

// Pages and report routes each call requireAdmin(): a layout can't guard the pages rendered inside it.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Admin</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="text-muted-foreground">CSV reports:</span>
          {reports.map((r) => (
            <a key={r.href} href={r.href} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              <Download className="size-3.5" aria-hidden /> {r.label}
            </a>
          ))}
        </div>
      </div>
      <AdminNav />
      {children}
    </div>
  );
}
