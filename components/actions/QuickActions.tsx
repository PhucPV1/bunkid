"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { PumpSheet } from "@/components/home/PumpSheet";
import { QuickEntrySheet } from "@/components/home/QuickEntrySheet";
import { useToast } from "@/components/ui/Toast";
import { toVietnameseError } from "@/lib/data/errors";
import {
  toRunning,
  useDeleteLog,
  useRecentLogs,
  useSaveLog,
  useStopTimer,
  useTimerPress,
} from "@/lib/data/logs";
import type { LogType } from "@/lib/rules/logDetails";
import { shouldAskPumpAmounts } from "@/lib/rules/quickActions";
import type { InstantType, QuickValues } from "@/lib/rules/quickEntry";
import type { RunningLog, TimerButton } from "@/lib/rules/timer";
import {
  canResume,
  instantToast,
  RESUME_BLOCKED,
  resumeBlocked,
  resumePatch,
  stopToast,
  stoppedOnly,
  UNDO_LABEL,
  undoFailedMessage,
  type UndoToast,
} from "@/lib/rules/undo";
import type { Baby, FamilyMember, LogRow } from "@/lib/supabase/rows";
import { tapFeedback } from "@/lib/ui/haptics";

export type QuickActionsValue = {
  running: RunningLog[];
  busy: boolean;
  error: Error | null;
  pressTimer: (button: TimerButton) => void;
  stopTimer: (log: LogRow) => void;
  openInstant: (type: InstantType, initial?: QuickValues) => void;
  // The "+" action sheet (spec §6.3), open from any page inside the provider.
  actionSheetOpen: boolean;
  openActionSheet: () => void;
  toggleActionSheet: () => void;
  closeActionSheet: () => void;
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
  const remove = useDeleteLog(baby.id, userId);
  const resume = useSaveLog(baby.id, userId);
  const toast = useToast();
  const [sheet, setSheet] = useState<{
    type: InstantType;
    initial?: QuickValues;
  } | null>(null);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  // Id of a pumping log that was just stopped: ask for ml (spec gốc §6.13).
  const [pumpStopped, setPumpStopped] = useState<string | null>(null);
  // Spec §7.4: the Undo toast for that stop waits until the ml sheet closes.
  const [heldToast, setHeldToast] = useState<UndoToast | null>(null);

  const rows = logs.data ?? [];
  const running = toRunning(rows);
  // Timers running when Undo is pressed, which can be later than when the toast appeared.
  const runningNow = useRef(running);
  useEffect(() => {
    runningNow.current = running;
  });

  function showUndo(item: UndoToast) {
    const undo = item.undo;
    toast(item.message, {
      label: UNDO_LABEL,
      onAction: () => {
        const onError = (error: unknown) =>
          toast(undoFailedMessage(toVietnameseError(error)));
        if (undo.kind === "delete") remove.mutate(undo.id, { onError });
        else if (resumeBlocked(runningNow.current, undo.log))
          toast(undoFailedMessage(RESUME_BLOCKED));
        else
          resume.mutate(
            {
              id: undo.log.id,
              type: undo.log.type as LogType,
              patch: resumePatch(undo.log),
            },
            { onError },
          );
      },
    });
  }

  function afterStop(log: LogRow) {
    const item = stopToast(log, new Date());
    if (shouldAskPumpAmounts(log, member, userId)) {
      setPumpStopped(log.id);
      setHeldToast(item);
    } else if (canResume(log, member, userId)) showUndo(item);
    else toast(item.message);
  }

  const value: QuickActionsValue = {
    running,
    busy: press.isPending || stop.isPending,
    error: press.error ?? stop.error,
    pressTimer: (button) => {
      tapFeedback();
      // Undo only when this press just stops a timer (spec §7.4).
      const stoppedId = stoppedOnly(running, button);
      const stopped = rows.find((row) => row.id === stoppedId);
      press.mutate(
        { running, button },
        {
          onSuccess: () => {
            if (stopped) afterStop(stopped);
          },
        },
      );
    },
    stopTimer: (log) =>
      stop.mutate(log.id, { onSuccess: () => afterStop(log) }),
    openInstant: (type, initial) => setSheet({ type, initial }),
    actionSheetOpen,
    openActionSheet: () => setActionSheetOpen(true),
    toggleActionSheet: () => setActionSheetOpen((open) => !open),
    closeActionSheet: () => setActionSheetOpen(false),
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
          onSaved={(saved) => showUndo(instantToast(saved))}
          onClose={() => setSheet(null)}
        />
      )}
      {pumpStopped && (
        <PumpSheet
          logId={pumpStopped}
          babyId={baby.id}
          userId={userId}
          onClose={() => {
            setPumpStopped(null);
            if (heldToast) {
              showUndo(heldToast);
              setHeldToast(null);
            }
          }}
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
