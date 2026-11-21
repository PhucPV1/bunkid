"use client";

import { HintBadge } from "@/components/ui/HintBadge";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import {
  actionLabel,
  isActionRunning,
  isSuggestedSide,
  NEXT_SIDE_LABEL,
  QUICK_ACTIONS,
  sheetGroups,
  type QuickAction,
  type QuickActionGroup,
} from "@/lib/rules/quickActions";
import type { BreastSide, RunningLog } from "@/lib/rules/timer";
import {
  CATEGORIES,
  CATEGORY_CHIP,
  CATEGORY_RUNNING,
  CATEGORY_TEXT,
} from "@/lib/ui/categories";
import { cx } from "@/lib/ui/cx";
import { useQuickActions } from "./QuickActions";

// Spec 2026-11-19 §5.4: one titled block per group. "Bấm giờ" is a row of five
// 58 px round buttons like the home page's timer row; the other groups are
// 84 px tiles, four to a row. Every label stays on one line at 375 px.
export function QuickActionGrid({
  running,
  onPick,
  suggestSide = null,
  groups,
}: {
  running: RunningLog[];
  onPick: (action: QuickAction) => void;
  // Spec 2026-11-17 §5.3: the breast side to label "Nên bú"; null shows no label.
  suggestSide?: BreastSide | null;
  // Draw only these groups; all three when left out.
  groups?: QuickActionGroup[];
}) {
  // Like TimerButtons: "Dừng …" is only read out, the label keeps the name.
  const roundButton = (action: QuickAction) => {
    const on = isActionRunning(action, running);
    const category = CATEGORIES[action.category];
    const suggested = isSuggestedSide(action, suggestSide);
    const label = actionLabel(action, running);
    return (
      <button
        key={action.key}
        type="button"
        aria-label={
          suggested ? `${label}, ${NEXT_SIDE_LABEL.toLowerCase()}` : label
        }
        onClick={() => onPick(action)}
        className="flex flex-col items-center gap-1.5 transition-transform duration-[120ms] active:scale-[0.97]"
      >
        <span
          className={cx(
            "relative flex size-[58px] items-center justify-center rounded-full",
            on
              ? `${CATEGORY_RUNNING[category.token]} text-bg`
              : `glass ${CATEGORY_TEXT[category.token]}`,
          )}
        >
          <Icon name={category.icon} size={24} strokeWidth={2.2} />
          {suggested && (
            <HintBadge className="-top-1.5 -right-2">
              {NEXT_SIDE_LABEL}
            </HintBadge>
          )}
        </span>
        <span
          className={cx(
            "text-xs leading-4",
            on ? "font-bold" : "font-medium",
            "whitespace-nowrap text-ink",
          )}
        >
          {action.label}
        </span>
      </button>
    );
  };
  const tile = (action: QuickAction) => {
    const category = CATEGORIES[action.category];
    return (
      <button
        key={action.key}
        type="button"
        onClick={() => onPick(action)}
        className="flex h-[84px] flex-col items-center justify-center gap-1.5 rounded-[20px] border border-edge bg-glass-solid/75 px-1 text-ink transition-transform duration-[120ms] active:scale-[0.97]"
      >
        <span
          className={cx(
            "flex size-[38px] shrink-0 items-center justify-center rounded-full",
            CATEGORY_CHIP[category.token],
          )}
        >
          <Icon name={category.icon} size={20} />
        </span>
        <span className="text-center text-xs leading-4 font-semibold whitespace-nowrap">
          {action.label}
        </span>
      </button>
    );
  };
  return (
    <div className="flex flex-col gap-4">
      {sheetGroups(groups).map(({ group, title }) => {
        const timers = group === "timer";
        return (
          <section key={group} className="flex flex-col gap-2">
            <h3 className="text-[13px] leading-[18px] font-semibold text-muted">
              {title}
            </h3>
            <div
              className={
                timers ? "grid grid-cols-5 gap-1" : "grid grid-cols-4 gap-2"
              }
            >
              {QUICK_ACTIONS.filter((action) => action.group === group).map(
                timers ? roundButton : tile,
              )}
            </div>
          </section>
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
  suggestSide = null,
  groups,
}: {
  open: boolean;
  onClose: () => void;
  babyName: string;
  running: RunningLog[];
  onPick: (action: QuickAction) => void;
  suggestSide?: BreastSide | null;
  groups?: QuickActionGroup[];
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
        groups={groups}
      />
    </Sheet>
  );
}

export function ActionSheet({
  open,
  onClose,
  babyName,
  groups,
}: {
  open: boolean;
  onClose: () => void;
  babyName: string;
  // Spec 2026-11-19 §5.4: e.g. ["other"] from the home page's "Khác" button.
  groups?: QuickActionGroup[];
}) {
  const actions = useQuickActions();
  return (
    <ActionSheetView
      open={open}
      onClose={onClose}
      babyName={babyName}
      running={actions.running}
      suggestSide={actions.suggestSide}
      groups={groups}
      onPick={(action) => {
        onClose();
        if (action.kind === "timer") actions.pressTimer(action.button);
        else actions.openInstant(action.instant);
      }}
    />
  );
}
