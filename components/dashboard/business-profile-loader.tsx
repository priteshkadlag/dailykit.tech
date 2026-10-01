"use client";

import { businessDefaultsStore } from "@/lib/documents/store";
import { StoreGate } from "@/components/account/store-gate";
import { BusinessProfileForm } from "./business-profile-form";

const stores = [businessDefaultsStore];

function FormSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading your business profile">
      <div className="h-80 animate-pulse rounded-xl bg-muted" />
      <div className="h-56 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

/** Waits for the profile to load from the account, then shows the form. */
export function BusinessProfileLoader() {
  return (
    <StoreGate stores={stores} fallback={<FormSkeleton />}>
      <BusinessProfileForm />
    </StoreGate>
  );
}
