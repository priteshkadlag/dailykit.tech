import { useSyncExternalStore } from "react";
import type { AccountInfo, AccountUser } from "./types";

export type AccountState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "user"; user: AccountUser; analyticsOptOut: boolean };

const LOADING: AccountState = { status: "loading" };
const GUEST: AccountState = { status: "guest" };

let state: AccountState = LOADING;
let started = false;
const listeners = new Set<() => void>();

function set(next: AccountState) {
  state = next;
  listeners.forEach((l) => l());
}

async function load() {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch("/api/me", { cache: "no-store", credentials: "same-origin" });
      if (!res.ok) throw new Error(String(res.status));
      const info = (await res.json()) as AccountInfo;
      set(info.user ? { status: "user", user: info.user, analyticsOptOut: info.analyticsOptOut } : GUEST);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
  }
  // Server unreachable: behave as a guest so every tool keeps working on this device.
  set(GUEST);
}

/** Current account state; starts the /api/me request on first use. */
export function getAccountState(): AccountState {
  if (!started && typeof window !== "undefined") {
    started = true;
    void load();
  }
  return state;
}

export function subscribeAccount(listener: () => void) {
  getAccountState();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Re-check the session, e.g. after the server reports it expired. */
export function refreshAccount() {
  started = true;
  return load();
}

export function useAccount(): AccountState {
  return useSyncExternalStore(subscribeAccount, getAccountState, () => LOADING);
}
