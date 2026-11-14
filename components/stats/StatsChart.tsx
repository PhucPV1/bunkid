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
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={0} />
          <YAxis allowDecimals={decimals} width={32} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value) => Number(value).toLocaleString("vi-VN")}
          />
          {secondaryName && <Legend />}
          <Bar
            dataKey="primary"
            name={primaryName}
            fill="#ec4899"
            radius={[6, 6, 0, 0]}
            isAnimationActive={false}
          />
          {secondaryName && (
            <Bar
              dataKey="secondary"
              name={secondaryName}
              fill="#a16207"
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
