"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  PRIORITIES,
  PRIORITY_LABEL,
  REMINDER_LABEL,
  REMINDERS,
  TASK_CATEGORIES,
  TASK_CATEGORY_LABEL,
  type Priority,
  type Reminder,
  type Task,
  type TaskCategory,
} from "@/lib/tasks/model";
import { Button } from "@/components/ui/button";
import { DateField, SegmentedControl, SelectField, TextAreaField, TextField } from "@/components/shared/form-fields";

export type TaskInput = Pick<Task, "title" | "description" | "dueDate" | "dueTime" | "priority" | "category" | "reminder">;

interface TaskFormProps {
  editing: Task | null;
  defaultDate: string;
  /** Resolves true when saved; the form keeps its values otherwise. */
  onSubmit: (values: TaskInput) => Promise<boolean>;
  onCancelEdit: () => void;
}

export function TaskForm({ editing, defaultDate, onSubmit, onCancelEdit }: TaskFormProps) {
  // The parent re-mounts this form (via key) to switch between adding and editing.
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [dueDate, setDueDate] = useState(editing ? editing.dueDate : defaultDate);
  const [dueTime, setDueTime] = useState(editing?.dueTime ?? "");
  const [priority, setPriority] = useState<Priority>(editing?.priority ?? "medium");
  const [category, setCategory] = useState<TaskCategory>(editing?.category ?? "work");
  const [reminder, setReminder] = useState<Reminder>(editing?.reminder ?? "none");
  const [expanded, setExpanded] = useState(!!editing);
  const [submitted, setSubmitted] = useState(false);

  const titleError = submitted && !title.trim() ? "Give the task a title" : undefined;
  const reminderError = reminder !== "none" && !dueDate ? "Set a due date to get a reminder" : undefined;

  return (
    <form
      noValidate
      className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitted(true);
        if (!title.trim() || reminderError) return;
        const saved = await onSubmit({ title: title.trim(), description: description.trim(), dueDate, dueTime: dueDate ? dueTime : "", priority, category, reminder });
        if (saved && !editing) {
          setTitle("");
          setDescription("");
          setSubmitted(false);
        }
      }}
    >
      <h2 className="text-base font-semibold">{editing ? "Edit task" : "Add a task"}</h2>
      <TextField label="Task" value={title} onChange={setTitle} error={titleError} placeholder="e.g. Call supplier about stock" maxLength={200} />
      <div className="grid grid-cols-2 gap-3">
        <DateField label="Due date" value={dueDate} onChange={setDueDate} />
        <label className="space-y-1.5">
          <span className="block text-sm font-medium">Time</span>
          <input
            type="time"
            value={dueTime}
            disabled={!dueDate}
            onChange={(e) => setDueTime(e.target.value)}
            className="h-11 w-full rounded-lg border bg-background px-3 text-base disabled:opacity-50"
            aria-describedby="time-hint"
          />
          <span id="time-hint" className="block text-xs text-muted-foreground">
            Optional
          </span>
        </label>
      </div>
      <SegmentedControl label="Priority" value={priority} onChange={setPriority} options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABEL[p] }))} />

      <button type="button" onClick={() => setExpanded((x) => !x)} aria-expanded={expanded} className="flex items-center gap-1 text-sm font-medium text-primary">
        <ChevronDown className={expanded ? "size-4 rotate-180 transition-transform" : "size-4 transition-transform"} aria-hidden />
        {expanded ? "Fewer options" : "More options — category, reminder, notes"}
      </button>
      {expanded && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Category" value={category} onChange={setCategory} options={TASK_CATEGORIES.map((c) => ({ value: c, label: TASK_CATEGORY_LABEL[c] }))} />
            <SelectField label="Reminder" value={reminder} onChange={setReminder} error={reminderError} options={REMINDERS.map((r) => ({ value: r, label: REMINDER_LABEL[r] }))} />
          </div>
          <TextAreaField label="Notes" value={description} onChange={setDescription} rows={2} maxLength={2000} />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" className="h-11 flex-1 px-6 sm:flex-none">
          {editing ? "Save changes" : "Add task"}
        </Button>
        {editing && (
          <Button type="button" variant="outline" className="h-11 px-5" onClick={onCancelEdit}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
