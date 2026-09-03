"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CategoryTotal } from "@/lib/analytics";
import { CATEGORY_COLORS } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface CategoryChartProps {
  data: CategoryTotal[];
}

export function CategoryChart({ data }: CategoryChartProps) {
  const chartData = data.filter((d) => d.total > 0);

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        No spending data to chart yet
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-center">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="total"
              nameKey="category"
              innerRadius="60%"
              outerRadius="90%"
              paddingAngle={2}
              stroke="none"
            >
              {chartData.map((entry) => (
                <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-2">
        {chartData.map((entry) => (
          <li key={entry.category} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-600">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[entry.category] }}
              />
              {entry.category}
            </span>
            <span className="font-medium text-slate-900">
              {formatCurrency(entry.total)}
              <span className="ml-1.5 text-xs font-normal text-slate-400">
                {entry.percentage.toFixed(0)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
