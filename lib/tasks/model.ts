import { subDays, subHours, subMinutes } from "date-fns";
import { z } from "zod";
import { parseDateInput, toDateInputValue } from "@/lib/calculations/age";

export const PRIORITIES = ["high", "medium", "low"] as const;
export type Priority = (typeof PRIORITIES)[number];
export const PRIORITY_LABEL: Record<Priority, string> = { high: "High", medium: "Medium", low: "Low" };

export const TASK_CATEGORIES = ["work", "personal", "shopping", "health", "finance", "other"] as const;
export type TaskCategory = (typeof TASK_CATEGORIES)[number];
export const TASK_CATEGORY_LABEL: Record<TaskCategory, string> = {
  work: "Work",
  personal: "Personal",
  shopping: "Shopping",
  health: "Health",
  finance: "Finance",
  other: "Other",
};

export const REMINDERS = ["none", "at-time", "10m", "1h", "1d"] as const;
export type Reminder = (typeof REMINDERS)[number];
export const REMINDER_LABEL: Record<Reminder, string> = {
  none: "No reminder",
  "at-time": "At due time",
  "10m": "10 minutes before",
  "1h": "1 hour before",
  "1d": "1 day before",
};

export const taskSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).default(""),
  /** yyyy-mm-dd or "" for no due date */
  dueDate: z.string().default(""),
  /** HH:mm or "" for all day */
  dueTime: z.string().default(""),
  priority: z.enum(PRIORITIES).default("medium"),
  category: z.enum(TASK_CATEGORIES).default("personal"),
  reminder: z.enum(REMINDERS).default("none"),
  completed: z.boolean().default(false),
  completedAt: z.string().nullable().default(null),
  /** When a reminder was delivered, so it fires only once. */
  remindedAt: z.string().nullable().default(null),
  createdAt: z.string(),
});
export type Task = z.infer<typeof taskSchema>;

/** Hour used for reminders on all-day tasks. */
export const ALL_DAY_REMINDER_HOUR = 9;

/** The moment a task is due. All-day tasks are due at the end of the day. */
export function dueAt(task: Pick<Task, "dueDate" | "dueTime">): Date | null {
  const date = parseDateInput(task.dueDate);
  if (!date) return null;
  const m = /^(\d{2}):(\d{2})$/.exec(task.dueTime);
  if (m) date.setHours(Number(m[1]), Number(m[2]), 0, 0);
  else date.setHours(23, 59, 59, 999);
  return date;
}

/** When the reminder should fire, or null if there is none. All-day tasks use 9:00 AM as the reference time. */
export function reminderAt(task: Pick<Task, "dueDate" | "dueTime" | "reminder">): Date | null {
  if (task.reminder === "none") return null;
  const date = parseDateInput(task.dueDate);
  if (!date) return null;
  const m = /^(\d{2}):(\d{2})$/.exec(task.dueTime);
  date.setHours(m ? Number(m[1]) : ALL_DAY_REMINDER_HOUR, m ? Number(m[2]) : 0, 0, 0);
  switch (task.reminder) {
    case "10m":
      return subMinutes(date, 10);
    case "1h":
      return subHours(date, 1);
    case "1d":
      return subDays(date, 1);
    default:
      return date;
  }
}

export type TaskView = "today" | "upcoming" | "overdue" | "completed";

export function viewOf(task: Task, now: Date): TaskView {
  if (task.completed) return "completed";
  const due = dueAt(task);
  if (due && due < now) return "overdue";
  if (task.dueDate === toDateInputValue(now)) return "today";
  return "upcoming";
}

export function countByView(tasks: Task[], now: Date): Record<TaskView, number> {
  const counts = { today: 0, upcoming: 0, overdue: 0, completed: 0 };
  for (const t of tasks) counts[viewOf(t, now)]++;
  return counts;
}

export type TaskSort = "due" | "priority" | "created";

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

/** Due-date order puts undated tasks last; priority order breaks ties by due date. */
export function sortTasks(tasks: Task[], sort: TaskSort): Task[] {
  const due = (t: Task) => dueAt(t)?.getTime() ?? Number.POSITIVE_INFINITY;
  return [...tasks].sort((a, b) => {
    if (sort === "created") return b.createdAt.localeCompare(a.createdAt);
    if (sort === "priority") return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || due(a) - due(b);
    return due(a) - due(b) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  });
}

export function filterTasks(tasks: Task[], { query, category, priority }: { query: string; category: TaskCategory | "all"; priority: Priority | "all" }) {
  const q = query.trim().toLowerCase();
  return tasks.filter(
    (t) =>
      (category === "all" || t.category === category) &&
      (priority === "all" || t.priority === priority) &&
      (!q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)),
  );
}

/** Reminders that are due now (or were missed while the page was closed) and haven't fired yet. */
export function dueReminders(tasks: Task[], now: Date): Task[] {
  return tasks.filter((t) => {
    if (t.completed || t.remindedAt) return false;
    const at = reminderAt(t);
    return !!at && at <= now;
  });
}
