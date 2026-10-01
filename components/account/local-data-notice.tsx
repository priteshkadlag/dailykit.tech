"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { CloudUpload, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { subscribeAccount, getAccountState } from "@/lib/account/client";
import type { SyncedCollection } from "@/lib/storage/synced-collection";
import { importDeviceData } from "@/lib/sync/import";
import { Button } from "@/components/ui/button";

type AnyStore = SyncedCollection<{ id: string }>;

const DISMISS_KEY = "dailykit:device-import-dismissed";

function readDismissed() {
  try {
    return window.sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * For signed-in users who saved things on this device before logging in: offers to move them into
 * the account. Renders nothing for guests or when there's nothing on the device.
 */
export function LocalDataNotice({ stores, onImported }: { stores: AnyStore[]; onImported?: () => void }) {
  const subscribe = useCallback(
    (listener: () => void) => {
      const unsubscribers = [subscribeAccount(listener), ...stores.map((s) => s.local.subscribe(listener))];
      return () => unsubscribers.forEach((u) => u());
    },
    [stores],
  );
  const count = useSyncExternalStore(
    subscribe,
    () => (getAccountState().status === "user" ? stores.reduce((n, s) => n + s.local.list().length, 0) : 0),
    () => 0,
  );
  const [dismissed, setDismissed] = useState(readDismissed);
  const [busy, setBusy] = useState(false);

  if (dismissed || count === 0) return null;

  const move = async () => {
    setBusy(true);
    try {
      const result = await importDeviceData(stores);
      if (result.skipped > 0) {
        toast.warning(`Moved ${result.imported} item${result.imported === 1 ? "" : "s"}; ${result.skipped} stayed on this device.`, { description: result.limitMessage });
      } else {
        toast.success(`Moved ${result.imported} item${result.imported === 1 ? "" : "s"} to your account.`);
      }
      onImported?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't move your data.");
    } finally {
      setBusy(false);
    }
  };

  const dismiss = () => {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Private mode: the notice just comes back on the next page.
    }
    setDismissed(true);
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center">
      <CloudUpload className="size-5 shrink-0 text-primary" aria-hidden />
      <p className="flex-1 text-sm">
        You have <strong>{count}</strong> item{count === 1 ? "" : "s"} saved on this device from before you logged in. Move {count === 1 ? "it" : "them"} to your account to see{" "}
        {count === 1 ? "it" : "them"} on every device.
      </p>
      <div className="flex gap-2">
        <Button className="h-10 flex-1 sm:flex-none" onClick={move} disabled={busy}>
          {busy && <Loader2 className="animate-spin" />} Move to account
        </Button>
        <Button variant="ghost" size="icon" className="size-10" onClick={dismiss} aria-label="Not now">
          <X />
        </Button>
      </div>
    </div>
  );
}
