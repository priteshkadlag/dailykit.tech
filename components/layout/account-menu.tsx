"use client";

import Link from "next/link";
import { LogOut, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAccount } from "@/lib/account/client";
import { signOutAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function initials(name: string | null, email: string) {
  const source = name?.trim() || email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[1][0] : "")).toUpperCase() || "U";
}

export async function signOutAndReload() {
  try {
    await signOutAction();
  } catch {
    toast.error("Couldn't log out. Please try again.");
    return;
  }
  // Full reload so no signed-in data stays in memory.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload drops the signed-in state held in memory
  window.location.assign("/");
}

/**
 * Nothing for guests (login, registration and the dashboard are hidden from the site);
 * a small avatar menu for anyone already signed in, e.g. an admin who went to /login directly.
 */
export function AccountMenu() {
  const account = useAccount();

  if (account.status !== "user") return null;

  const { user } = account;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" className="h-10 gap-2 rounded-full px-1.5 sm:pr-3" aria-label={`Account menu for ${user.name ?? user.email}`} />}
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{initials(user.name, user.email)}</span>
        <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">{user.name?.split(" ")[0] ?? "Account"}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="space-y-0.5 py-2">
            <span className="block truncate text-sm font-medium text-foreground">{user.name ?? "Your account"}</span>
            <span className="block truncate text-xs font-normal">{user.email}</span>
            <span className={cn("mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold", user.plan === "PRO" ? "bg-amber-100 text-amber-900" : "bg-muted text-muted-foreground")}>
              {user.plan === "PRO" ? "Pro plan" : "Free plan"}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {user.role === "ADMIN" && (
          <DropdownMenuItem render={<Link href="/admin" />} className="min-h-9">
            <Shield /> Admin
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOutAndReload} className="min-h-9">
          <LogOut /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
