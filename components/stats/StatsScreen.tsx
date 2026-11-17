"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { Glass } from "@/components/ui/Glass";
import { PageHeader } from "@/components/ui/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
import { NeedsNetwork, waitingForNetwork } from "@/components/ui/NeedsNetwork";
import { Skeleton } from "@/components/ui/Skeleton";
import { toVietnameseError } from "@/lib/data/errors";
import { useStatsLogs } from "@/lib/data/logs";
import { useLogsRealtime } from "@/lib/data/realtime";
import { useNow } from "@/lib/hooks/useNow";
import {
  chartRows,
  dailyStats,
  emptyStatsText,
  hasStatsData,
  STATS_TABS,
  statsFetchSince,
  type StatsTab,
} from "@/lib/rules/dailyStats";
import { vnDayRange } from "@/lib/rules/days";
import type { Baby } from "@/lib/supabase/rows";
import { StatsTable } from "./StatsTable";

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

const SERIES: Record<
  StatsTab,
  {
    primary: string;
    secondary: string | null;
    color: string;
    secondaryColor: string | null;
  }
> = {
  sleep: {
    primary: "Giờ ngủ",
    secondary: null,
    color: "var(--color-cat-sleep)",
    secondaryColor: null,
  },
  feed: {
    primary: "Số cữ bú",
    secondary: null,
    color: "var(--color-cat-feed)",
    secondaryColor: null,
  },
  diaper: {
    primary: "Tã ướt",
    secondary: "Tã bẩn",
    color: "var(--color-cat-diaper)",
    secondaryColor: "var(--color-muted)",
  },
  pump: {
    primary: "Sữa hút (ml)",
    secondary: null,
    color: "var(--color-cat-pump)",
    secondaryColor: null,
  },
  tummy: {
    primary: "Tummy (phút)",
    secondary: null,
    color: "var(--color-cat-tummy)",
    secondaryColor: null,
  },
  solids: {
    primary: "Bữa ăn dặm",
    secondary: null,
    color: "var(--color-cat-bottle)",
    secondaryColor: null,
  },
};

const RANGES = [
  { value: "7", label: "7 ngày" },
  { value: "14", label: "14 ngày" },
];

export function StatsScreen({ baby }: { baby: Baby }) {
  const now = useNow(60_000);
  useLogsRealtime(baby.id);
  const [tab, setTab] = useState<StatsTab>("sleep");
  const [range, setRange] = useState<7 | 14>(7);
  const days = vnDayRange(now, range);
  const logs = useStatsLogs(baby.id, statsFetchSince(days));
  const stats = dailyStats(logs.data ?? [], days, now);
  const series = SERIES[tab];

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      <PageHeader
        title="Thống kê"
        back={{ href: "/kham-pha", label: "Khám phá" }}
        action={
          <Segmented
            label="Khoảng thời gian"
            options={RANGES}
            value={String(range)}
            onChange={(value) => setRange(value === "14" ? 14 : 7)}
            className="w-[168px] shrink-0"
          />
        }
      />

      <ChipGroup
        label="Loại dữ liệu"
        options={STATS_TABS}
        value={tab}
        onChange={setTab}
      />

      {waitingForNetwork(logs) ? (
        <NeedsNetwork what="thống kê" />
      ) : logs.isPending ? (
        <Skeleton className="h-60" />
      ) : logs.isError && !logs.data ? (
        <ErrorCard
          message={toVietnameseError(logs.error)}
          onRetry={() => void logs.refetch()}
        />
      ) : (
        <>
          {hasStatsData(stats, tab) ? (
            <Glass className="p-3">
              <StatsChart
                rows={chartRows(stats, tab)}
                primaryName={series.primary}
                secondaryName={series.secondary}
                decimals={tab === "sleep"}
                color={series.color}
                secondaryColor={series.secondaryColor}
              />
            </Glass>
          ) : (
            <Glass className="p-6 text-center text-[15px] text-muted">
              {emptyStatsText(tab, range)}
            </Glass>
          )}
          <StatsTable stats={stats} tab={tab} now={now} />
          <p className="px-1 text-[13px] text-muted">
            Tính theo ngày lịch giờ Việt Nam. Hôm nay tính đến hiện tại.
          </p>
        </>
      )}
    </main>
  );
}
