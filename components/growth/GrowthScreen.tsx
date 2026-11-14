"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { PendingMark } from "@/components/sync/PendingMark";
import { whoSex, type LmsRow, type WhoIndicator } from "@/lib/content/who";
import { toVietnameseError } from "@/lib/data/errors";
import { useGrowth, useWhoTable } from "@/lib/data/growth";
import { entriesFor, pendingRowIds } from "@/lib/data/outboxCore";
import { useOutboxEntries } from "@/lib/hooks/useOutboxEntries";
import { assess, curve, type Assessment } from "@/lib/rules/growth";
import {
  chartRange,
  formatGrowthValue,
  formatPercentile,
  formatZ,
  indicatorValue,
  INDICATORS,
} from "@/lib/rules/growthForm";
import { ageDays, formatAgeVi } from "@/lib/rules/time";
import type { Baby, GrowthRow } from "@/lib/supabase/rows";
import { GrowthSheet } from "./GrowthSheet";

function ChartUnavailable() {
  return <p className="h-72 text-muted">Biểu đồ cần mạng để tải lần đầu.</p>;
}

const GrowthChart = dynamic(
  () =>
    import("./GrowthChart")
      .then((m) => m.GrowthChart)
      .catch(() => ChartUnavailable),
  { ssr: false, loading: () => <div className="h-72" /> },
);

const LEVEL_CLASS = {
  green: "bg-good-soft text-good-ink",
  yellow: "bg-warn-soft text-warn-ink",
  red: "bg-danger-soft text-danger-ink",
} as const;

export function GrowthScreen({
  baby,
  userId,
  isOwner,
}: {
  baby: Baby;
  userId: string;
  isOwner: boolean;
}) {
  const growth = useGrowth(baby.id);
  const sex = whoSex(baby.sex);
  const [indicator, setIndicator] = useState<WhoIndicator>("wfa");
  const table = useWhoTable(indicator, sex);
  const pending = pendingRowIds(entriesFor(useOutboxEntries(userId), "growth"));
  const [sheet, setSheet] = useState<{ row: GrowthRow | null } | null>(null);

  const rows = growth.data ?? [];
  const lms = table.data?.rows as LmsRow[] | undefined;
  const range = chartRange(ageDays(baby.dob, new Date()));
  const current = INDICATORS.find((i) => i.key === indicator)!;
  const points = rows.flatMap((row) => {
    const value = indicatorValue(row, indicator);
    const days = Math.round(
      (Date.parse(row.measured_on) - Date.parse(baby.dob)) / 86_400_000,
    );
    return value === null ? [] : [{ day: days, value }];
  });
  const canEdit = (row: GrowthRow) => isOwner || row.created_by === userId;

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Tăng trưởng</h1>
      <button
        type="button"
        onClick={() => setSheet({ row: null })}
        className="min-h-12 rounded-2xl bg-accent text-on-accent"
      >
        + Thêm lần đo
      </button>
      <div role="tablist" className="flex gap-2">
        {INDICATORS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={item.key === indicator}
            onClick={() => setIndicator(item.key)}
            className={`min-h-11 flex-1 rounded-xl border ${item.key === indicator ? "border-accent bg-accent-soft text-accent-ink" : ""}`}
          >
            {item.title}
          </button>
        ))}
      </div>
      {lms ? (
        <GrowthChart
          curve={curve(lms, 0, range.to, range.step)}
          points={points}
          to={range.to}
          unit={indicator === "wfa" ? "kg" : "cm"}
        />
      ) : table.isError ? (
        <ChartUnavailable />
      ) : (
        <div className="h-72" />
      )}
      <p className="text-sm text-muted">
        Đường WHO P3, P15, P50 (đậm), P85, P97 cho{" "}
        {sex === "girls" ? "bé gái" : "bé trai"}; chấm là các lần đo của bé.
        Nguồn: WHO Child Growth Standards.
      </p>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Các lần đo</h2>
        {growth.isError && !growth.data && (
          <p role="alert" className="text-danger">
            {toVietnameseError(growth.error)}
          </p>
        )}
        {growth.data && rows.length === 0 && (
          <p className="text-muted">Chưa có lần đo nào.</p>
        )}
        {rows.length > 0 && (
          <ul className="divide-y rounded-2xl border">
            {rows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  disabled={!canEdit(row)}
                  onClick={() => setSheet({ row })}
                  className="flex min-h-12 w-full flex-col gap-1 px-4 py-2 text-left disabled:opacity-100"
                >
                  <span className="font-medium">
                    {row.measured_on.split("-").reverse().join("/")} ·{" "}
                    {formatAgeVi(
                      baby.dob,
                      new Date(`${row.measured_on}T05:00:00Z`),
                    )}{" "}
                    <PendingMark pending={pending.has(row.id)} />
                  </span>
                  {INDICATORS.map((item) => {
                    const value = indicatorValue(row, item.key);
                    if (value === null) return null;
                    // undefined: table not loaded yet; null: outside 0..1856 days.
                    const result = lms
                      ? assess(lms, baby.dob, row.measured_on, value)
                      : undefined;
                    return (
                      <MeasureLine
                        key={item.key}
                        title={item.title}
                        text={formatGrowthValue(item.key, value)}
                        result={result}
                        shown={item.key === indicator}
                      />
                    );
                  })}
                </button>
              </li>
            ))}
          </ul>
        )}
        {rows.length > 0 && (
          <p className="text-sm text-muted">
            z-score và phân vị là của chỉ số đang chọn (
            {current.title.toLowerCase()}).
          </p>
        )}
      </section>
      {sheet && (
        <GrowthSheet
          babyId={baby.id}
          userId={userId}
          dob={baby.dob}
          row={sheet.row}
          canDelete={sheet.row ? canEdit(sheet.row) : false}
          onClose={() => setSheet(null)}
        />
      )}
    </main>
  );
}

function MeasureLine({
  title,
  text,
  result,
  shown,
}: {
  title: string;
  text: string;
  result: Assessment | null | undefined;
  shown: boolean;
}) {
  return (
    <span className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted">{title}:</span>
      <span>{text}</span>
      {shown &&
        result !== undefined &&
        (result ? (
          <span className={`rounded-full px-2 ${LEVEL_CLASS[result.level]}`}>
            z {formatZ(result.z)} · {formatPercentile(result.percentile)}
            {result.text ? ` · ${result.text}` : ""}
          </span>
        ) : (
          <span className="text-muted">Ngoài bảng WHO</span>
        ))}
    </span>
  );
}
