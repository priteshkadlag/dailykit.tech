import { guardAccountRequest, json, jsonError } from "@/lib/server/api";
import { REPOS } from "@/lib/server/sync/repos";
import { isSyncKind } from "@/lib/sync/kinds";

/** Everything of one kind that belongs to the signed-in user. */
export async function GET(request: Request, ctx: RouteContext<"/api/sync/[kind]">) {
  const { kind } = await ctx.params;
  if (!isSyncKind(kind)) return jsonError(404, { error: "Not found.", code: "not_found" });
  const user = await guardAccountRequest(request, { write: false, limit: "sync" });
  if (user instanceof Response) return user;
  return json({ items: await REPOS[kind].list(user.id) });
}
