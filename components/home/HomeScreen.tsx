"use client";

import { useQuickActions } from "@/components/actions/QuickActions";
import { useEmergencyContacts } from "@/lib/data/emergency";
import { toVietnameseError } from "@/lib/data/errors";
import { useMembers } from "@/lib/data/family";
import { useFirstLogAt, useRecentLogs } from "@/lib/data/logs";
import { useLogsRealtime } from "@/lib/data/realtime";
import { entriesFor, pendingRowIds } from "@/lib/data/outboxCore";
import { useNow } from "@/lib/hooks/useNow";
import { useOutboxEntries } from "@/lib/hooks/useOutboxEntries";
import { homeAlerts, vitaminDToday } from "@/lib/rules/alerts";
import type { QuickValues } from "@/lib/rules/quickEntry";
import { rateLast24h, WINDOW_MS, windowTotals } from "@/lib/rules/ratings";
import { homeStatusLines } from "@/lib/rules/status";
import { ageDays, formatAgeVi } from "@/lib/rules/time";
import type { Baby } from "@/lib/supabase/rows";
import { ActionGrid } from "./ActionGrid";
import { AlertBanners } from "./AlertBanners";
import { HomeHeader } from "./HomeHeader";
import { RecentList } from "./RecentList";
import { RunningCard } from "./RunningCard";
import { StatusLines } from "./StatusLines";
import { SummaryCard } from "./SummaryCard";
import { VitaminDRow } from "./VitaminDRow";

const VITAMIN_D: QuickValues = {
  name: "Vitamin D",
  amount: "1",
  unit: "giọt",
  antipyretic: false,
};

export function HomeScreen({ baby, userId }: { baby: Baby; userId: string }) {
  const now = useNow(1000);
  useLogsRealtime(baby.id);
  const logs = useRecentLogs(baby.id);
  const firstLogAt = useFirstLogAt(baby.id);
  const members = useMembers(baby.family_id);
  // Loaded here too so /khan-cap has the family's numbers even when first opened offline.
  useEmergencyContacts(baby.family_id);
  const actions = useQuickActions();
  const pending = pendingRowIds(entriesFor(useOutboxEntries(userId), "logs"));

  const rows = logs.data ?? [];
  const age = ageDays(baby.dob, now);
  const ratings = rateLast24h({
    logs: rows,
    ageDays: age,
    firstLogAt: firstLogAt.data ?? null,
    now,
  });
  const alerts = homeAlerts({
    logs: rows,
    ageDays: age,
    wetDiapers: ratings.wetDiapers,
    triageAvailable: true,
    now,
  });
  const statusLines = homeStatusLines({
    logs: rows,
    feedIntervalMin: baby.feed_interval_min,
    now,
  });
  const totals = windowTotals(rows, now);
  const vitaminD = vitaminDToday(rows, now);
  const runningRows = rows.filter((row) => row.ended_at === null);
  const recentRows = rows.filter(
    (row) =>
      row.ended_at !== null &&
      Date.parse(row.started_at) >= now.getTime() - WINDOW_MS,
  );
  const nameOf = (userId: string) =>
    members.data?.find((m) => m.user_id === userId)?.display_name ?? "Ai đó";

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <HomeHeader name={baby.name} age={formatAgeVi(baby.dob, now)} />

      <AlertBanners alerts={alerts} />

      <StatusLines lines={statusLines} />

      <ActionGrid
        running={actions.running}
        busy={actions.busy}
        onTimer={actions.pressTimer}
        onInstant={(type) => actions.openInstant(type)}
      />

      {actions.error && (
        <p role="alert" className="text-danger">
          {toVietnameseError(actions.error)}
        </p>
      )}

      {runningRows.map((log) => (
        <RunningCard
          key={log.id}
          log={log}
          who={nameOf(log.created_by)}
          now={now}
          busy={actions.busy}
          onStop={() => actions.stopTimer(log)}
          pending={pending.has(log.id)}
        />
      ))}

      <VitaminDRow
        doneAt={vitaminD}
        onRecord={() => actions.openInstant("medicine", VITAMIN_D)}
      />

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">24 giờ qua</h2>
        <SummaryCard ratings={ratings} totals={totals} />
        {logs.isError && !logs.data ? (
          <p className="text-danger">{toVietnameseError(logs.error)}</p>
        ) : (
          <RecentList
            logs={recentRows}
            now={now}
            nameOf={nameOf}
            pending={pending}
          />
        )}
      </section>
    </main>
  );
}
