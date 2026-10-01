import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guardAccountRequest, json, jsonError, readJson } from "@/lib/server/api";
import { InvalidItemError, PlanLimitError, REPOS, type Repo } from "@/lib/server/sync/repos";
import { IMPORT_BATCH, isSyncKind, SYNC_SCHEMAS } from "@/lib/sync/kinds";

const MAX_BODY = 8_000_000;
const bodySchema = z.object({ kind: z.string(), items: z.array(z.unknown()).max(IMPORT_BATCH) });

/**
 * Copy items saved in this browser into the account, one batch of one kind per request.
 * Each item goes through the same validation and plan limits as a normal save; items that
 * can't be imported are counted and skipped rather than failing the whole batch.
 */
export async function POST(request: Request) {
  const user = await guardAccountRequest(request, { write: true, limit: "sync" });
  if (user instanceof Response) return user;

  const body = bodySchema.safeParse(await readJson(request, MAX_BODY));
  if (!body.success || !isSyncKind(body.data.kind)) return jsonError(400, { error: "Invalid import.", code: "invalid" });
  const kind = body.data.kind;
  const schema = SYNC_SCHEMAS[kind];
  const repo = REPOS[kind] as Repo<unknown>;

  // The account's Business Profile always wins over a copy saved on a device.
  if (kind === "business" && (await prisma.businessProfile.findUnique({ where: { userId: user.id }, select: { id: true } }))) {
    return json({ imported: body.data.items.length, invalid: 0, overLimit: 0 });
  }

  let imported = 0;
  let invalid = 0;
  let overLimit = 0;
  let limitMessage: string | undefined;
  for (const raw of body.data.items) {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      invalid++;
      continue;
    }
    try {
      await repo.upsert(user.id, parsed.data);
      imported++;
    } catch (error) {
      if (error instanceof PlanLimitError) {
        overLimit++;
        limitMessage = error.message;
      } else if (error instanceof InvalidItemError) invalid++;
      else throw error;
    }
  }
  return json({ imported, invalid, overLimit, limitMessage });
}
