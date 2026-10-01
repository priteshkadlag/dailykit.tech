import "server-only";
import { prisma } from "@/lib/prisma";

export interface RateLimitRule {
  /** Max requests per window. */
  limit: number;
  windowSeconds: number;
}

export const RATE_LIMITS = {
  login: { limit: 10, windowSeconds: 15 * 60 },
  loginPerIp: { limit: 30, windowSeconds: 15 * 60 },
  register: { limit: 5, windowSeconds: 60 * 60 },
  passwordReset: { limit: 5, windowSeconds: 60 * 60 },
  events: { limit: 120, windowSeconds: 60 },
  sync: { limit: 300, windowSeconds: 60 },
  import: { limit: 5, windowSeconds: 60 * 60 },
  account: { limit: 20, windowSeconds: 15 * 60 },
  statusCheck: { limit: 20, windowSeconds: 60 },
} satisfies Record<string, RateLimitRule>;

export type RateLimitName = keyof typeof RATE_LIMITS;

/**
 * Fixed-window counter stored in Postgres, so it holds across server instances and restarts.
 * One atomic upsert per call: the window resets when it has expired, otherwise the count goes up.
 * `key` must already be hashed — see hashIdentifier().
 */
export async function rateLimit(name: RateLimitName, key: string): Promise<{ ok: boolean; retryAfterSeconds: number }> {
  const { limit, windowSeconds } = RATE_LIMITS[name];
  const id = `${name}:${key}`;
  const rows = await prisma.$queryRaw<{ count: number; windowStart: Date }[]>`
    INSERT INTO "RateLimit" ("key", "count", "windowStart") VALUES (${id}, 1, now())
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."windowStart" < now() - make_interval(secs => ${windowSeconds}) THEN 1 ELSE "RateLimit"."count" + 1 END,
      "windowStart" = CASE WHEN "RateLimit"."windowStart" < now() - make_interval(secs => ${windowSeconds}) THEN now() ELSE "RateLimit"."windowStart" END
    RETURNING "count", "windowStart"`;
  const { count, windowStart } = rows[0];
  const retryAfterSeconds = Math.max(1, Math.ceil((windowStart.getTime() + windowSeconds * 1000 - Date.now()) / 1000));
  return { ok: count <= limit, retryAfterSeconds };
}

export function retryMessage(seconds: number) {
  const minutes = Math.ceil(seconds / 60);
  return minutes <= 1 ? "Too many attempts. Please try again in a minute." : `Too many attempts. Please try again in ${minutes} minutes.`;
}
