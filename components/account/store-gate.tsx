"use client";

import { useCallback, useSyncExternalStore } from "react";
import { CloudOff } from "lucide-react";
import type { CollectionStatus, SyncedCollection } from "@/lib/storage/synced-collection";
import { Button } from "@/components/ui/button";
import { WorkspaceSkeleton } from "@/components/shared/workspace-skeleton";
import { LocalDataNotice } from "./local-data-notice";

type AnyStore = SyncedCollection<{ id: string }>;

function combinedStatus(stores: AnyStore[]): `${CollectionStatus}:${string}` {
  const statuses = stores.map((s) => s.status());
  const status = statuses.includes("error") ? "error" : statuses.includes("loading") ? "loading" : "ready";
  return `${status}:${stores[0]?.mode() ?? "local"}`;
}

/**
 * Renders a workspace once its saved data is available: instantly for guests (this device), after
 * the first fetch for signed-in users (their account). Remounts the workspace if the storage mode
 * changes so it never mixes device and account data.
 */
export function StoreGate({ stores, fallback = <WorkspaceSkeleton />, children }: { stores: AnyStore[]; fallback?: React.ReactNode; children: React.ReactNode }) {
  const subscribe = useCallback(
    (listener: () => void) => {
      const unsubscribers = stores.map((s) => s.subscribe(listener));
      return () => unsubscribers.forEach((u) => u());
    },
    [stores],
  );
  const snapshot = useSyncExternalStore(subscribe, () => combinedStatus(stores), () => "loading:pending" as const);
  const [status, mode] = snapshot.split(":") as [CollectionStatus, string];

  if (status === "loading") return fallback;
  if (status === "error") {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 rounded-xl bg-card p-8 text-center ring-1 ring-foreground/10">
        <CloudOff className="size-8 text-muted-foreground" aria-hidden />
        <p className="font-medium">Couldn&apos;t load your saved data.</p>
        <p className="max-w-sm text-sm text-muted-foreground">Check your connection and try again. Nothing has been lost.</p>
        <Button className="h-10" onClick={() => stores.forEach((s) => s.status() === "error" && s.reload())}>
          Try again
        </Button>
      </div>
    );
  }
  return (
    <div key={mode} className="space-y-4">
      {mode === "cloud" && <LocalDataNotice stores={stores} />}
      {children}
    </div>
  );
}
