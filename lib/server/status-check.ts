import "server-only";
import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import http, { type IncomingMessage } from "node:http";
import https from "node:https";
import { isIP, type LookupFunction } from "node:net";
import { ALLOWED_PORTS, isPublicAddress } from "@/lib/security/public-address";

export interface StatusHop {
  url: string;
  status: number;
  statusText: string;
  address: string;
  timeMs: number;
  location?: string;
  headers: Record<string, string>;
}

export type StatusCheckResult = { ok: true; hops: StatusHop[]; redirectLimitHit: boolean } | { ok: false; error: string; hops: StatusHop[] };

const MAX_REDIRECTS = 5;
const TIMEOUT_MS = 8_000;
const SHOWN_HEADERS = ["content-type", "content-length", "server", "cache-control", "location", "strict-transport-security", "x-robots-tag", "last-modified", "etag", "age", "x-cache"];

class CheckError extends Error {}

/** Returns the reason a URL may not be requested, or null if it's allowed. */
export function urlProblem(url: URL): string | null {
  if (url.protocol !== "http:" && url.protocol !== "https:") return "Only http:// and https:// addresses can be checked.";
  if (url.username || url.password) return "Addresses with a username or password can't be checked.";
  if (!ALLOWED_PORTS.has(url.port)) return "Only the standard web ports (80, 443, 8080 and 8443) can be checked.";
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host) && !isPublicAddress(host)) return "Private, local and reserved IP addresses can't be checked.";
  if (/^(localhost|.*\.(localhost|local|internal|home\.arpa))$/i.test(host)) return "Local network names can't be checked.";
  return null;
}

// DNS lookup that refuses non-public answers. It runs when the socket connects, so the address that's
// checked is the one actually used — a hostname can't pass the check and then resolve somewhere private.
const safeLookup: LookupFunction = (hostname, options, callback) => {
  dnsLookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) return callback(error, "", 4);
    const list = addresses as LookupAddress[];
    const unsafe = list.find((entry) => !isPublicAddress(entry.address));
    if (unsafe || !list.length) return callback(new CheckError("This domain points to a private or reserved IP address, so it can't be checked."), "", 4);
    if (options.all) (callback as unknown as (error: null, addresses: LookupAddress[]) => void)(null, list);
    else callback(null, list[0].address, list[0].family);
  });
};

function request(url: URL, method: "HEAD" | "GET"): Promise<{ response: IncomingMessage; address: string; timeMs: number }> {
  const started = performance.now();
  const client = url.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    const req = client.request(url, {
      method,
      lookup: safeLookup,
      timeout: TIMEOUT_MS,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; HTTPStatusChecker/1.0)", Accept: "*/*" },
    });
    req.on("response", (response) => {
      resolve({ response, address: req.socket?.remoteAddress ?? "", timeMs: Math.round(performance.now() - started) });
      // Only the status and headers are needed; never download the body.
      response.destroy();
    });
    req.on("timeout", () => req.destroy(new CheckError(`No response within ${TIMEOUT_MS / 1000} seconds.`)));
    req.on("error", reject);
    req.end();
  });
}

function describeError(error: unknown): string {
  if (error instanceof CheckError) return error.message;
  const code = (error as NodeJS.ErrnoException)?.code ?? "";
  const messages: Record<string, string> = {
    ENOTFOUND: "This domain doesn't exist (DNS lookup found no address).",
    EAI_AGAIN: "The DNS lookup timed out. Try again in a moment.",
    ECONNREFUSED: "The server refused the connection.",
    ECONNRESET: "The server closed the connection unexpectedly.",
    ETIMEDOUT: "The connection timed out.",
    EHOSTUNREACH: "The server can't be reached.",
    CERT_HAS_EXPIRED: "The site's SSL certificate has expired.",
    DEPTH_ZERO_SELF_SIGNED_CERT: "The site uses a self-signed SSL certificate.",
    SELF_SIGNED_CERT_IN_CHAIN: "The site's SSL certificate chain contains a self-signed certificate.",
    UNABLE_TO_VERIFY_LEAF_SIGNATURE: "The site's SSL certificate can't be verified (incomplete chain).",
    ERR_TLS_CERT_ALTNAME_INVALID: "The SSL certificate doesn't match this domain name.",
  };
  return messages[code] ?? `The request failed${code ? ` (${code})` : ""}.`;
}

/** Requests a URL (HEAD, falling back to GET) and follows up to five redirects, checking each hop. */
export async function checkStatus(input: string): Promise<StatusCheckResult> {
  const hops: StatusHop[] = [];
  let url: URL;
  try {
    url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    return { ok: false, error: "That isn't a valid web address.", hops };
  }
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const problem = urlProblem(url);
    if (problem) return { ok: false, error: hop ? `Stopped at a redirect: ${problem}` : problem, hops };
    let result;
    try {
      result = await request(url, "HEAD");
      // Some servers don't support HEAD; ask again with GET (the body is still not read).
      if (result.response.statusCode === 405 || result.response.statusCode === 501) result = await request(url, "GET");
    } catch (error) {
      return { ok: false, error: describeError(error), hops };
    }
    const { response, address, timeMs } = result;
    const status = response.statusCode ?? 0;
    const headers = Object.fromEntries(SHOWN_HEADERS.flatMap((name) => {
      const value = response.headers[name];
      return value === undefined ? [] : [[name, Array.isArray(value) ? value.join(", ") : String(value).slice(0, 500)]];
    }));
    const location = status >= 300 && status < 400 ? response.headers.location : undefined;
    let next: URL | undefined;
    if (location) {
      try {
        next = new URL(location, url);
      } catch {
        next = undefined;
      }
    }
    hops.push({ url: url.href, status, statusText: response.statusMessage ?? "", address, timeMs, location: next?.href ?? location, headers });
    if (!next) return { ok: true, hops, redirectLimitHit: false };
    url = next;
  }
  return { ok: true, hops, redirectLimitHit: true };
}
