"use client";

import { useMemo, useState } from "react";
import { format, isTomorrow, isYesterday } from "date-fns";
import { Bell, BellOff, BellRing, CalendarClock, CheckCircle2, ListTodo, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { parseDateInput, toDateInputValue } from "@/lib/calculations/age";
import { useClock } from "@/lib/hooks/use-client-values";
import { useCollection, newId } from "@/lib/storage/local-collection";
import {
  countByView,
  dueAt,
  filterTasks,
  PRIORITIES,
  PRIORITY_LABEL,
  REMINDER_LABEL,
  sortTasks,
  TASK_CATEGORIES,
  TASK_CATEGORY_LABEL,
  viewOf,
  type Priority,
  type Task,
  type TaskCategory,
  type TaskSort,
  type TaskView,
} from "@/lib/tasks/model";
import { requestNotificationPermission, useNotificationPermission, useReminderScheduler } from "@/lib/tasks/reminders";
import { tasksStore } from "@/lib/tasks/store";
import { showSaveError } from "@/components/shared/save-error";
import { whereSaved } from "@/lib/storage/synced-collection";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SelectField, TextField } from "@/components/shared/form-fields";
import { TaskForm, type TaskInput } from "./task-form";

const VIEWS: { id: TaskView; label: string; empty: string }[] = [
  { id: "today", label: "Today", empty: "Nothing due today. 🎉" },
  { id: "upcoming", label: "Upcoming", empty: "No upcoming tasks." },
  { id: "overdue", label: "Overdue", empty: "Nothing overdue — nice work." },
  { id: "completed", label: "Completed", empty: "Completed tasks will appear here." },
];

const PRIORITY_STYLE: Record<Priority, string> = {
  high: "bg-red-50 text-red-700 ring-red-600/20",
  medium: "bg-amber-50 text-amber-800 ring-amber-600/20",
  low: "bg-slate-100 text-slate-700 ring-slate-500/20",
};

function dueLabel(task: Task, now: Date) {
  const date = parseDateInput(task.dueDate);
  if (!date) return null;
  const today = toDateInputValue(now);
  const dayText = task.dueDate === today ? "Today" : isTomorrow(date) ? "Tomorrow" : isYesterday(date) ? "Yesterday" : format(date, "EEE, d MMM");
  const due = dueAt(task);
  return task.dueTime && due ? `${dayText}, ${format(due, "h:mm a")}` : dayText;
}

