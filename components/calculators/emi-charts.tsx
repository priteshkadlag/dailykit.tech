"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AmortizationYear } from "@/lib/calculations/emi";
import { formatINR } from "@/lib/format";

// Validated categorical pair (slots 1 & 2): principal is blue, interest is orange everywhere.
const PRINCIPAL = "var(--chart-1)";
const INTEREST = "var(--chart-2)";

const compactINR = (v: number) =>
  v >= 1e7 ? `₹${(v / 1e7).toFixed(1)}Cr` : v >= 1e5 ? `₹${(v / 1e5).toFixed(1)}L` : v >= 1e3 ? `₹${(v / 1e3).toFixed(0)}K` : `₹${v}`;

function TooltipBox({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string | number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      {label !== undefined && <p className="mb-1 font-medium">Year {label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 tabular-nums">
          <span className="size-2.5 rounded-sm" style={{ background: p.color }} aria-hidden />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="ml-auto pl-3 font-medium text-foreground">{formatINR(p.value, { whole: true })}</span>
        </p>
      ))}
    </div>
  );
}

export function EmiBreakupChart({ principal, interest, labels = ["Principal", "Interest"] }: { principal: number; interest: number; labels?: [string, string] }) {
  const data = [
    { name: labels[0], value: principal, color: PRINCIPAL },
    { name: labels[1], value: interest, color: INTEREST },
  ];
  const total = principal + interest;
  return (
    <figure className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-44 w-44 shrink-0" role="img" aria-label={`${labels[0]} ${formatINR(principal)}, ${labels[1].toLowerCase()} ${formatINR(interest)}`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="100%"
              stroke="var(--card)"
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<TooltipBox />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="w-full space-y-2 text-sm">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2">
            <span className="size-3 rounded-sm" style={{ background: d.color }} aria-hidden />
            <span>{d.name}</span>
            <span className="ml-auto font-medium tabular-nums">{formatINR(d.value, { whole: true })}</span>
            <span className="w-12 text-right text-muted-foreground tabular-nums">
              {total > 0 ? `${Math.round((d.value / total) * 100)}%` : "–"}
            </span>
          </div>
        ))}
      </figcaption>
    </figure>
  );
}

export function EmiYearlyChart({ yearly }: { yearly: AmortizationYear[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={yearly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%">
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
          <YAxis
            tickFormatter={compactINR}
            tickLine={false}
            axisLine={false}
            width={56}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          />
          <Tooltip content={<TooltipBox />} cursor={{ fill: "var(--muted)" }} />
          <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="principal" name="Principal" stackId="a" fill={PRINCIPAL} stroke="var(--card)" strokeWidth={1} isAnimationActive={false} />
          <Bar
            dataKey="interest"
            name="Interest"
            stackId="a"
            fill={INTEREST}
            stroke="var(--card)"
            strokeWidth={1}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
