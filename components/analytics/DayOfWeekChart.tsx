"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { WeekdayStat } from "@/lib/insights";
import { formatCurrency } from "@/lib/utils";

interface DayOfWeekChartProps {
  data: WeekdayStat[];
}

export function DayOfWeekChart({ data }: DayOfWeekChartProps) {
  const hasData = data.some((d) => d.count > 0);
  if (!hasData) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-400">
        No spending data to chart yet
      </div>
    );
  }

  const maxWeekday = data.reduce((max, d) => (d.average > max.average ? d : max), data[0]);

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) => `$${value}`}
            width={48}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), "Average spend"]}
            contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
            cursor={{ fill: "#f1f5f9" }}
          />
          <Bar dataKey="average" radius={[6, 6, 0, 0]} maxBarSize={40} isAnimationActive={false}>
            {data.map((entry) => (
              <Cell key={entry.weekday} fill={entry.weekday === maxWeekday.weekday ? "#3f4fe3" : "#a3bbfc"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
