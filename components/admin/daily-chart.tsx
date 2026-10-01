"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyPoint } from "@/lib/server/admin";
import { SegmentedControl } from "@/components/shared/form-fields";

// One metric at a time (never two y-scales): the control switches the single series.
const METRICS = {
  visitors: { label: "Active visitors", unit: "visitors" },
  opens: { label: "Tool opens", unit: "opens" },
  signups: { label: "Sign-ups", unit: "sign-ups" },
} as const;
type Metric = keyof typeof METRICS;

const axisTick = { fontSize: 12, fill: "var(--muted-foreground)" };

function TooltipBox({ active, payload, label, unit }: { active?: boolean; payload?: { value: number }[]; label?: string; unit: string }) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{format(parseISO(label), "EEE, d MMM")}</p>
      <p className="tabular-nums text-muted-foreground">
        {payload[0].value.toLocaleString("en-IN")} {unit}
      </p>
    </div>
  );
}

export function DailyChart({ data }: { data: DailyPoint[] }) {
  const [metric, setMetric] = useState<Metric>("visitors");
  const total = data.reduce((s, d) => s + d[metric], 0);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground tabular-nums">{total.toLocaleString("en-IN")}</span> {metric === "visitors" ? "visitor-days" : METRICS[metric].unit} in the last 30 days
        </p>
        <SegmentedControl
          label="Metric"
          hideLabel
          value={metric}
          onChange={setMetric}
          options={(Object.keys(METRICS) as Metric[]).map((m) => ({ value: m, label: METRICS[m].label }))}
        />
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%" accessibilityLayer>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="day" tickFormatter={(d: string) => format(parseISO(d), "d MMM")} tickLine={false} axisLine={false} tick={axisTick} minTickGap={16} />
            <YAxis tickLine={false} axisLine={false} width={40} tick={axisTick} allowDecimals={false} />
            <Tooltip content={<TooltipBox unit={METRICS[metric].unit} />} cursor={{ fill: "var(--muted)" }} />
            <Bar dataKey={metric} name={METRICS[metric].label} fill="var(--chart-1)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
