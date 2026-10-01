"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteSavedCalculation } from "@/lib/account/actions";
import { Button } from "@/components/ui/button";
import { Panel, PanelEmpty } from "./panels";

interface Calculation {
  id: string;
  title: string;
  summary: string;
  url: string;
  createdAt: string;
}

export function CalculationsPanel({ calculations }: { calculations: Calculation[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard.");
    } catch {
      toast.error("Couldn't copy — your browser blocked clipboard access.");
    }
  };

  const remove = (id: string) =>
    startTransition(async () => {
      try {
        await deleteSavedCalculation(id);
        toast.success("Removed from recent calculations.");
        router.refresh();
      } catch {
        toast.error("Couldn't remove it. Please try again.");
      }
    });

  return (
    <Panel title="Recent calculations">
      {calculations.length === 0 ? (
        <PanelEmpty>Use the Save button under any calculator result (GST, EMI, discount…) to keep it here.</PanelEmpty>
      ) : (
        <ul className="divide-y">
          {calculations.map((c) => (
            <li key={c.id} className="flex items-start gap-2 py-2.5">
              <div className="min-w-0 flex-1">
                <Link href={c.url} className="text-sm font-medium hover:text-primary hover:underline">
                  {c.title}
                </Link>
                <p className="line-clamp-2 text-sm text-muted-foreground">{c.summary}</p>
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</p>
              </div>
              <Button variant="ghost" size="icon" className="size-9" onClick={() => copy(c.summary)} aria-label={`Copy ${c.title} result`}>
                <Copy />
              </Button>
              <Button variant="ghost" size="icon" className="size-9" disabled={pending} onClick={() => remove(c.id)} aria-label={`Remove ${c.title} result`}>
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
