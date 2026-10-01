"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatINR } from "@/lib/format";

// Single-series magnitude charts: one hue, identity comes from the axis labels (no legend needed).
const FILL = "var(--chart-1)";

const compactINR = (v: number) =>
  v >= 1e7 ? `₹${(v / 1e7).toFixed(1)}Cr` : v >= 1e5 ? `₹${(v / 1e5).toFixed(1)}L` : v >= 1e3 ? `₹${(v / 1e3).toFixed(v >= 1e4 ? 0 : 1)}K` : `₹${Math.round(v)}`;

function TooltipBox({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{label}</p>
      <p className="tabular-nums text-muted-foreground">{formatINR(payload[0].value)}</p>
    </div>
  );
}

const axisTick = { fontSize: 12, fill: "var(--muted-foreground)" };

export function CategoryChart({ data }: { data: { label: string; amount: number }[] }) {
  return (
    <div style={{ height: Math.max(120, data.length * 40 + 20) }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barCategoryGap={8}>
          <CartesianGrid horizontal={false} stroke="var(--border)" />
          <XAxis type="number" tickFormatter={compactINR} tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis type="category" dataKey="label" width={84} tickLine={false} axisLine={false} tick={{ ...axisTick, fill: "var(--foreground)" }} />
          <Tooltip content={<TooltipBox />} cursor={{ fill: "var(--muted)" }} />
          <Bar dataKey="amount" fill={FILL} radius={[0, 4, 4, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TimeChart({ data, interval = 0 }: { data: { label: string; amount: number }[]; interval?: number | "preserveStartEnd" }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%">
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} interval={interval} minTickGap={8} />
          <YAxis tickFormatter={compactINR} tickLine={false} axisLine={false} width={52} tick={axisTick} allowDecimals={false} />
          <Tooltip content={<TooltipBox />} cursor={{ fill: "var(--muted)" }} />
          <Bar dataKey="amount" fill={FILL} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
