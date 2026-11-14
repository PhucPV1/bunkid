"use client";

import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import {
  actionLabel,
  isActionRunning,
  QUICK_ACTIONS,
  type QuickAction,
} from "@/lib/rules/quickActions";
import type { RunningLog } from "@/lib/rules/timer";
import { CATEGORIES, type CategoryToken } from "@/lib/ui/categories";
import { cx } from "@/lib/ui/cx";
import { useQuickActions } from "./QuickActions";

const TINT: Record<CategoryToken, string> = {
  "cat-feed": "bg-cat-feed/15 text-cat-feed",
  "cat-bottle": "bg-cat-bottle/15 text-cat-bottle",
  "cat-sleep": "bg-cat-sleep/15 text-cat-sleep",
  "cat-diaper": "bg-cat-diaper/15 text-cat-diaper",
  "cat-pump": "bg-cat-pump/15 text-cat-pump",
  "cat-tummy": "bg-cat-tummy/15 text-cat-tummy",
  "cat-med": "bg-cat-med/15 text-cat-med",
  "cat-temp": "bg-cat-temp/15 text-cat-temp",
};

export function QuickActionGrid({
  running,
  onPick,
}: {
  running: RunningLog[];
  onPick: (action: QuickAction) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {QUICK_ACTIONS.map((action) => {
        const on = isActionRunning(action, running);
        const category = CATEGORIES[action.category];
        return (
          <button
            key={action.key}
            type="button"
            onClick={() => onPick(action)}
            className={cx(
              "relative flex h-[100px] flex-col items-center justify-center gap-2 rounded-[24px] bg-glass-solid/75 text-ink transition-transform duration-[120ms] active:scale-[0.97]",
              on ? "border-2 border-accent-text" : "border border-edge",
            )}
          >
            {action.kind === "timer" && (
              <span className="absolute top-2 right-2 text-muted">
                <Icon name="clock" size={14} strokeWidth={2.2} />
                <span className="sr-only">, bấm giờ</span>
              </span>
            )}
            <span
              className={cx(
                "flex size-11 items-center justify-center rounded-full",
                TINT[category.token],
              )}
            >
              <Icon name={category.icon} size={22} />
            </span>
            <span className="text-sm font-semibold">
              {actionLabel(action, running)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ActionSheetView({
  open,
  onClose,
  babyName,
  running,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  babyName: string;
  running: RunningLog[];
  onPick: (action: QuickAction) => void;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Ghi lại cho ${babyName}`}
      variant="floating"
    >
      <p className="mb-3 flex items-center gap-1.5 text-xs text-muted">
        <Icon name="clock" size={14} strokeWidth={2.2} />= bấm giờ
      </p>
      <QuickActionGrid running={running} onPick={onPick} />
    </Sheet>
  );
}

export function ActionSheet({
  open,
  onClose,
  babyName,
}: {
  open: boolean;
  onClose: () => void;
  babyName: string;
}) {
  const actions = useQuickActions();
  return (
    <ActionSheetView
      open={open}
      onClose={onClose}
      babyName={babyName}
      running={actions.running}
      onPick={(action) => {
        onClose();
        if (action.kind === "timer") actions.pressTimer(action.button);
        else actions.openInstant(action.instant);
      }}
    />
  );
}
