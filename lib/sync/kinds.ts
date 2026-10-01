import { z } from "zod";
import { businessDefaultsSchema, documentSchema } from "@/lib/documents/types";
import { expenseSchema } from "@/lib/expenses/model";
import { taskSchema } from "@/lib/tasks/model";

/** A calculator result the user kept ("Recent calculations"). */
export const savedCalculationSchema = z.object({
  id: z.string().min(1).max(64),
  toolSlug: z.string().min(1).max(60),
  summary: z.string().min(1).max(2000),
  /** Path back to the tool (same-site only). */
  url: z.string().max(500).regex(/^\/[^/\\]/).default("/"),
  createdAt: z.string(),
});
export type SavedCalculation = z.infer<typeof savedCalculationSchema>;

/** A favourite tool; the id is the tool slug. */
export const favoriteToolSchema = z.object({
  id: z.string().min(1).max(60),
  createdAt: z.string(),
});
export type FavoriteTool = z.infer<typeof favoriteToolSchema>;

/**
 * Everything that follows the user between devices once they sign in. The browser keeps each
 * kind in localStorage for guests; the server stores it in Postgres for accounts.
 */
export const SYNC_SCHEMAS = {
  documents: documentSchema,
  expenses: expenseSchema,
  tasks: taskSchema,
  business: businessDefaultsSchema,
  calculations: savedCalculationSchema,
  favorites: favoriteToolSchema,
} as const;

export type SyncKind = keyof typeof SYNC_SCHEMAS;
export const SYNC_KINDS = Object.keys(SYNC_SCHEMAS) as SyncKind[];
export type SyncItem<K extends SyncKind> = z.output<(typeof SYNC_SCHEMAS)[K]>;

export function isSyncKind(value: string): value is SyncKind {
  return Object.hasOwn(SYNC_SCHEMAS, value);
}

/** Items per import request (documents can each carry a logo, so batches stay small). */
export const IMPORT_BATCH = 20;

/** Error body returned by the sync API. `code: "limit"` means the plan limit was reached. */
export interface SyncErrorBody {
  error: string;
  code?: "limit" | "invalid" | "auth" | "rate" | "not_found";
}
