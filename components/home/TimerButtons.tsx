import { HintBadge } from "@/components/ui/HintBadge";
import { Icon } from "@/components/ui/Icon";
import {
  actionLabel,
  isActionRunning,
  isSuggestedSide,
  NEXT_SIDE_LABEL,
  QUICK_ACTIONS,
  type QuickAction,
} from "@/lib/rules/quickActions";
import type { BreastSide, RunningLog, TimerButton } from "@/lib/rules/timer";
import { CATEGORIES, type CategoryToken } from "@/lib/ui/categories";
import { cx } from "@/lib/ui/cx";
import { GROUP_LABEL } from "./sectionTitle";

type TimerAction = Extract<QuickAction, { kind: "timer" }>;

// Bú trái, Bú phải, Ngủ, Hút sữa, Nằm sấp: the order of QUICK_ACTIONS.
const TIMER_ACTIONS = QUICK_ACTIONS.filter(
  (action): action is TimerAction => action.kind === "timer",
);

const RUNNING: Record<CategoryToken, string> = {
  "cat-feed": "bg-cat-feed ring-4 ring-cat-feed/30",
  "cat-bottle": "bg-cat-bottle ring-4 ring-cat-bottle/30",
  "cat-sleep": "bg-cat-sleep ring-4 ring-cat-sleep/30",
  "cat-diaper": "bg-cat-diaper ring-4 ring-cat-diaper/30",
  "cat-pump": "bg-cat-pump ring-4 ring-cat-pump/30",
  "cat-tummy": "bg-cat-tummy ring-4 ring-cat-tummy/30",
  "cat-med": "bg-cat-med ring-4 ring-cat-med/30",
  "cat-temp": "bg-cat-temp ring-4 ring-cat-temp/30",
};

const IDLE: Record<CategoryToken, string> = {
  "cat-feed": "text-cat-feed",
  "cat-bottle": "text-cat-bottle",
  "cat-sleep": "text-cat-sleep",
  "cat-diaper": "text-cat-diaper",
  "cat-pump": "text-cat-pump",
  "cat-tummy": "text-cat-tummy",
  "cat-med": "text-cat-med",
  "cat-temp": "text-cat-temp",
};

export function TimerButtons({
  running,
  busy,
  onTimer,
  suggestSide = null,
}: {
  running: RunningLog[];
  busy: boolean;
  onTimer: (button: TimerButton) => void;
  // Spec 2026-11-17 §5.3: the breast side to label "Nên bú"; null shows no label.
  suggestSide?: BreastSide | null;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className={GROUP_LABEL}>Bấm giờ</h2>
      <div className="grid grid-cols-5 gap-1">
        {TIMER_ACTIONS.map((action) => {
          const on = isActionRunning(action, running);
          const token = CATEGORIES[action.category].token;
          const suggested = isSuggestedSide(action, suggestSide);
          const label = actionLabel(action, running);
          return (
            <button
              key={action.key}
              type="button"
              disabled={busy}
              aria-label={
                suggested ? `${label}, ${NEXT_SIDE_LABEL.toLowerCase()}` : label
              }
              onClick={() => onTimer(action.button)}
              className="flex flex-col items-center gap-1.5 transition-transform duration-[120ms] active:scale-[0.97] disabled:opacity-50"
            >
              <span
                className={cx(
                  "relative flex size-[58px] items-center justify-center rounded-full",
                  on ? `${RUNNING[token]} text-bg` : `glass ${IDLE[token]}`,
                )}
              >
                <Icon
                  name={CATEGORIES[action.category].icon}
                  size={24}
                  strokeWidth={2.2}
                />
                {suggested && (
                  <HintBadge className="-top-1.5 -right-2">
                    {NEXT_SIDE_LABEL}
                  </HintBadge>
                )}
              </span>
              <span className="text-xs leading-4 font-medium text-ink">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
