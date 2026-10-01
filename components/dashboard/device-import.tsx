"use client";

import { useRouter } from "next/navigation";
import { ALL_STORES } from "@/lib/sync/stores";
import { LocalDataNotice } from "@/components/account/local-data-notice";

/** Dashboard banner: move anything saved on this device before login into the account. */
export function DeviceImport() {
  const router = useRouter();
  return <LocalDataNotice stores={ALL_STORES} onImported={() => router.refresh()} />;
}
