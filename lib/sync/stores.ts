import { businessDefaultsStore, documentsStore } from "@/lib/documents/store";
import { expensesStore } from "@/lib/expenses/store";
import { createSyncedCollection } from "@/lib/storage/synced-collection";
import { tasksStore } from "@/lib/tasks/store";
import { favoriteToolSchema, savedCalculationSchema } from "./kinds";

export const savedCalculationsStore = createSyncedCollection("calculations", "dailykit:calculations:v1", savedCalculationSchema);
export const favoritesStore = createSyncedCollection("favorites", "dailykit:favorites:v1", favoriteToolSchema);

/** Every synced store, in the order device data is imported into a new account. */
export const ALL_STORES = [businessDefaultsStore, documentsStore, expensesStore, tasksStore, savedCalculationsStore, favoritesStore];
