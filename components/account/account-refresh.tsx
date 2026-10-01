"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { refreshAccount } from "@/lib/account/client";

const MESSAGES: Record<string, string> = {
  deleted: "Your account and everything in it has been deleted.",
};

/**
 * After a server action signs the user out and redirects (account deleted, password changed), the
 * page arrives by client navigation — re-check the session so the header and stores drop the old user.
 */
export function AccountRefresh() {
  const params = useSearchParams();
  const flag = ["deleted", "changed", "reset"].find((k) => params.get(k) === "1");
  useEffect(() => {
    if (!flag) return;
    void refreshAccount();
    if (MESSAGES[flag]) toast.success(MESSAGES[flag]);
  }, [flag]);
  return null;
}
