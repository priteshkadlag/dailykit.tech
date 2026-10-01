"use client";

import dynamic from "next/dynamic";
import { businessDefaultsStore, documentsStore } from "@/lib/documents/store";
import type { DocType } from "@/lib/documents/types";
import { StoreGate } from "@/components/account/store-gate";
import { WorkspaceSkeleton } from "@/components/shared/workspace-skeleton";

const DocumentWorkspace = dynamic(() => import("./document-workspace").then((m) => m.DocumentWorkspace), {
  ssr: false,
  loading: WorkspaceSkeleton,
});

const stores = [documentsStore, businessDefaultsStore];

/** Client-only: saved documents come from this device (guests) or the account (signed in). */
export function DocumentWorkspaceLoader({ type }: { type: DocType }) {
  return (
    <StoreGate stores={stores}>
      <DocumentWorkspace type={type} />
    </StoreGate>
  );
}
