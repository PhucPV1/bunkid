import type { LogType } from "./logDetails";
import type { InstantType } from "./quickEntry";
import type { BreastSide, RunningLog, TimerButton } from "./timer";

export type QuickActionGroup = "timer" | "quick" | "other";

export type QuickAction =
  | {
      key: string;
      label: string;
      kind: "timer";
      group: QuickActionGroup;
      category: LogType;
      button: TimerButton;
    }
  | {
      key: string;
      label: string;
      kind: "instant";
      group: QuickActionGroup;
      category: LogType;
      instant: InstantType;
    };

// Spec 2026-11-17 §3.3: the "+" sheet draws one titled block per group, in this order.
export const QUICK_ACTION_GROUPS: { group: QuickActionGroup; title: string }[] =
  [
    { group: "timer", title: "Bấm giờ" },
    { group: "quick", title: "Ghi nhanh" },
    { group: "other", title: "Khác" },
  ];

// Group by group, in the order the "+" sheet shows them. The home page's timer row
// (TimerButtons) takes the kind "timer" entries in this same order.
export const QUICK_ACTIONS: QuickAction[] = [
  {
    key: "breast-left",
    label: "Bú trái",
    kind: "timer",
    group: "timer",
    category: "breast",
    button: { type: "breast", side: "left" },
  },
  {
    key: "breast-right",
    label: "Bú phải",
    kind: "timer",
    group: "timer",
    category: "breast",
    button: { type: "breast", side: "right" },
  },
  {
    key: "sleep",
    label: "Ngủ",
    kind: "timer",
    group: "timer",
    category: "sleep",
    button: { type: "sleep" },
  },
  {
    key: "pump",
    label: "Hút sữa",
    kind: "timer",
    group: "timer",
    category: "pump",
    button: { type: "pump" },
  },
  {
    key: "tummy",
    label: "Nằm sấp",
    kind: "timer",
    group: "timer",
    category: "tummy",
    button: { type: "tummy" },
  },
  {
    key: "bottle",
    label: "Bú bình",
    kind: "instant",
    group: "quick",
    category: "bottle",
    instant: "bottle",
  },
  {
    key: "diaper",
    label: "Thay tã",
    kind: "instant",
    group: "quick",
    category: "diaper",
    instant: "diaper",
  },
  {
    key: "medicine",
    label: "Thuốc",
    kind: "instant",
    group: "quick",
    category: "medicine",
    instant: "medicine",
  },
  {
    key: "temperature",
    label: "Nhiệt độ",
    kind: "instant",
    group: "quick",
    category: "temperature",
    instant: "temperature",
  },
  {
    key: "solids",
    label: "Ăn dặm",
    kind: "instant",
    group: "other",
    category: "solids",
    instant: "solids",
  },
  {
    key: "water",
    label: "Uống nước",
    kind: "instant",
    group: "other",
    category: "water",
    instant: "water",
  },
  {
    key: "bath",
    label: "Tắm",
    kind: "instant",
    group: "other",
    category: "bath",
    instant: "bath",
  },
  {
    key: "note",
    label: "Ghi chú",
    kind: "instant",
    group: "other",
    category: "note",
    instant: "note",
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

// Spec 2026-11-17 §5.3: the label on the breast action of the suggested side.
export const NEXT_SIDE_LABEL = "Nên bú";

export function isSuggestedSide(
  action: QuickAction,
  side: BreastSide | null,
): boolean {
  return (
    side !== null &&
    action.kind === "timer" &&
    action.button.type === "breast" &&
    action.button.side === side
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
