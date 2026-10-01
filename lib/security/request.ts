import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";

const salt = () => process.env.RATE_LIMIT_SALT || process.env.AUTH_SECRET || "dailykit";

/** Keyed hash so identifiers (IPs, emails) can be counted without being stored. */
export function hashIdentifier(value: string) {
  return createHmac("sha256", salt()).update(value.trim().toLowerCase()).digest("base64url").slice(0, 32);
}

export function ipFromHeaders(h: Headers) {
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || "unknown";
}

/** Hashed client IP for the current request (server actions / route handlers). */
export async function currentIpKey() {
  return hashIdentifier(ipFromHeaders(await headers()));
}

/**
 * CSRF guard for route handlers that change data. Server Actions already get this check from Next.js;
 * route handlers don't, so mutating API routes call it explicitly. Browsers always send Origin on
 * cross-site POST/PUT/DELETE, so a missing or foreign Origin is rejected.
 */
export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
