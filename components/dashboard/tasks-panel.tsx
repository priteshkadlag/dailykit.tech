"use client";

import Link from "next/link";
import { format } from "date-fns";
import { AlertCircle } from "lucide-react";
import { useClock } from "@/lib/hooks/use-client-values";
import { dueAt, PRIORITY_LABEL, viewOf, type Task } from "@/lib/tasks/model";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Panel, PanelEmpty } from "./panels";

/** Overdue and today's tasks. Client-side so "today" and "overdue" follow the user's clock. */
export function TasksPanel({ tasks }: { tasks: Task[] }) {
  const now = useClock();
  // useClock reports the epoch while rendering on the server; wait for the real time.
  const ready = now.getTime() > 0;
  const overdue = ready ? tasks.filter((t) => viewOf(t, now) === "overdue") : [];
  const today = ready ? tasks.filter((t) => viewOf(t, now) === "today") : [];
  const shown = [...overdue, ...today].slice(0, 6);

  return (
    <Panel title="Tasks" href="/task-manager" linkLabel="All tasks">
      {!ready ? (
        <div className="h-24 animate-pulse rounded-lg bg-muted" />
      ) : shown.length === 0 ? (
        <PanelEmpty action={<Link href="/task-manager" className={cn(buttonVariants({ variant: "outline" }), "h-9")}>Add a task</Link>}>
          {tasks.length ? "Nothing due today. You're all caught up." : "No open tasks yet."}
        </PanelEmpty>
      ) : (
        <>
          <p className="pb-2 text-sm text-muted-foreground">
            {overdue.length > 0 && <span className="font-medium text-destructive">{overdue.length} overdue · </span>}
            {today.length} due today
          </p>
          <ul className="divide-y">
            {shown.map((t) => {
              const due = dueAt(t);
              const late = viewOf(t, now) === "overdue";
              return (
                <li key={t.id} className="flex items-center gap-3 py-2.5">
                  {late && <AlertCircle className="size-4 shrink-0 text-destructive" aria-label="Overdue" />}
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {PRIORITY_LABEL[t.priority]}
                    {due && ` · ${t.dueTime ? format(due, late ? "d MMM, h:mm a" : "h:mm a") : format(due, "d MMM")}`}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Panel>
  );
}
