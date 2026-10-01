"use client";

import { useEffect, useSyncExternalStore } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { dueAt, dueReminders, type Task } from "./model";
import { tasksStore } from "./store";

/**
 * A way of delivering a reminder. Browser notifications and in-app toasts exist today;
 * email, SMS or push channels can be added later (server-side, once accounts exist)
 * without changing the task UI.
 */
export interface ReminderChannel {
  id: string;
  /** Returns true if the reminder was delivered through this channel. */
  deliver(task: Task): boolean;
}

function reminderBody(task: Task) {
  const due = dueAt(task);
  if (!due) return task.description || "Task reminder";
  return `Due ${task.dueTime ? format(due, "EEE d MMM, h:mm a") : format(due, "EEE d MMM")}${task.description ? ` · ${task.description.slice(0, 80)}` : ""}`;
}

export const browserNotificationChannel: ReminderChannel = {
  id: "browser",
  deliver(task) {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return false;
    try {
      new Notification(`⏰ ${task.title}`, { body: reminderBody(task), tag: `task-${task.id}` });
      return true;
    } catch {
      // Some mobile browsers only allow notifications from a service worker.
      return false;
    }
  },
};

export const inAppChannel: ReminderChannel = {
  id: "in-app",
  deliver(task) {
    toast(`⏰ ${task.title}`, { description: reminderBody(task), duration: 15_000 });
    return true;
  },
};

const CHECK_EVERY_MS = 30_000;
const DEFAULT_CHANNELS: ReminderChannel[] = [browserNotificationChannel, inAppChannel];

/**
 * While the page is open, checks every 30 s for reminders that are due — including ones missed
 * while it was closed — delivers each once through every channel, and records `remindedAt`.
 */
export function useReminderScheduler(channels: ReminderChannel[] = DEFAULT_CHANNELS) {
  useEffect(() => {
    const check = () => {
      const now = new Date();
      for (const task of dueReminders(tasksStore.list(), now)) {
        channels.forEach((channel) => channel.deliver(task));
        // Best effort: if saving fails the reminder may repeat on the next check, which beats losing it.
        tasksStore.upsert({ ...task, remindedAt: now.toISOString() }).catch(() => undefined);
      }
    };
    check();
    const timer = window.setInterval(check, CHECK_EVERY_MS);
    return () => window.clearInterval(timer);
  }, [channels]);
}

export type NotificationStatus = "unsupported" | NotificationPermission;

const permissionListeners = new Set<() => void>();

/** Current browser-notification permission, re-read after we ask for it. */
export function useNotificationPermission(): NotificationStatus {
  return useSyncExternalStore(
    (listener) => {
      permissionListeners.add(listener);
      return () => permissionListeners.delete(listener);
    },
    () => (typeof Notification === "undefined" ? "unsupported" : Notification.permission),
    () => "default",
  );
}

export async function requestNotificationPermission() {
  if (typeof Notification === "undefined") return "unsupported" as const;
  const result = await Notification.requestPermission();
  permissionListeners.forEach((l) => l());
  return result;
}
