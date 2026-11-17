"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useQuickActions } from "@/components/actions/QuickActions";
import { Icon } from "@/components/ui/Icon";
import { useNow } from "@/lib/hooks/useNow";
import { showsTimerPill } from "@/lib/nav";
import { formatClock, timerLabel } from "@/lib/rules/hero";
import { pillTimer } from "@/lib/rules/timer";
import type { LogRow } from "@/lib/supabase/rows";
import { CATEGORY_CHIP, categoryOf } from "@/lib/ui/categories";
import { cx } from "@/lib/ui/cx";

// Spec 2026-11-17 §5.2 (drawing A1): the running timer, 8 px above the 62 px tab bar.
export function TimerPillView({
  log,
  more,
  now,
  busy,
  onStop,
}: {
  log: LogRow;
  more: number;
  now: Date;
  busy: boolean;
  onStop: () => void;
}) {
  const category = categoryOf(log.type);
  return (
    <div className="glass-strong fixed bottom-[calc(max(env(safe-area-inset-bottom)+10px,26px)+70px)] left-1/2 z-10 flex h-11 -translate-x-1/2 items-center overflow-hidden rounded-full shadow-[0_8px_22px_rgb(0_0_0/0.14)] in-data-[theme=night]:shadow-none print:hidden">
      <Link
        href="/"
        className="flex h-11 items-center gap-2 pr-3 pl-1.5 text-[15px] font-semibold whitespace-nowrap text-ink"
      >
        <span
          className={cx(
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            CATEGORY_CHIP[category.token],
          )}
        >
          <Icon name={category.icon} size={17} strokeWidth={2.2} />
        </span>
        <span>
          {timerLabel(log)} ·{" "}
          <span className="tabular-nums">
            {formatClock(now.getTime() - Date.parse(log.started_at))}
          </span>
        </span>
        {more > 0 && (
          <span className="rounded-full bg-ink/10 px-[7px] py-1 text-[11px] leading-[11px] font-bold">
            +{more}
          </span>
        )}
      </Link>
      <button
        type="button"
        disabled={busy}
        onClick={onStop}
        className="h-11 min-w-16 border-l border-line px-4 text-[15px] font-bold text-accent-text disabled:opacity-50"
      >
        Dừng
      </button>
    </div>
  );
}

// Only this component ticks every second, and only while the pill shows.
function LivePill({ log, more }: { log: LogRow; more: number }) {
  const actions = useQuickActions();
  const now = useNow(1000);
  // Tells globals.css to make room: the page padding and the toast both rise.
  useEffect(() => {
    document.documentElement.dataset.timerPill = "on";
    return () => {
      delete document.documentElement.dataset.timerPill;
    };
  }, []);
  return (
    <TimerPillView
      log={log}
      more={more}
      now={now}
      busy={actions.busy}
      onStop={() => actions.stopTimer(log)}
    />
  );
}

export function TimerPill() {
  const actions = useQuickActions();
  const pill = showsTimerPill(usePathname())
    ? pillTimer(actions.runningRows)
    : null;
  return pill ? <LivePill log={pill.log} more={pill.more} /> : null;
}
