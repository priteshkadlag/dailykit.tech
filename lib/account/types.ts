import type { PlanId } from "@/lib/billing/plans";

export interface AccountUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: "USER" | "ADMIN";
  plan: PlanId;
}

/** Response of GET /api/me. */
export type AccountInfo = { user: null } | { user: AccountUser; analyticsOptOut: boolean };
