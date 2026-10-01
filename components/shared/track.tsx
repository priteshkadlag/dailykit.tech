"use client";

import { useEffect } from "react";
import { trackOnce } from "@/lib/analytics/client";
import type { AnalyticsEventName } from "@/lib/analytics/events";

/** Records an anonymous event once per page view when it mounts. Renders nothing. */
export function TrackOnce({ event }: { event: AnalyticsEventName }) {
  useEffect(() => trackOnce(event), [event]);
  return null;
}
