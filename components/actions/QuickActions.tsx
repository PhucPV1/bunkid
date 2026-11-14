"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { PumpSheet } from "@/components/home/PumpSheet";
import { QuickEntrySheet } from "@/components/home/QuickEntrySheet";
import {
  toRunning,
  useRecentLogs,
  useStopTimer,
  useTimerPress,
} from "@/lib/data/logs";
import { shouldAskPumpAmounts } from "@/lib/rules/quickActions";
import type { InstantType, QuickValues } from "@/lib/rules/quickEntry";
import type { RunningLog, TimerButton } from "@/lib/rules/timer";
import type { Baby, FamilyMember, LogRow } from "@/lib/supabase/rows";

export type QuickActionsValue = {
  running: RunningLog[];
  busy: boolean;
  error: Error | null;
  pressTimer: (button: TimerButton) => void;
  stopTimer: (log: LogRow) => void;
  openInstant: (type: InstantType, initial?: QuickValues) => void;
};

const QuickActionsContext = createContext<QuickActionsValue | null>(null);

export function QuickActionsProvider({
  baby,
  member,
  userId,
  children,
}: {
  baby: Baby;
  member: FamilyMember;
  userId: string;
  children: ReactNode;
}) {
  const logs = useRecentLogs(baby.id);
  const press = useTimerPress(baby.id, userId);
  const stop = useStopTimer(baby.id, userId);
  const [sheet, setSheet] = useState<{
    type: InstantType;
    initial?: QuickValues;
  } | null>(null);
  // Id of a pumping log that was just stopped: ask for ml (spec gốc §6.13).
  const [pumpStopped, setPumpStopped] = useState<string | null>(null);

  const rows = logs.data ?? [];
  const running = toRunning(rows);

  function askPumpAmounts(log: {
    id: string;
    type: string;
    created_by: string;
  }) {
    if (shouldAskPumpAmounts(log, member, userId)) setPumpStopped(log.id);
  }

  const value: QuickActionsValue = {
    running,
    busy: press.isPending || stop.isPending,
    error: press.error ?? stop.error,
    pressTimer: (button) => {
      // Pressing Hút sữa while it runs stops it, so remember which log to ask ml for.
      const pump =
        button.type === "pump"
          ? rows.find((row) => row.type === "pump" && row.ended_at === null)
          : undefined;
      press.mutate(
        { running, button },
        {
          onSuccess: () => {
            if (pump) askPumpAmounts(pump);
          },
        },
      );
    },
    stopTimer: (log) =>
      stop.mutate(log.id, { onSuccess: () => askPumpAmounts(log) }),
    openInstant: (type, initial) => setSheet({ type, initial }),
  };

  return (
    <QuickActionsContext.Provider value={value}>
      {children}
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
    </QuickActionsContext.Provider>
  );
}

export function useQuickActions(): QuickActionsValue {
  const value = useContext(QuickActionsContext);
  if (!value)
    throw new Error("useQuickActions must be used inside QuickActionsProvider");
  return value;
}
