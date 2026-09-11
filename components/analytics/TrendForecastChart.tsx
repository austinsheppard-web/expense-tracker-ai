"use client";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from "recharts";
import { ForecastMonthPoint } from "@/lib/forecast";
import { formatCurrency } from "@/lib/utils";

interface TrendForecastChartProps {
  data: ForecastMonthPoint[];
}

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload as ForecastMonthPoint;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-card-hover">
      <p className="font-semibold text-slate-900">{label}</p>
      {point.actual !== null && <p className="mt-1 text-slate-600">Actual: {formatCurrency(point.actual)}</p>}
      {point.actual === null && point.forecast !== null && (
        <>
          <p className="mt-1 text-slate-600">Forecast: {formatCurrency(point.forecast)}</p>
          {point.low !== null && point.high !== null && (
            <p className="text-slate-400">
              Typical range: {formatCurrency(point.low)}–{formatCurrency(point.high)}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export function TrendForecastChart({ data }: TrendForecastChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        No monthly trend data yet
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-brand-500" /> Actual
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full border-t-2 border-dashed border-brand-600" /> Forecast
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-brand-100" /> Typical range
        </span>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f1f5f9" }} />
            <Area
              dataKey={((entry: ForecastMonthPoint) =>
                entry.low !== null && entry.high !== null ? [entry.low, entry.high] : null) as unknown as string}
              stroke="none"
              fill="#c7d7fe"
              fillOpacity={0.5}
              isAnimationActive={false}
            />
            <Bar dataKey="actual" fill="#5871f0" radius={[6, 6, 0, 0]} maxBarSize={40} isAnimationActive={false} />
            <Line
              dataKey="forecast"
              stroke="#3f4fe3"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={{ r: 3, fill: "#3f4fe3" }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
