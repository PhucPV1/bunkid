"use client";

import { HintBadge } from "@/components/ui/HintBadge";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import {
  actionLabel,
  isActionRunning,
  isSuggestedSide,
  NEXT_SIDE_LABEL,
  QUICK_ACTION_GROUPS,
  QUICK_ACTIONS,
  type QuickAction,
} from "@/lib/rules/quickActions";
import type { BreastSide, RunningLog } from "@/lib/rules/timer";
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

// Spec 2026-11-17 §3.3: one titled block per group, four 84 px tiles to a row.
export function QuickActionGrid({
  running,
  onPick,
  suggestSide = null,
}: {
  running: RunningLog[];
  onPick: (action: QuickAction) => void;
  // Spec 2026-11-17 §5.3: the breast side to label "Nên bú"; null shows no label.
  suggestSide?: BreastSide | null;
}) {
  return (
    <div className="flex flex-col gap-4">
      {QUICK_ACTION_GROUPS.map(({ group, title }) => (
        <section key={group} className="flex flex-col gap-2">
          <h3 className="text-[13px] leading-[18px] font-semibold text-muted">
            {title}
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_ACTIONS.filter((action) => action.group === group).map(
              (action) => {
                const on = isActionRunning(action, running);
                const category = CATEGORIES[action.category];
                return (
                  <button
                    key={action.key}
                    type="button"
                    onClick={() => onPick(action)}
                    className={cx(
                      "relative flex h-[84px] flex-col items-center justify-center gap-1.5 rounded-[20px] bg-glass-solid/75 px-1 text-ink transition-transform duration-[120ms] active:scale-[0.97]",
                      on ? "border-2 border-accent-text" : "border border-edge",
                    )}
                  >
                    {isSuggestedSide(action, suggestSide) && (
                      <HintBadge className="-top-1.5 -right-1">
                        {NEXT_SIDE_LABEL}
                      </HintBadge>
                    )}
                    <span
                      className={cx(
                        "flex size-[38px] shrink-0 items-center justify-center rounded-full",
                        TINT[category.token],
                      )}
                    >
                      <Icon name={category.icon} size={20} />
                    </span>
                    <span className="text-center text-xs leading-4 font-semibold">
                      {actionLabel(action, running)}
                    </span>
                  </button>
                );
              },
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

export function ActionSheetView({
  open,
  onClose,
  babyName,
  running,
  onPick,
  suggestSide = null,
}: {
  open: boolean;
  onClose: () => void;
  babyName: string;
  running: RunningLog[];
  onPick: (action: QuickAction) => void;
  suggestSide?: BreastSide | null;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Ghi lại cho ${babyName}`}
      variant="floating"
    >
      <QuickActionGrid
        running={running}
        onPick={onPick}
        suggestSide={suggestSide}
      />
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
      suggestSide={actions.suggestSide}
      onPick={(action) => {
        onClose();
        if (action.kind === "timer") actions.pressTimer(action.button);
        else actions.openInstant(action.instant);
      }}
    />
  );
}
