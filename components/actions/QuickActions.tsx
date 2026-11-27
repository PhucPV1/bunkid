"use client";

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { PumpSheet } from "@/components/home/PumpSheet";
import { QuickEntrySheet } from "@/components/home/QuickEntrySheet";
import { SymptomDaySheet } from "@/components/quick/SymptomDaySheet";
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
import { canModifyLog } from "@/lib/rules/history";
import type { LogType } from "@/lib/rules/logDetails";
import {
  ACTION_SHEET_CLOSED,
  actionSheetReducer,
  shouldAskPumpAmounts,
  type QuickActionGroup,
} from "@/lib/rules/quickActions";
import type { InstantType, QuickValues } from "@/lib/rules/quickEntry";
import { ageDays } from "@/lib/rules/time";
import {
  nextBreastSide,
  type BreastSide,
  type RunningLog,
  type TimerButton,
} from "@/lib/rules/timer";
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

// Spec 2026-11-27 §4.1: Triệu chứng opens the day sheet; every other type
// the quick-entry sheet with its time chips.
export function InstantSheet({
  sheet,
  baby,
  member,
  userId,
  rows,
  onSaved,
  onClose,
}: {
  sheet: { type: InstantType; initial?: QuickValues };
  baby: Baby;
  member: FamilyMember;
  userId: string;
  rows: LogRow[];
  onSaved: Parameters<typeof QuickEntrySheet>[0]["onSaved"];
  onClose: () => void;
}) {
  if (sheet.type === "symptom")
    return (
      <SymptomDaySheet
        baby={baby}
        userId={userId}
        canModify={(createdBy) => canModifyLog(member, createdBy)}
        onClose={onClose}
      />
    );
  return (
    <QuickEntrySheet
      type={sheet.type}
      initial={sheet.initial}
      recentLogs={rows}
      ageDays={ageDays(baby.dob, new Date())}
      babyId={baby.id}
      userId={userId}
      onSaved={onSaved}
      onClose={onClose}
    />
  );
}

export type QuickActionsValue = {
  running: RunningLog[];
  // The running timers as full rows, for the tab bar's timer tile
  // (spec 2026-11-19 §4).
  runningRows: LogRow[];
  // Spec 2026-11-17 §5.3: the breast side to label "Nên bú", or null.
  suggestSide: BreastSide | null;
  busy: boolean;
  error: Error | null;
  pressTimer: (button: TimerButton) => void;
  stopTimer: (log: LogRow) => void;
  openInstant: (type: InstantType, initial?: QuickValues) => void;
  // The "+" action sheet (spec §6.3), open from any page inside the provider.
  actionSheetOpen: boolean;
  // Spec 2026-11-19 §5.4: the groups it shows; all three when left out. From
  // onClick call `() => openActionSheet()`, or the event is taken for groups.
  actionSheetGroups?: QuickActionGroup[];
  openActionSheet: (groups?: QuickActionGroup[]) => void;
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
  const [actionSheet, dispatchActionSheet] = useReducer(
    actionSheetReducer,
    ACTION_SHEET_CLOSED,
  );
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
    runningRows: rows.filter((row) => row.ended_at === null),
    suggestSide: nextBreastSide(rows, new Date())?.suggest ?? null,
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
    actionSheetOpen: actionSheet.open,
    actionSheetGroups: actionSheet.groups,
    openActionSheet: (groups) => dispatchActionSheet({ type: "open", groups }),
    toggleActionSheet: () => dispatchActionSheet({ type: "toggle" }),
    closeActionSheet: () => dispatchActionSheet({ type: "close" }),
  };

  return (
    <QuickActionsContext.Provider value={value}>
      {children}
      {sheet && (
        <InstantSheet
          sheet={sheet}
          baby={baby}
          member={member}
          userId={userId}
          rows={rows}
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
