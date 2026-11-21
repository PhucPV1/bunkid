"use client";

import {
  Bar,
  BarChart,
  type BarShapeProps,
  CartesianGrid,
  Legend,
  Rectangle,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyNorm } from "@/lib/rules/ratings";

// Colours come in as var(--color-…) strings so the chart follows the active theme.
export function StatsChart({
  rows,
  unit,
  norm,
  primaryName,
  secondaryName,
  decimals,
  color,
  secondaryColor,
}: {
  rows: { label: string; primary: number; secondary: number | null }[];
  unit: string;
  norm: DailyNorm | null;
  primaryName: string;
  secondaryName: string | null;
  decimals: boolean;
  color: string;
  secondaryColor: string | null;
}) {
  // Spec 2026-11-19 §8: the last row is today, which is not over yet, so its
  // bars are paler.
  const dayBar = (bar: BarShapeProps) => (
    <Rectangle
      {...bar}
      fillOpacity={bar.originalDataIndex === rows.length - 1 ? 0.45 : 1}
    />
  );
  return (
    <div className="relative h-60 w-full">
      {/* The unit sits in the chart's top margin, above the Y axis. */}
      <p className="absolute top-0 left-0 text-[12px] leading-4 text-muted">
        {unit}
      </p>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          margin={{ top: 24, right: 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            stroke="var(--color-muted)"
            strokeOpacity={0.4}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "var(--color-muted)" }}
            stroke="var(--color-muted)"
            interval={0}
          />
          <YAxis
            allowDecimals={decimals}
            width={32}
            tick={{ fontSize: 12, fill: "var(--color-muted)" }}
            stroke="var(--color-muted)"
          />
          <Tooltip
            formatter={(value) => Number(value).toLocaleString("vi-VN")}
            contentStyle={{
              background: "var(--color-glass-solid)",
              borderColor: "var(--color-line)",
              borderRadius: 16,
              color: "var(--color-ink)",
            }}
            itemStyle={{ color: "var(--color-ink)" }}
            cursor={{ fill: "var(--color-line)" }}
          />
          {secondaryName && (
            <Legend
              formatter={(value) => (
                <span style={{ color: "var(--color-ink)" }}>{value}</span>
              )}
            />
          )}
          {/* extendDomain: the Y axis always reaches the whole band or line. */}
          {norm && norm.max !== undefined && (
            <ReferenceArea
              y1={norm.min}
              y2={norm.max}
              fill="var(--color-good)"
              fillOpacity={0.12}
              ifOverflow="extendDomain"
            />
          )}
          {norm && norm.max === undefined && (
            <ReferenceLine
              y={norm.min}
              stroke="var(--color-good)"
              strokeDasharray="4 3"
              ifOverflow="extendDomain"
            />
          )}
          <Bar
            dataKey="primary"
            name={primaryName}
            fill={color}
            radius={[6, 6, 0, 0]}
            isAnimationActive={false}
            shape={dayBar}
          />
          {secondaryName && secondaryColor && (
            <Bar
              dataKey="secondary"
              name={secondaryName}
              fill={secondaryColor}
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
              shape={dayBar}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
