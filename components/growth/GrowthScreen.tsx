"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { IconButton } from "@/components/ui/IconButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Popup } from "@/components/ui/Popup";
import { Segmented } from "@/components/ui/Segmented";
import { NeedsNetwork, waitingForNetwork } from "@/components/ui/NeedsNetwork";
import { Skeleton } from "@/components/ui/Skeleton";
import { whoSex, type LmsRow, type WhoIndicator } from "@/lib/content/who";
import { toVietnameseError } from "@/lib/data/errors";
import { useGrowth, useWhoTable } from "@/lib/data/growth";
import { entriesFor, pendingRowIds } from "@/lib/data/outboxCore";
import { useOutboxEntries } from "@/lib/hooks/useOutboxEntries";
import { formatDayShort } from "@/lib/rules/days";
import { curve } from "@/lib/rules/growth";
import {
  alertReason,
  type GrowthAlertKind,
  growthAlerts,
  type GrowthTables,
} from "@/lib/rules/growthAlerts";
import { chartRange, INDICATORS, latestGrowth } from "@/lib/rules/growthForm";
import {
  alertDots,
  chartView,
  defaultIndicator,
  indicatorSummaries,
  listRows,
  verdictHead,
} from "@/lib/rules/growthView";
import { goalLink } from "@/lib/rules/heightView";
import { ageDays, formatAgeVi } from "@/lib/rules/time";
import type { Baby, GrowthRow } from "@/lib/supabase/rows";
import { GrowthAlertCard } from "./GrowthAlertCard";
import { GrowthChartCard } from "./GrowthChartCard";
import { GrowthList } from "./GrowthList";
import { GrowthSheet } from "./GrowthSheet";
import { GrowthVerdict } from "./GrowthVerdict";
import { HeightGoalLink } from "@/components/height/HeightCards";

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
  const wfa = useWhoTable("wfa", sex);
  const lhfa = useWhoTable("lhfa", sex);
  const hcfa = useWhoTable("hcfa", sex);
  const queries = { wfa, lhfa, hcfa };
  // Spec 2026-11-25 §5.1: a table that has not loaded is left out, so its
  // indicator has no block in the verdict card and raises no alert yet.
  const tables: GrowthTables = {};
  for (const item of INDICATORS) {
    const data = queries[item.key].data;
    if (data) tables[item.key] = data.rows as LmsRow[];
  }
  const pending = pendingRowIds(entriesFor(useOutboxEntries(userId), "growth"));
  const [sheet, setSheet] = useState<{ row: GrowthRow | null } | null>(null);

  const rows = growth.data ?? [];
  // Spec 2026-11-25 §5.3: with no measurement at all the page is only its
  // header and the empty state. While they load, the picker and chart stay.
  const empty = growth.data !== undefined && rows.length === 0;
  const base = { rows, tables, dob: baby.dob, sex };
  const alerts = growthAlerts({ ...base, babyName: baby.name });
  const summaries = indicatorSummaries({ ...base, alerts });
  const latest = latestGrowth(rows);
  // Until the user picks one, the page shows the first indicator with an alert.
  const [picked, setPicked] = useState<WhoIndicator | null>(null);
  const indicator = picked ?? defaultIndicator(alerts);
  const [why, setWhy] = useState<GrowthAlertKind | null>(null);
  const dots = alertDots(alerts);
  const table = queries[indicator];
  const lms = tables[indicator];
  const range = chartRange(ageDays(baby.dob, new Date()));
  const chart = chartView({
    indicator,
    rows,
    dob: baby.dob,
    alerts,
    summaries,
  });
  const canEdit = (row: GrowthRow) => isOwner || row.created_by === userId;

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      <PageHeader
        title="Tăng trưởng"
        back={{ href: "/suc-khoe", label: "Sức khỏe" }}
        action={
          <IconButton
            label="Thêm lần đo"
            icon="plus"
            onClick={() => setSheet({ row: null })}
          />
        }
      />
      {alerts.map((alert) => (
        <GrowthAlertCard
          key={alert.indicator}
          alert={alert}
          onWhy={() => setWhy(alert.kind)}
        />
      ))}
      {latest && summaries.length > 0 && (
        <GrowthVerdict
          head={verdictHead({ babyName: baby.name, alerts, summaries })}
          measured={`Đo gần nhất ${formatDayShort(latest.measuredOn)} · ${formatAgeVi(baby.dob, new Date(`${latest.measuredOn}T05:00:00Z`))}`}
          summaries={summaries}
        />
      )}
      {/* Spec 2026-11-25 §5.3 item 4: also shown with no measurement yet. */}
      <HeightGoalLink
        link={goalLink({
          baby: {
            name: baby.name,
            dob: baby.dob,
            sex,
            father_height_cm: baby.father_height_cm,
            mother_height_cm: baby.mother_height_cm,
            target_height_cm: baby.target_height_cm,
          },
          rows: growth.data,
          table: tables.lhfa,
        })}
      />
      {!empty && (
        <>
          <Segmented
            label="Chỉ số"
            options={INDICATORS.map((item) => ({
              value: item.key,
              label: item.title,
              dot: dots[item.key],
            }))}
            value={indicator}
            onChange={setPicked}
          />
          <GrowthChartCard
            title={chart.title}
            babyName={baby.name}
            alertTone={chart.alertTone}
            shifted={chart.shifted}
          >
            {lms ? (
              <GrowthChart
                band={curve(lms, 0, range.to, range.step)}
                points={chart.points}
                last={chart.last}
                to={range.to}
                unit={chart.unit}
                label={chart.ariaLabel}
              />
            ) : table.isError ? (
              <ChartUnavailable />
            ) : (
              <Skeleton className="h-72" />
            )}
          </GrowthChartCard>
        </>
      )}
      {waitingForNetwork(growth) ? (
        <NeedsNetwork what="các lần đo" />
      ) : growth.isPending ? (
        <div className="flex flex-col gap-2.5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[60px]" />
          ))}
        </div>
      ) : growth.isError && !growth.data ? (
        <ErrorCard
          message={toVietnameseError(growth.error)}
          onRetry={() => void growth.refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="ruler"
          text="Chưa có lần đo nào."
          action={{
            label: "Thêm lần đo",
            onClick: () => setSheet({ row: null }),
          }}
        />
      ) : (
        <GrowthList
          items={listRows({ rows, tables, dob: baby.dob, alerts })}
          pending={pending}
          canEdit={canEdit}
          onOpen={(row) => setSheet({ row })}
        />
      )}
      {why && (
        <Popup title="Vì sao có cảnh báo này?" onClose={() => setWhy(null)}>
          {alertReason(why)}
        </Popup>
      )}
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
