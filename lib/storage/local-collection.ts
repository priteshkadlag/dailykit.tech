import { useSyncExternalStore } from "react";
import type { z } from "zod";

/**
 * Minimal repository contract used by the UI. Guests get a localStorage implementation
 * ("saved on this device"); signed-in users get the synced one from ./synced-collection, which
 * stores the same items in their account. Components don't know which one they're talking to.
 */
export interface Collection<T extends { id: string }> {
  list(): T[];
  get(id: string): T | undefined;
  /** Resolves once saved; rejects with StorageError when it couldn't be. */
  upsert(item: T): Promise<void>;
  remove(id: string): Promise<void>;
  subscribe(listener: () => void): () => void;
}

const EMPTY: never[] = [];

export function createLocalCollection<S extends z.ZodType<{ id: string }>>(key: string, schema: S): Collection<z.output<S>> & { clear(): void } {
  type T = z.output<S>;
  let cache: T[] | null = null;
  const listeners = new Set<() => void>();

  const read = (): T[] => {
    if (cache) return cache;
    try {
      const raw = JSON.parse(window.localStorage.getItem(key) ?? "[]");
      // Drop anything that no longer matches the schema instead of crashing the page.
      cache = Array.isArray(raw) ? raw.flatMap((item) => {
        const parsed = schema.safeParse(item);
        return parsed.success ? [parsed.data] : [];
      }) : [];
    } catch {
      cache = [];
    }
    return cache;
  };

  const write = (items: T[]) => {
    cache = items;
    try {
      window.localStorage.setItem(key, JSON.stringify(items));
    } catch (error) {
      // Quota exceeded or storage disabled: keep the in-memory copy and surface the failure.
      listeners.forEach((l) => l());
      throw new StorageError("Couldn't save on this device — browser storage is full or disabled.", { cause: error });
    }
    listeners.forEach((l) => l());
  };

  return {
    list: read,
    get: (id) => read().find((item) => item.id === id),
    upsert: async (item) => {
      const items = read();
      const index = items.findIndex((i) => i.id === item.id);
      write(index === -1 ? [item, ...items] : items.map((i, n) => (n === index ? item : i)));
    },
    remove: async (id) => write(read().filter((i) => i.id !== id)),
    clear: () => {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Storage disabled — nothing was stored anyway.
      }
      cache = [];
      listeners.forEach((l) => l());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      // Keep multiple open tabs in sync.
      const onStorage = (e: StorageEvent) => {
        if (e.key === key) {
          cache = null;
          listener();
        }
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
  };
}

export class StorageError extends Error {}

/** Subscribe a component to a collection. Renders an empty list on the server. */
export function useCollection<T extends { id: string }>(collection: Collection<T>): T[] {
  return useSyncExternalStore(collection.subscribe, collection.list, () => EMPTY);
}

export { newId } from "./id";
