"use client";

import dynamic from "next/dynamic";
import { expensesStore } from "@/lib/expenses/store";
import { StoreGate } from "@/components/account/store-gate";
import { WorkspaceSkeleton } from "@/components/shared/workspace-skeleton";

const ExpenseTracker = dynamic(() => import("./expense-tracker").then((m) => m.ExpenseTracker), {
  ssr: false,
  loading: WorkspaceSkeleton,
});

const stores = [expensesStore];

/** Client-only: expenses come from this device (guests) or the account (signed in). */
export function ExpenseTrackerLoader() {
  return (
    <StoreGate stores={stores}>
      <ExpenseTracker />
    </StoreGate>
  );
}
