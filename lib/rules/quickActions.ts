import type { LogType } from "./logDetails";
import type { InstantType } from "./quickEntry";
import type { RunningLog, TimerButton } from "./timer";

export type QuickAction =
  | {
      key: string;
      label: string;
      kind: "timer";
      category: LogType;
      button: TimerButton;
    }
  | {
      key: string;
      label: string;
      kind: "instant";
      category: LogType;
      instant: InstantType;
    };

// Spec §6.3: 3×3 grid, row by row.
export const QUICK_ACTIONS: QuickAction[] = [
  {
    key: "breast-left",
    label: "Bú trái",
    kind: "timer",
    category: "breast",
    button: { type: "breast", side: "left" },
  },
  {
    key: "breast-right",
    label: "Bú phải",
    kind: "timer",
    category: "breast",
    button: { type: "breast", side: "right" },
  },
  {
    key: "bottle",
    label: "Bú bình",
    kind: "instant",
    category: "bottle",
    instant: "bottle",
  },
  {
    key: "sleep",
    label: "Ngủ",
    kind: "timer",
    category: "sleep",
    button: { type: "sleep" },
  },
  {
    key: "diaper",
    label: "Thay tã",
    kind: "instant",
    category: "diaper",
    instant: "diaper",
  },
  {
    key: "pump",
    label: "Hút sữa",
    kind: "timer",
    category: "pump",
    button: { type: "pump" },
  },
  {
    key: "medicine",
    label: "Thuốc",
    kind: "instant",
    category: "medicine",
    instant: "medicine",
  },
  {
    key: "temperature",
    label: "Nhiệt độ",
    kind: "instant",
    category: "temperature",
    instant: "temperature",
  },
  {
    key: "tummy",
    label: "Nằm sấp",
    kind: "timer",
    category: "tummy",
    button: { type: "tummy" },
  },
];

export function isActionRunning(
  action: QuickAction,
  running: RunningLog[],
): boolean {
  if (action.kind !== "timer") return false;
  const button = action.button;
  return running.some(
    (log) =>
      log.type === button.type &&
      (button.type !== "breast" || log.details.side === button.side),
  );
}

export function actionLabel(
  action: QuickAction,
  running: RunningLog[],
): string {
  return isActionRunning(action, running)
    ? `Dừng ${action.label.toLowerCase()}`
    : action.label;
}

// Only whoever may edit the log is asked for ml (RLS: the owner or the log's creator).
export function shouldAskPumpAmounts(
  log: { type: string; created_by: string },
  member: { role: string },
  userId: string,
): boolean {
  return (
    log.type === "pump" &&
    (member.role === "owner" || log.created_by === userId)
  );
}
