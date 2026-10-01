"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { endProAction, grantProAction, setRoleAction, type AdminResult } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

type Pending = { title: string; description: string; label: string; destructive?: boolean; run: () => Promise<AdminResult> } | null;

export function UserActions({ user }: { user: { id: string; email: string; role: "USER" | "ADMIN"; isPro: boolean; isSelf: boolean } }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [pending, setPending] = useState<Pending>(null);

  const run = (action: () => Promise<AdminResult>) =>
    startTransition(async () => {
      try {
        const result = await action();
        if (result.ok) toast.success(result.message);
        else toast.error(result.message);
        router.refresh();
      } catch {
        toast.error("That didn't work. Please try again.");
      }
    });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-9" aria-label={`Actions for ${user.email}`} disabled={busy} />}>
          {busy ? <Loader2 className="animate-spin" /> : <MoreHorizontal />}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => run(() => grantProAction(user.id, "monthly"))}>{user.isPro ? "Extend Pro by 1 month" : "Give Pro for 1 month"}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => run(() => grantProAction(user.id, "yearly"))}>{user.isPro ? "Extend Pro by 1 year" : "Give Pro for 1 year"}</DropdownMenuItem>
          {user.isPro && (
            <DropdownMenuItem
              variant="destructive"
              onClick={() =>
                setPending({
                  title: "End Pro now?",
                  description: `${user.email} goes back to the Free plan immediately. Their saved data is kept.`,
                  label: "End Pro",
                  destructive: true,
                  run: () => endProAction(user.id),
                })
              }
            >
              End Pro now
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {user.role === "ADMIN" ? (
            <DropdownMenuItem
              variant="destructive"
              disabled={user.isSelf}
              onClick={() =>
                setPending({
                  title: "Remove admin access?",
                  description: `${user.email} will no longer be able to open the admin area.`,
                  label: "Remove admin",
                  destructive: true,
                  run: () => setRoleAction(user.id, "USER"),
                })
              }
            >
              Remove admin
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() =>
                setPending({
                  title: "Make this user an admin?",
                  description: `${user.email} will see every user, all usage stats and revenue, and can change plans and roles.`,
                  label: "Make admin",
                  run: () => setRoleAction(user.id, "ADMIN"),
                })
              }
            >
              Make admin
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={pending?.title ?? ""}
        description={pending?.description ?? ""}
        confirmLabel={pending?.label ?? "Confirm"}
        destructive={pending?.destructive}
        onConfirm={() => pending && run(pending.run)}
      />
    </>
  );
}
