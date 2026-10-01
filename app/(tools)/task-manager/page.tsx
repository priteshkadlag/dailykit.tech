import { toolMetadata } from "@/lib/seo";
import type { Faq } from "@/components/shared/faq-section";
import { ToolPage } from "@/components/shared/tool-page";
import { TaskManagerLoader } from "@/components/tasks/task-loader";

const slug = "task-manager";
const description =
  "Plan your day with a simple to-do list: due dates, priorities, categories and reminders. See today's, upcoming, overdue and done tasks at a glance.";

export const metadata = toolMetadata(slug, {
  title: "Daily Task Manager & Reminder – Simple To-Do List",
  description,
});

const faqs: Faq[] = [
  {
    question: "How do reminders work?",
    answer: "Choose a reminder time when adding a task. If you allow browser notifications, you'll get a notification when it's due; otherwise the reminder appears on the page. Reminders work while this site is open in a browser tab, and any you missed are shown the next time you open it.",
  },
  {
    question: "Where are my tasks saved?",
    answer: "Without an account, in this browser on this device. Log in with a free account and your tasks are saved to your account and synced across devices.",
  },
  {
    question: "What counts as overdue?",
    answer: "A task with a time is overdue once that time passes. A task with only a date is overdue from the next day.",
  },
  {
    question: "Can I reopen a completed task?",
    answer: "Yes. Open the Completed tab and untick the task — it goes back to Today, Upcoming or Overdue based on its due date.",
  },
];

export default function Page() {
  return (
    <ToolPage slug={slug} heading="Reminder & Task Manager" description={description} faqs={faqs}>
      <TaskManagerLoader />
    </ToolPage>
  );
}
