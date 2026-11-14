"use client";

import { useState } from "react";
import { useEmergencyContacts } from "@/lib/data/emergency";
import { toVietnameseError } from "@/lib/data/errors";
import { useMembers } from "@/lib/data/family";
import {
  toRunning,
  useFirstLogAt,
  useRecentLogs,
  useStopTimer,
  useTimerPress,
} from "@/lib/data/logs";
import { useLogsRealtime } from "@/lib/data/realtime";
import { entriesFor, pendingRowIds } from "@/lib/data/outboxCore";
import { useNow } from "@/lib/hooks/useNow";
import { useOutboxEntries } from "@/lib/hooks/useOutboxEntries";
import { homeAlerts, vitaminDToday } from "@/lib/rules/alerts";
import type { InstantType, QuickValues } from "@/lib/rules/quickEntry";
import { rateLast24h, WINDOW_MS, windowTotals } from "@/lib/rules/ratings";
import { homeStatusLines } from "@/lib/rules/status";
import { ageDays, formatAgeVi } from "@/lib/rules/time";
import type { Baby, FamilyMember } from "@/lib/supabase/rows";
import { ActionGrid } from "./ActionGrid";
import { AlertBanners } from "./AlertBanners";
import { PumpSheet } from "./PumpSheet";
import { QuickEntrySheet } from "./QuickEntrySheet";
import { RecentList } from "./RecentList";
import { RunningCard } from "./RunningCard";
import { StatusLines } from "./StatusLines";
import { SummaryCard } from "./SummaryCard";
import { VitaminDRow } from "./VitaminDRow";

type SheetState = { type: InstantType; initial?: QuickValues } | null;

const VITAMIN_D: QuickValues = {
  name: "Vitamin D",
  amount: "1",
  unit: "giọt",
  antipyretic: false,
};

export function HomeScreen({
  baby,
  member,
  userId,
}: {
  baby: Baby;
  member: FamilyMember;
  userId: string;
}) {
  const now = useNow(1000);
  useLogsRealtime(baby.id);
  const logs = useRecentLogs(baby.id);
  const firstLogAt = useFirstLogAt(baby.id);
  const members = useMembers(baby.family_id);
  // Loaded here too so /khan-cap has the family's numbers even when first opened offline.
  useEmergencyContacts(baby.family_id);
  const press = useTimerPress(baby.id, userId);
  const stop = useStopTimer(baby.id, userId);
  const pending = pendingRowIds(entriesFor(useOutboxEntries(userId), "logs"));
  const [sheet, setSheet] = useState<SheetState>(null);
  // Id of a pumping log that was just stopped: ask for ml (spec §6.13).
  const [pumpStopped, setPumpStopped] = useState<string | null>(null);
  // Only whoever may edit the log is asked (RLS: owner or the log's creator).
  const askPumpAmounts = (log: { id: string; created_by: string }) => {
    if (member.role === "owner" || log.created_by === userId)
      setPumpStopped(log.id);
  };

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
  const running = toRunning(rows);
  const nameOf = (userId: string) =>
    members.data?.find((m) => m.user_id === userId)?.display_name ?? "Ai đó";
  const error = press.error ?? stop.error;

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <AlertBanners alerts={alerts} />

      <header>
        <h1 className="text-2xl font-semibold">{baby.name}</h1>
        <p className="text-muted">
          {formatAgeVi(baby.dob, now)} · Xin chào {member.display_name}
        </p>
      </header>

      <StatusLines lines={statusLines} />

      <ActionGrid
        running={running}
        busy={press.isPending}
        onTimer={(button) => {
          const pump =
            button.type === "pump"
              ? runningRows.find((r) => r.type === "pump")
              : undefined;
          press.mutate(
            { running, button },
            { onSuccess: () => pump && askPumpAmounts(pump) },
          );
        }}
        onInstant={(type) => setSheet({ type })}
      />

      {error && (
        <p role="alert" className="text-danger">
          {toVietnameseError(error)}
        </p>
      )}

      {runningRows.map((log) => (
        <RunningCard
          key={log.id}
          log={log}
          who={nameOf(log.created_by)}
          now={now}
          busy={stop.isPending}
          onStop={() =>
            stop.mutate(log.id, {
              onSuccess: () => log.type === "pump" && askPumpAmounts(log),
            })
          }
          pending={pending.has(log.id)}
        />
      ))}

      <VitaminDRow
        doneAt={vitaminD}
        onRecord={() => setSheet({ type: "medicine", initial: VITAMIN_D })}
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

      {sheet && (
        <QuickEntrySheet
          type={sheet.type}
          initial={sheet.initial}
          recentLogs={rows}
          babyId={baby.id}
          userId={userId}
          onClose={() => setSheet(null)}
        />
      )}
      {pumpStopped && (
        <PumpSheet
          logId={pumpStopped}
          babyId={baby.id}
          userId={userId}
          onClose={() => setPumpStopped(null)}
        />
      )}
    </main>
  );
}
