"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CategoryMonthPoint } from "@/lib/insights";
import { CATEGORIES, CATEGORY_COLORS, Category } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface CategoryTrendChartProps {
  data: CategoryMonthPoint[];
}

export function CategoryTrendChart({ data }: CategoryTrendChartProps) {
  const activeCategories = CATEGORIES.filter((c) => data.some((point) => point.byCategory[c] > 0));

  if (data.length === 0 || activeCategories.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        No category history yet
      </div>
    );
  }

  const chartData = data.map((point) => ({ label: point.label, ...point.byCategory }));

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
        {activeCategories.map((category) => (
          <span key={category} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[category] }} />
            {category}
          </span>
        ))}
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
              width={56}
            />
            <Tooltip
              formatter={(value: number, name: string) => [formatCurrency(value), name]}
              contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
            />
            {activeCategories.map((category: Category) => (
              <Area
                key={category}
                type="monotone"
                dataKey={category}
                stackId="spend"
                stroke={CATEGORY_COLORS[category]}
                strokeWidth={1.5}
                fill={CATEGORY_COLORS[category]}
                fillOpacity={0.55}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
