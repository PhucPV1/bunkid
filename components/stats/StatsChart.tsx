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

export function StatsChart({
  rows,
  primaryName,
  secondaryName,
  decimals,
}: {
  rows: { label: string; primary: number; secondary: number | null }[];
  primaryName: string;
  secondaryName: string | null;
  decimals: boolean;
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
              background: "var(--color-surface)",
              borderColor: "var(--color-accent-line)",
              color: "var(--color-ink)",
            }}
            itemStyle={{ color: "var(--color-ink)" }}
            cursor={{ fill: "var(--color-soft)" }}
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
            fill="var(--color-accent)"
            radius={[6, 6, 0, 0]}
            isAnimationActive={false}
          />
          {secondaryName && (
            <Bar
              dataKey="secondary"
              name={secondaryName}
              fill="var(--color-warn-ink)"
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
