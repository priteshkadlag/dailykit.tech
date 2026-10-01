import { hashIdentifier, ipFromHeaders, isSameOrigin } from "@/lib/security/request";
import { rateLimit } from "@/lib/security/rate-limit";
import { json, readJson } from "@/lib/server/api";
import { checkStatus } from "@/lib/server/status-check";

/**
 * HTTP Status Code Checker: requests a public URL and reports each status code in its redirect chain.
 * Same-origin only and rate limited per IP so it can't be used as an open proxy; private addresses are refused.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ ok: false, error: "Cross-site request blocked.", hops: [] }, { status: 403 });
  const body = await readJson(request, 3_000);
  const url = typeof body === "object" && body && "url" in body && typeof body.url === "string" ? body.url.trim() : "";
  if (!url || url.length > 2_000) return json({ ok: false, error: "Enter a web address to check.", hops: [] }, { status: 400 });

  const limit = await rateLimit("statusCheck", hashIdentifier(ipFromHeaders(request.headers)));
  if (!limit.ok) {
    return json({ ok: false, error: "Too many checks in a short time. Please wait a minute.", hops: [] }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  }
  return json(await checkStatus(url));
}
