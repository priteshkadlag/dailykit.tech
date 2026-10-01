import { useSyncExternalStore } from "react";
import type { z } from "zod";
import { getAccountState, refreshAccount, subscribeAccount, type AccountState } from "@/lib/account/client";
import type { SyncErrorBody, SyncKind } from "@/lib/sync/kinds";
import { createLocalCollection, StorageError, type Collection } from "./local-collection";

export type CollectionStatus = "loading" | "ready" | "error";

export interface SyncedCollection<T extends { id: string }> extends Collection<T> {
  kind: SyncKind;
  status(): CollectionStatus;
  /** Where writes go right now. */
  mode(): "pending" | "local" | "cloud";
  /** Retry loading from the account after an error. */
  reload(): void;
  /** The browser copy, used to import device data into a new account. */
  local: Collection<T> & { clear(): void };
}

/** Thrown by upsert/remove when the server refused the change. `code: "limit"` = plan limit. */
export class SyncError extends StorageError {
  constructor(message: string, readonly code?: SyncErrorBody["code"]) {
    super(message);
  }
}

const EMPTY: never[] = [];
const REFRESH_ON_FOCUS_MS = 60_000;

async function errorFrom(res: Response): Promise<SyncError> {
  if (res.status === 401) void refreshAccount();
  try {
    const body = (await res.json()) as SyncErrorBody;
    return new SyncError(body.error || "Couldn't save your change.", body.code);
  } catch {
    return new SyncError("Couldn't save your change. Please try again.");
  }
}

/**
 * localStorage for guests, the account (via /api/sync) for signed-in users. Writes are applied
 * immediately and rolled back if the server rejects them, so the UI stays instant.
 */
export function createSyncedCollection<S extends z.ZodType<{ id: string }>>(kind: SyncKind, localKey: string, schema: S): SyncedCollection<z.output<S>> {
  type T = z.output<S>;
  const local = createLocalCollection(localKey, schema);
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  let mode: "pending" | "local" | "cloud" = "pending";
  let userId: string | null = null;
  let items: T[] | null = null;
  let loadFailed = false;
  let pendingWrites = 0;
  let lastFetch = 0;
  let bound = false;

  const url = (id?: string) => `/api/sync/${kind}${id ? `/${encodeURIComponent(id)}` : ""}`;

  async function fetchAll() {
    const forUser = userId;
    lastFetch = Date.now();
    try {
      const res = await fetch(url(), { cache: "no-store", credentials: "same-origin" });
      if (!res.ok) throw await errorFrom(res);
      const body = (await res.json()) as { items: unknown[] };
      if (userId !== forUser || pendingWrites > 0) return;
      items = body.items.flatMap((raw) => {
        const parsed = schema.safeParse(raw);
        return parsed.success ? [parsed.data] : [];
      });
      loadFailed = false;
    } catch {
      if (userId !== forUser) return;
      loadFailed = items === null;
    }
    emit();
  }

  function applyAccount(account: AccountState) {
    if (account.status === "loading") return;
    if (account.status === "guest") {
      if (mode !== "local") {
        mode = "local";
        userId = null;
        items = null;
        emit();
      }
      return;
    }
    if (mode === "cloud" && userId === account.user.id) return;
    mode = "cloud";
    userId = account.user.id;
    items = null;
    loadFailed = false;
    emit();
    void fetchAll();
  }

  function bind() {
    if (bound || typeof window === "undefined") return;
    bound = true;
    applyAccount(getAccountState());
    subscribeAccount(() => applyAccount(getAccountState()));
    local.subscribe(() => mode === "local" && emit());
    // Pick up changes made on another device when the user comes back to this tab.
    window.addEventListener("focus", () => {
      if (mode === "cloud" && pendingWrites === 0 && Date.now() - lastFetch > REFRESH_ON_FOCUS_MS) void fetchAll();
    });
  }

  const list = (): T[] => {
    bind();
    if (mode === "local") return local.list();
    return items ?? EMPTY;
  };

  function replaceItem(id: string, next: T | undefined) {
    const current = items ?? [];
    const index = current.findIndex((i) => i.id === id);
    if (next) items = index === -1 ? [next, ...current] : current.map((i, n) => (n === index ? next : i));
    else items = current.filter((i) => i.id !== id);
    emit();
  }

  async function write(id: string, next: T | undefined, request: () => Promise<Response>) {
    const previous = (items ?? []).find((i) => i.id === id);
    replaceItem(id, next);
    pendingWrites++;
    try {
      const res = await request().catch(() => {
        throw new SyncError("You're offline or the server can't be reached. Your change wasn't saved.");
      });
      if (!res.ok) throw await errorFrom(res);
    } catch (error) {
      replaceItem(id, previous);
      throw error;
    } finally {
      pendingWrites--;
    }
  }

  return {
    kind,
    local,
    list,
    get: (id) => list().find((i) => i.id === id),
    status: () => {
      bind();
      if (mode === "pending") return "loading";
      if (mode === "local") return "ready";
      return items ? "ready" : loadFailed ? "error" : "loading";
    },
    mode: () => {
      bind();
      return mode;
    },
    reload: () => {
      loadFailed = false;
      emit();
      void fetchAll();
    },
    upsert: async (item) => {
      bind();
      if (mode !== "cloud") return local.upsert(item);
      await write(item.id, item, () =>
        fetch(url(item.id), { method: "PUT", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) }),
      );
    },
    remove: async (id) => {
      bind();
      if (mode !== "cloud") return local.remove(id);
      await write(id, undefined, () => fetch(url(id), { method: "DELETE", credentials: "same-origin" }));
    },
    subscribe: (listener) => {
      bind();
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** "in your account" / "on this device", for labels next to saved data. */
export function whereSaved(collection: SyncedCollection<{ id: string }>) {
  return collection.mode() === "cloud" ? "in your account" : "on this device";
}

/** "loading" until the user's saved data is available (instant for guests). */
export function useCollectionStatus(collection: SyncedCollection<{ id: string }>): CollectionStatus {
  return useSyncExternalStore(collection.subscribe, collection.status, () => "loading");
}