export function TaskManager() {
  useReminderScheduler();
  const tasks = useCollection(tasksStore);
  const permission = useNotificationPermission();
  const now = useClock();
  const [view, setView] = useState<TaskView>("today");
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<TaskCategory | "all">("all");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [sort, setSort] = useState<TaskSort>("due");

  const counts = useMemo(() => countByView(tasks, now), [tasks, now]);
  const visible = useMemo(() => {
    const inView = tasks.filter((t) => viewOf(t, now) === view);
    const sorted = sortTasks(filterTasks(inView, { query, category, priority }), sort);
    // Most recently completed first on the Completed tab.
    return view === "completed" ? [...sorted].sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? "")) : sorted;
  }, [tasks, now, view, query, category, priority, sort]);

  const save = async (values: TaskInput) => {
    try {
      if (editing) {
        const scheduleChanged = values.dueDate !== editing.dueDate || values.dueTime !== editing.dueTime || values.reminder !== editing.reminder;
        // A new due time or reminder should fire again.
        await tasksStore.upsert({ ...editing, ...values, remindedAt: scheduleChanged ? null : editing.remindedAt });
        setEditing(null);
        toast.success("Task updated.");
      } else {
        await tasksStore.upsert({ ...values, id: newId(), completed: false, completedAt: null, remindedAt: null, createdAt: new Date().toISOString() });
        const target = viewOf({ ...values, completed: false } as Task, new Date());
        toast.success(`Task added to ${VIEWS.find((v) => v.id === target)?.label}.`);
      }
      return true;
    } catch (error) {
      showSaveError(error);
      return false;
    }
  };

  const toggle = async (task: Task) => {
    const completed = !task.completed;
    try {
      await tasksStore.upsert({ ...task, completed, completedAt: completed ? new Date().toISOString() : null });
    } catch (error) {
      showSaveError(error);
      return;
    }
    toast.success(completed ? `Completed: ${task.title}` : `Marked as not done: ${task.title}`);
  };

  const enableNotifications = async () => {
    const result = await requestNotificationPermission();
    if (result === "granted") toast.success("Browser reminders are on.");
    else if (result === "denied") toast.error("Notifications are blocked. Allow them in your browser's site settings.");
  };

  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="Task views" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            role="tab"
            aria-selected={view === v.id}
            onClick={() => setView(v.id)}
            className={cn(
              "rounded-xl p-4 text-left ring-1 transition-colors",
              view === v.id ? "bg-brand text-white ring-transparent" : "bg-card ring-foreground/10 hover:ring-primary/40",
            )}
          >
            <span className={cn("block text-sm", view === v.id ? "opacity-85" : "text-muted-foreground")}>{v.label}</span>
            <span className={cn("block text-2xl font-bold tabular-nums", v.id === "overdue" && counts.overdue > 0 && view !== v.id && "text-destructive")}>{counts[v.id]}</span>
          </button>
        ))}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-4 lg:sticky lg:top-32">
          <TaskForm key={editing?.id ?? "new"} editing={editing} defaultDate={view === "today" ? toDateInputValue(now) : ""} onSubmit={save} onCancelEdit={() => setEditing(null)} />
          <div className="flex items-start gap-3 rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
            {permission === "granted" ? <BellRing className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden /> : <Bell className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />}
            <div className="space-y-2">
              <p>
                {permission === "granted"
                  ? "Browser reminders are on. They appear while this site is open in a tab."
                  : permission === "denied"
                    ? "Browser notifications are blocked — reminders will show inside this page instead."
                    : permission === "unsupported"
                      ? "This browser doesn't support notifications — reminders will show inside this page."
                      : "Get a notification when a reminder is due (while this site is open)."}
              </p>
              {permission === "default" && (
                <Button variant="outline" className="h-9" onClick={enableNotifications}>
                  Enable browser reminders
                </Button>
              )}
            </div>
          </div>
        </div>

        <section aria-label={`${VIEWS.find((v) => v.id === view)?.label} tasks`} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
            <TextField label="Search" value={query} onChange={setQuery} placeholder="Search tasks" />
            <SelectField label="Category" value={category} onChange={setCategory} options={[{ value: "all", label: "All" }, ...TASK_CATEGORIES.map((c) => ({ value: c, label: TASK_CATEGORY_LABEL[c] }))]} />
            <SelectField label="Priority" value={priority} onChange={setPriority} options={[{ value: "all", label: "All" }, ...PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABEL[p] }))]} />
            <SelectField
              label="Sort by"
              value={sort}
              onChange={setSort}
              options={[
                { value: "due", label: "Due date" },
                { value: "priority", label: "Priority" },
                { value: "created", label: "Newest" },
              ]}
            />
          </div>

          {tasks.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed bg-card/50 p-10 text-center">
              <ListTodo className="size-8 text-muted-foreground" aria-hidden />
              <p className="font-medium">No tasks yet</p>
              <p className="max-w-xs text-sm text-muted-foreground">Add your first task — it&apos;s saved {whereSaved(tasksStore)}.</p>
            </div>
          ) : visible.length === 0 ? (
            <p className="rounded-xl bg-card p-8 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
              {query || category !== "all" || priority !== "all" ? "No tasks match these filters." : VIEWS.find((v) => v.id === view)?.empty}
            </p>
          ) : (
            <ul className="divide-y overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
              {visible.map((task) => {
                const due = dueLabel(task, now);
                const overdue = viewOf(task, now) === "overdue";
                return (
                  <li key={task.id} className={cn("flex items-start gap-3 p-4", editing?.id === task.id && "bg-accent/40")}>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggle(task)}
                      aria-label={`${task.completed ? "Mark as not done" : "Complete"}: ${task.title}`}
                      className="mt-0.5 size-6 shrink-0 cursor-pointer accent-primary"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className={cn("font-medium break-words", task.completed && "text-muted-foreground line-through")}>{task.title}</p>
                      {task.description && <p className="text-sm break-words text-muted-foreground">{task.description}</p>}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className={cn("rounded-full px-2 py-0.5 font-medium ring-1 ring-inset", PRIORITY_STYLE[task.priority])}>{PRIORITY_LABEL[task.priority]}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{TASK_CATEGORY_LABEL[task.category]}</span>
                        {due && (
                          <span className={cn("flex items-center gap-1", overdue ? "font-medium text-destructive" : "text-muted-foreground")}>
                            <CalendarClock className="size-3.5" aria-hidden />
                            {overdue ? `Overdue · ${due}` : due}
                          </span>
                        )}
                        {task.reminder !== "none" && !task.completed && (
                          <span className="flex items-center gap-1 text-muted-foreground" title={REMINDER_LABEL[task.reminder]}>
                            {task.remindedAt ? <BellOff className="size-3.5" aria-hidden /> : <Bell className="size-3.5" aria-hidden />}
                            {task.remindedAt ? "Reminded" : REMINDER_LABEL[task.reminder]}
                          </span>
                        )}
                        {task.completed && task.completedAt && (
                          <span className="flex items-center gap-1 text-emerald-700">
                            <CheckCircle2 className="size-3.5" aria-hidden /> Done {format(new Date(task.completedAt), "d MMM")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-10"
                        aria-label={`Edit ${task.title}`}
                        onClick={() => {
                          setEditing(task);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-10 text-destructive hover:text-destructive" aria-label={`Delete ${task.title}`} onClick={() => setDeleting(task)}>
                        <Trash2 />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this task?"
        description={deleting ? `“${deleting.title}” will be permanently removed.` : ""}
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!deleting) return;
          const target = deleting;
          try {
            await tasksStore.remove(target.id);
          } catch (error) {
            showSaveError(error);
            return;
          }
          if (editing?.id === target.id) setEditing(null);
          toast.success("Task deleted.");
        }}
      />
    </div>
  );
}
