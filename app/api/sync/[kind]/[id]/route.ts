import { guardAccountRequest, json, jsonError, readJson } from "@/lib/server/api";
import { InvalidItemError, PlanLimitError, REPOS, type Repo } from "@/lib/server/sync/repos";
import { isSyncKind, SYNC_SCHEMAS } from "@/lib/sync/kinds";

// Documents can carry a logo (≤ 400 KB as a data URL) plus up to 200 line items.
const MAX_BODY = 1_000_000;

/** Create or replace one item. The id in the URL must match the body. */
export async function PUT(request: Request, ctx: RouteContext<"/api/sync/[kind]/[id]">) {
  const { kind, id } = await ctx.params;
  if (!isSyncKind(kind)) return jsonError(404, { error: "Not found.", code: "not_found" });
  const user = await guardAccountRequest(request, { write: true, limit: "sync" });
  if (user instanceof Response) return user;

  const parsed = SYNC_SCHEMAS[kind].safeParse(await readJson(request, MAX_BODY));
  if (!parsed.success || parsed.data.id !== id) return jsonError(400, { error: "That couldn't be saved — some details are invalid.", code: "invalid" });

  try {
    await (REPOS[kind] as Repo<typeof parsed.data>).upsert(user.id, parsed.data);
  } catch (error) {
    if (error instanceof PlanLimitError) return jsonError(403, { error: error.message, code: "limit" });
    if (error instanceof InvalidItemError) return jsonError(400, { error: error.message, code: "invalid" });
    throw error;
  }
  return json({ ok: true });
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/sync/[kind]/[id]">) {
  const { kind, id } = await ctx.params;
  if (!isSyncKind(kind)) return jsonError(404, { error: "Not found.", code: "not_found" });
  const user = await guardAccountRequest(request, { write: true, limit: "sync" });
  if (user instanceof Response) return user;
  await REPOS[kind].remove(user.id, id);
  return json({ ok: true });
}
