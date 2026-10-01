import { createSyncedCollection } from "@/lib/storage/synced-collection";
import { businessDefaultsSchema, documentSchema } from "./types";

export const documentsStore = createSyncedCollection("documents", "dailykit:documents:v1", documentSchema);
/** The Business Profile: seller, bank and default terms that pre-fill new invoices and quotations. */
export const businessDefaultsStore = createSyncedCollection("business", "dailykit:business-defaults:v1", businessDefaultsSchema);
