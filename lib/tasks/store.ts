import { createSyncedCollection } from "@/lib/storage/synced-collection";
import { taskSchema } from "./model";

export const tasksStore = createSyncedCollection("tasks", "dailykit:tasks:v1", taskSchema);
