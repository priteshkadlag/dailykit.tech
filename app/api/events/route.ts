import { eventPayloadSchema } from "@/lib/analytics/events";
import { prisma } from "@/lib/prisma";
import { hashIdentifier, ipFromHeaders } from "@/lib/security/request";
import { rateLimit } from "@/lib/security/rate-limit";
import { getToolOrNull } from "@/lib/tools";
import { readJson } from "@/lib/server/api";

/** Anonymous usage events (see lib/analytics/events.ts). Always answers 204 so it can't be probed. */
export async function POST(request: Request) {
  const parsed = eventPayloadSchema.safeParse(await readJson(request, 2_000));
  if (!parsed.success) return new Response(null, { status: 204 });

  try {
    const limit = await rateLimit("events", hashIdentifier(ipFromHeaders(request.headers)));
    if (!limit.ok) return new Response(null, { status: 204 });

    const { name, tool, visitorId } = parsed.data;
    await prisma.analyticsEvent.create({
      data: { name, toolSlug: tool && getToolOrNull(tool) ? tool : null, visitorId },
    });
  } catch (error) {
    // Statistics are best-effort: a missing or unreachable database must never surface as an error to visitors.
    console.error("Couldn't record analytics event", error);
  }
  return new Response(null, { status: 204 });
}
