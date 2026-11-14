"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { toVietnameseError } from "@/lib/data/errors";
import { useStatsLogs } from "@/lib/data/logs";
import { useLogsRealtime } from "@/lib/data/realtime";
import { useNow } from "@/lib/hooks/useNow";
import {
  chartRows,
  dailyStats,
  STATS_TABS,
  statsFetchSince,
  type DayStat,
  type StatsTab,
} from "@/lib/rules/dailyStats";
import { vnDayLabel, vnDayRange } from "@/lib/rules/days";
import { formatDuration } from "@/lib/rules/time";
import type { Baby } from "@/lib/supabase/rows";

function ChartUnavailable() {
  return <p className="h-60 text-muted">Biểu đồ cần mạng để tải lần đầu.</p>;
}

const StatsChart = dynamic(
  () =>
    import("./StatsChart")
      .then((m) => m.StatsChart)
      // Offline before the chart was ever loaded: keep the table, skip the chart.
      .catch(() => ChartUnavailable),
  { ssr: false, loading: () => <div className="h-60" /> },
);

const SERIES: Record<StatsTab, { primary: string; secondary: string | null }> =
  {
    sleep: { primary: "Giờ ngủ", secondary: null },
    feed: { primary: "Số cữ bú", secondary: null },
    diaper: { primary: "Tã ướt", secondary: "Tã bẩn" },
    pump: { primary: "Sữa hút (ml)", secondary: null },
    tummy: { primary: "Tummy (phút)", secondary: null },
  };

const COLUMNS: Record<
  StatsTab,
  { label: string; value: (s: DayStat) => string }[]
> = {
  sleep: [
    {
      label: "Giờ ngủ",
      value: (s) =>
        s.sleepMinutes === 0 ? "—" : formatDuration(s.sleepMinutes * 60_000),
    },
  ],
  feed: [
    { label: "Cữ bú", value: (s) => String(s.feeds) },
    { label: "Bình (ml)", value: (s) => String(s.bottleMl) },
  ],
  diaper: [
    { label: "Ướt", value: (s) => String(s.wetDiapers) },
    { label: "Bẩn", value: (s) => String(s.dirtyDiapers) },
  ],
  pump: [{ label: "Sữa hút (ml)", value: (s) => String(s.pumpMl) }],
  tummy: [
    {
      label: "Tummy",
      value: (s) =>
        s.tummyMinutes === 0 ? "—" : formatDuration(s.tummyMinutes * 60_000),
    },
  ],
};

export function StatsScreen({ baby }: { baby: Baby }) {
  const now = useNow(60_000);
  useLogsRealtime(baby.id);
  const [tab, setTab] = useState<StatsTab>("sleep");
  const [range, setRange] = useState<7 | 14>(7);
  const days = vnDayRange(now, range);
  const logs = useStatsLogs(baby.id, statsFetchSince(days));
  const stats = dailyStats(logs.data ?? [], days, now);
  const series = SERIES[tab];
  const pill = (active: boolean) =>
    `min-h-11 flex-1 rounded-full px-4 ${active ? "bg-accent text-on-accent" : "bg-soft"}`;

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <header className="flex items-center justify-between gap-3">
        <Link
          href="/tien-ich"
          className="flex min-h-11 items-center text-accent-ink"
        >
          ← Tiện ích
        </Link>
        <h1 className="text-2xl font-semibold">Thống kê</h1>
        <span className="w-16" />
      </header>

      <nav className="grid grid-cols-5 gap-1">
        {STATS_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            aria-pressed={tab === t.value}
            onClick={() => setTab(t.value)}
            className={`min-h-11 rounded-full px-1 text-sm ${tab === t.value ? "bg-accent text-on-accent" : "bg-soft"}`}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div className="flex gap-2">
        {([7, 14] as const).map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={range === n}
            onClick={() => setRange(n)}
            className={pill(range === n)}
          >
            {n} ngày
          </button>
        ))}
      </div>

      {logs.isError && !logs.data ? (
        <p role="alert" className="text-danger">
          {toVietnameseError(logs.error)}
        </p>
      ) : logs.isPending ? (
        <p className="h-60 text-muted">Đang tải…</p>
      ) : (
        <>
          <StatsChart
            rows={chartRows(stats, tab)}
            primaryName={series.primary}
            secondaryName={series.secondary}
            decimals={tab === "sleep"}
          />
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm text-muted">
                <th className="py-2 font-normal">Ngày</th>
                {COLUMNS[tab].map((c) => (
                  <th key={c.label} className="py-2 text-right font-normal">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {[...stats].reverse().map((s) => (
                <tr key={s.day}>
                  <td className="py-2">{vnDayLabel(s.day, now)}</td>
                  {COLUMNS[tab].map((c) => (
                    <td key={c.label} className="py-2 text-right tabular-nums">
                      {c.value(s)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-sm text-muted">
            Tính theo ngày lịch giờ Việt Nam. Hôm nay tính đến hiện tại.
          </p>
        </>
      )}
    </main>
  );
}
