import { createSyncedCollection } from "@/lib/storage/synced-collection";
import { expenseSchema } from "./model";

export const expensesStore = createSyncedCollection("expenses", "dailykit:expenses:v1", expenseSchema);
