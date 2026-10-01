import { toast } from "sonner";
import { SyncError } from "@/lib/storage/synced-collection";

/** Toast for a failed save/delete; plan-limit errors link to the pricing page. */
export function showSaveError(error: unknown) {
  if (error instanceof SyncError && error.code === "limit") {
    toast.error(error.message, {
      // The toast lives outside the React tree, so it can't use the router.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      action: { label: "See plans", onClick: () => window.location.assign("/pricing") },
      duration: 10_000,
    });
    return;
  }
  toast.error(error instanceof Error ? error.message : "Couldn't save. Please try again.");
}
