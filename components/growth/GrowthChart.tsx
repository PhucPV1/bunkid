"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import type { CurvePoint } from "@/lib/rules/growth";
import type { ChartView } from "@/lib/rules/growthView";

const DAYS_PER_MONTH = 30.4375;
const number = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

const TONE = {
  accent: "var(--color-accent)",
  warn: "var(--color-warn)",
  danger: "var(--color-danger)",
} as const;

// Spec 2026-11-25 §5.4: the normal band (z −2 to +2) by sex, its median, and
// the baby's measurements joined by a line.
export function GrowthChart({
  band,
  points,
  last,
  to,
  unit,
  label,
}: {
  band: CurvePoint[];
  points: ChartView["points"];
  last: ChartView["last"];
  to: number;
  unit: string;
  label: string;
}) {
  const months = Math.round(to / DAYS_PER_MONTH);
  const every = months > 24 ? 6 : months > 12 ? 3 : 1;
  const ticks = Array.from({ length: Math.floor(months / every) + 1 }, (_, i) =>
    Math.round(i * every * DAYS_PER_MONTH),
  );
  const data = band.map((point) => ({
    day: point.day,
    range: [point.low, point.high],
    mid: point.mid,
  }));
  const end = band.at(-1);
  return (
    <div role="img" aria-label={label} className="relative h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
        >
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
          <Area
            dataKey="range"
            stroke="none"
            fill="var(--color-good)"
            fillOpacity={0.14}
            activeDot={false}
            isAnimationActive={false}
          />
          <Line
            dataKey="mid"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
            stroke="var(--color-good-ink)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
          <Line
            data={points}
            dataKey="value"
            activeDot={false}
            isAnimationActive={false}
            stroke={TONE.accent}
            strokeWidth={2.5}
            dot={{ r: 4.5, fill: TONE.accent, strokeWidth: 0 }}
          />
          {end && (
            <ReferenceDot
              x={end.day}
              y={(end.mid + end.high) / 2}
              r={0}
              label={{
                value: "Bình thường",
                position: "left",
                fontSize: 11,
                fontWeight: 600,
                fill: "var(--color-good-ink)",
              }}
            />
          )}
          {last && (
            <ReferenceDot
              x={last.day}
              y={last.value}
              r={6.5}
              fill={TONE[last.tone]}
              stroke="var(--color-glass-solid)"
              strokeWidth={2.5}
              label={{
                value: last.label,
                // An alert label sits under the dot, clear of the band above.
                position: last.tone === "accent" ? "top" : "bottom",
                fontSize: 13,
                fontWeight: 700,
                fill: "var(--color-ink)",
              }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      <span className="pointer-events-none absolute top-3 left-11 text-[11px] leading-none text-muted">
        Cao hơn chuẩn
      </span>
      <span className="pointer-events-none absolute right-3 bottom-11 text-[11px] leading-none text-muted">
        Thấp hơn chuẩn
      </span>
    </div>
  );
}
