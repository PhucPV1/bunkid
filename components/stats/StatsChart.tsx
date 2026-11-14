"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Colours come in as var(--color-…) strings so the chart follows the active theme.
export function StatsChart({
  rows,
  primaryName,
  secondaryName,
  decimals,
  color,
  secondaryColor,
}: {
  rows: { label: string; primary: number; secondary: number | null }[];
  primaryName: string;
  secondaryName: string | null;
  decimals: boolean;
  color: string;
  secondaryColor: string | null;
}) {
  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
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
          <Bar
            dataKey="primary"
            name={primaryName}
            fill={color}
            radius={[6, 6, 0, 0]}
            isAnimationActive={false}
          />
          {secondaryName && secondaryColor && (
            <Bar
              dataKey="secondary"
              name={secondaryName}
              fill={secondaryColor}
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
