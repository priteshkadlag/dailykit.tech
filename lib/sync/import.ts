import type { SyncedCollection } from "@/lib/storage/synced-collection";
import { IMPORT_BATCH } from "./kinds";

export interface ImportResult {
  imported: number;
  skipped: number;
  limitMessage?: string;
}

/**
 * Copy what this browser saved while signed out into the account. A kind's device copy is cleared
 * only when every item made it; anything skipped (plan limit, invalid) stays on the device.
 * An existing Business Profile in the account wins over the device copy (enforced by the server).
 */
export async function importDeviceData(stores: SyncedCollection<{ id: string }>[]): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, skipped: 0 };
  for (const store of stores) {
    const items = store.local.list();
    if (items.length === 0 || store.mode() !== "cloud") continue;
    let complete = true;
    for (let i = 0; i < items.length; i += IMPORT_BATCH) {
      const res = await fetch("/api/sync/import", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: store.kind, items: items.slice(i, i + IMPORT_BATCH) }),
      });
      if (!res.ok) throw new Error(res.status === 429 ? "Too many requests — please try again in a minute." : "Couldn't move your data. Please try again.");
      const body = (await res.json()) as { imported: number; invalid: number; overLimit: number; limitMessage?: string };
      result.imported += body.imported;
      result.skipped += body.invalid + body.overLimit;
      if (body.limitMessage) result.limitMessage = body.limitMessage;
      if (body.invalid + body.overLimit > 0) complete = false;
    }
    if (complete) store.local.clear();
    store.reload();
  }
  return result;
}
