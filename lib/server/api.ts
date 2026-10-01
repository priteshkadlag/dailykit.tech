import "server-only";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { isSameOrigin } from "@/lib/security/request";
import { rateLimit, type RateLimitName } from "@/lib/security/rate-limit";
import type { SyncErrorBody } from "@/lib/sync/kinds";

const NO_STORE = { "Cache-Control": "private, no-store" };

export function json(body: unknown, init: ResponseInit = {}) {
  return Response.json(body, { ...init, headers: { ...NO_STORE, ...init.headers } });
}

export function jsonError(status: number, body: SyncErrorBody, headers?: HeadersInit) {
  return json(body, { status, headers });
}

/**
 * Common gate for account API routes: signed-in user, same-origin for writes (CSRF), and a per-user
 * rate limit. Returns the user, or the error response to send back.
 */
export async function guardAccountRequest(request: Request, options: { write: boolean; limit: RateLimitName }): Promise<SessionUser | Response> {
  if (options.write && !isSameOrigin(request)) return jsonError(403, { error: "Cross-site request blocked." });
  const user = await getSessionUser();
  if (!user) return jsonError(401, { error: "Please log in again.", code: "auth" });
  const limit = await rateLimit(options.limit, user.id);
  if (!limit.ok) {
    return jsonError(429, { error: "Too many changes at once. Please wait a moment and try again.", code: "rate" }, { "Retry-After": String(limit.retryAfterSeconds) });
  }
  return user;
}

/** Read a JSON body with a size cap; returns undefined when it's missing, too large or malformed. */
export async function readJson(request: Request, maxBytes: number): Promise<unknown> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > maxBytes) return undefined;
  const text = await request.text();
  if (text.length > maxBytes) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
