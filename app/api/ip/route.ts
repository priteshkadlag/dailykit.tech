import { ipFromHeaders } from "@/lib/security/request";

/** The caller's public IP address, as seen by the server (for the IP Address Checker). Nothing is stored. */
export function GET(request: Request) {
  const ip = ipFromHeaders(request.headers);
  return Response.json({ ip: ip === "unknown" ? null : ip.replace(/^::ffff:/, "") }, { headers: { "Cache-Control": "no-store" } });
}
