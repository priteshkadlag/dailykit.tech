"use client";

import dynamic from "next/dynamic";
import { tasksStore } from "@/lib/tasks/store";
import { StoreGate } from "@/components/account/store-gate";
import { WorkspaceSkeleton } from "@/components/shared/workspace-skeleton";

const TaskManager = dynamic(() => import("./task-manager").then((m) => m.TaskManager), {
  ssr: false,
  loading: WorkspaceSkeleton,
});

const stores = [tasksStore];

/** Client-only: tasks come from this device (guests) or the account (signed in). */
export function TaskManagerLoader() {
  return (
    <StoreGate stores={stores}>
      <TaskManager />
    </StoreGate>
  );
}
