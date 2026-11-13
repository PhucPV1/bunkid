"use client";

import { useState } from "react";
import { useMembers } from "@/lib/data/family";
import { toVietnameseError } from "@/lib/data/errors";
import {
  toRunning,
  useRecentLogs,
  useStopTimer,
  useTimerPress,
} from "@/lib/data/logs";
import { useNow } from "@/lib/hooks/useNow";
import type { InstantType } from "@/lib/rules/quickEntry";
import { formatAgeVi } from "@/lib/rules/time";
import type { Baby, FamilyMember } from "@/lib/supabase/rows";
import { ActionGrid } from "./ActionGrid";
import { QuickEntrySheet } from "./QuickEntrySheet";
import { RecentList } from "./RecentList";
import { RunningCard } from "./RunningCard";

export function HomeScreen({
  baby,
  member,
}: {
  baby: Baby;
  member: FamilyMember;
}) {
  const now = useNow(1000);
  const logs = useRecentLogs(baby.id);
  const members = useMembers(baby.family_id);
  const press = useTimerPress(baby.id);
  const stop = useStopTimer(baby.id);
  const [sheet, setSheet] = useState<InstantType | null>(null);

  const rows = logs.data ?? [];
  const runningRows = rows.filter((row) => row.ended_at === null);
  const finishedRows = rows.filter((row) => row.ended_at !== null);
  const running = toRunning(rows);
  const nameOf = (userId: string) =>
    members.data?.find((m) => m.user_id === userId)?.display_name ?? "Ai đó";
  const error = press.error ?? stop.error;

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <header>
        <h1 className="text-2xl font-semibold">{baby.name}</h1>
        <p className="text-neutral-500">
          {formatAgeVi(baby.dob, now)} · Xin chào {member.display_name}
        </p>
      </header>

      <ActionGrid
        running={running}
        busy={press.isPending}
        onTimer={(button) => press.mutate({ running, button })}
        onInstant={setSheet}
      />

      {error && (
        <p role="alert" className="text-red-600">
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
          onStop={() => stop.mutate(log.id)}
        />
      ))}

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">24 giờ qua</h2>
        {logs.isError ? (
          <p className="text-red-600">{toVietnameseError(logs.error)}</p>
        ) : (
          <RecentList logs={finishedRows} now={now} nameOf={nameOf} />
        )}
      </section>

      {sheet && (
        <QuickEntrySheet
          type={sheet}
          babyId={baby.id}
          onClose={() => setSheet(null)}
        />
      )}
    </main>
  );
}
