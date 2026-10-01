"use client";

import dynamic from "next/dynamic";

/** Recharts measures the DOM, so the chart renders on the client only. */
export const DailyChartLoader = dynamic(() => import("./daily-chart").then((m) => m.DailyChart), {
  ssr: false,
  loading: () => <div className="h-[19rem] animate-pulse rounded-lg bg-muted" />,
});
