"use client";

import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  XAxis,
  YAxis,
} from "recharts";
import { PERCENTILE_LINES, type CurvePoint } from "@/lib/rules/growth";

const DAYS_PER_MONTH = 30.4375;
const number = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

// Spec §6.5: WHO P3–P97 lines by sex, with the baby's measurements as dots.
export function GrowthChart({
  curve,
  points,
  to,
  unit,
}: {
  curve: CurvePoint[];
  points: { day: number; value: number }[];
  to: number;
  unit: string;
}) {
  const months = Math.round(to / DAYS_PER_MONTH);
  const every = months > 24 ? 6 : months > 12 ? 3 : 1;
  const ticks = Array.from({ length: Math.floor(months / every) + 1 }, (_, i) =>
    Math.round(i * every * DAYS_PER_MONTH),
  );
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-muted)"
            strokeOpacity={0.3}
          />
          <XAxis
            type="number"
            dataKey="day"
            domain={[0, to]}
            ticks={ticks}
            tickFormatter={(day: number) =>
              `${Math.round(day / DAYS_PER_MONTH)}`
            }
            tick={{ fontSize: 12, fill: "var(--color-muted)" }}
            stroke="var(--color-muted)"
            label={{
              value: "tháng",
              position: "insideBottomRight",
              offset: -4,
              fontSize: 12,
              fill: "var(--color-muted)",
            }}
          />
          <YAxis
            type="number"
            domain={["auto", "auto"]}
            width={36}
            tickFormatter={(value: number) => number.format(value)}
            tick={{ fontSize: 12, fill: "var(--color-muted)" }}
            stroke="var(--color-muted)"
            label={{
              value: unit,
              angle: -90,
              position: "insideLeft",
              fontSize: 12,
              fill: "var(--color-muted)",
            }}
          />
          {PERCENTILE_LINES.map((line) => (
            <Line
              key={line.label}
              data={curve}
              dataKey={line.label}
              dot={false}
              isAnimationActive={false}
              stroke={
                line.z === 0 ? "var(--color-good-ink)" : "var(--color-muted)"
              }
              strokeWidth={line.z === 0 ? 2 : 1}
              strokeDasharray={Math.abs(line.z) > 1.5 ? "4 3" : undefined}
            />
          ))}
          <Scatter
            data={points}
            dataKey="value"
            fill="var(--color-accent)"
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
