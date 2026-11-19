import type { ReactNode } from "react";
import { PendingMark } from "@/components/sync/PendingMark";
import { Button } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { HintBadge } from "@/components/ui/HintBadge";
import { Icon } from "@/components/ui/Icon";
import {
  formatClock,
  formatMinutes,
  runningLabel,
  type HeroState,
} from "@/lib/rules/hero";
import { NEXT_SIDE_LABEL } from "@/lib/rules/quickActions";
import type { BreastSide, NextSide, TimerButton } from "@/lib/rules/timer";
import { formatVnTime } from "@/lib/rules/time";
import type { LogRow } from "@/lib/supabase/rows";
import {
  CATEGORY_CHIP,
  CATEGORY_RUNNING,
  categoryOf,
} from "@/lib/ui/categories";
import { cx } from "@/lib/ui/cx";
import type { IconName } from "@/lib/ui/icons";

const LABEL =
  "text-[13px] leading-[18px] font-semibold tracking-[0.04em] whitespace-nowrap uppercase";
const BIG =
  "font-semibold tracking-[-0.02em] whitespace-nowrap text-ink tabular-nums";
const BIG_40 = "text-[40px] leading-[44px]";
const BIG_32 = "text-[32px] leading-[38px]";
const SUB =
  "text-[13px] leading-[18px] whitespace-nowrap text-muted tabular-nums";
const MINUTE_MS = 60_000;
const LEFT: TimerButton = { type: "breast", side: "left" };
const RIGHT: TimerButton = { type: "breast", side: "right" };

// Spec 2026-11-19 §3.2: 56 px circle, three lines of text, a button if any.
function topRow(parts: {
  circle: string;
  icon: IconName;
  label: string;
  labelTone: string;
  big: string;
  bigSize: string;
  sub: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cx(
          "flex size-14 shrink-0 items-center justify-center rounded-full",
          parts.circle,
        )}
      >
        <Icon name={parts.icon} size={24} strokeWidth={2.2} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className={cx(LABEL, parts.labelTone)}>{parts.label}</span>
        <span className={cx(parts.bigSize, BIG)}>{parts.big}</span>
        {parts.sub}
      </div>
      {parts.action}
    </div>
  );
}

export function HeroCardView({
  state,
  now,
  who,
  pending,
  busy,
  onTimer,
  onStop,
  nextSide = null,
}: {
  state: HeroState<LogRow>;
  now: Date;
  who: string;
  pending: boolean;
  busy: boolean;
  onTimer: (button: TimerButton) => void;
  onStop: (log: LogRow) => void;
  // Spec 2026-11-17 §5.3: which side to offer first; null shows no hint.
  nextSide?: NextSide | null;
}) {
  if (state.kind === "none") return null;

  // Without a hint the button's only child stays the plain label.
  const feedButton = (button: TimerButton, side: BreastSide, text: string) => (
    <Button
      disabled={busy}
      className="relative"
      onClick={() => onTimer(button)}
    >
      {nextSide?.suggest === side ? (
        <>
          {text}
          <HintBadge className="-top-2 right-2">{NEXT_SIDE_LABEL}</HintBadge>
        </>
      ) : (
        text
      )}
    </Button>
  );
  const feedButtons = (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        {feedButton(LEFT, "left", "Bú trái")}
        {feedButton(RIGHT, "right", "Bú phải")}
      </div>
      {nextSide && (
        <span className="text-center text-[13px] leading-[18px] text-muted tabular-nums">
          Lần trước: {nextSide.last === "left" ? "trái" : "phải"} lúc{" "}
          {formatVnTime(new Date(nextSide.lastAt))}
        </span>
      )}
    </>
  );

  let top: ReactNode;
  let buttons: ReactNode = null;
  if (state.kind === "running") {
    const log = state.log;
    const breast = log.type === "breast";
    const category = categoryOf(log.type);
    const clock = formatClock(now.getTime() - Date.parse(log.started_at));
    const side = (log.details as { side?: unknown } | null)?.side;
    const stop = (
      <Button className="shrink-0" disabled={busy} onClick={() => onStop(log)}>
        Dừng
      </Button>
    );
    top = topRow({
      circle: cx(CATEGORY_RUNNING[category.token], "text-bg"),
      icon: category.icon,
      label: runningLabel(log),
      labelTone: "text-muted",
      big: clock,
      bigSize: clock.length > 5 ? BIG_32 : BIG_40,
      sub: (
        <span className={cx("flex items-center gap-1", SUB)}>
          <span className="truncate">{who}</span>
          <span className="shrink-0">
            · từ {formatVnTime(new Date(log.started_at))}
          </span>
          <PendingMark pending={pending} />
        </span>
      ),
      action: breast ? null : stop,
    });
    if (breast)
      buttons = (
        <div className="grid grid-cols-2 gap-2.5">
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => onTimer(side === "left" ? RIGHT : LEFT)}
          >
            Đổi bên
          </Button>
          {stop}
        </div>
      );
  } else if (state.kind === "overdue") {
    top = topRow({
      circle: "bg-warn-soft text-warn-ink",
      icon: "clock",
      label: "Trễ cữ bú",
      labelTone: "text-warn",
      big: formatMinutes(state.lateMinutes),
      bigSize: BIG_32,
      sub: <span className={SUB}>Dự kiến lúc {formatVnTime(state.due)}</span>,
    });
    buttons = feedButtons;
  } else if (state.kind === "awake") {
    const awake = now.getTime() - state.since.getTime();
    top = topRow({
      circle: CATEGORY_CHIP["cat-sleep"],
      icon: "sun",
      label: "Đang thức",
      labelTone: "text-muted",
      big: formatMinutes(Math.max(0, Math.floor(awake / MINUTE_MS))),
      bigSize: BIG_32,
      sub: <span className={SUB}>từ {formatVnTime(state.since)}</span>,
    });
  } else {
    top = (
      <span className="text-[17px] leading-[22px] font-semibold whitespace-nowrap text-ink">
        Chưa có cữ bú nào gần đây
      </span>
    );
    buttons = feedButtons;
  }

  return (
    <Glass
      as="section"
      radius="hero"
      className={cx(
        "flex flex-col gap-2.5 p-3.5 shadow-[0_10px_40px_rgb(0_0_0/0.10)] in-data-[theme=dark]:shadow-[0_10px_40px_rgb(0_0_0/0.40)] in-data-[theme=night]:shadow-none",
        state.kind === "overdue" && "border-warn!",
      )}
    >
      {top}
      {buttons}
    </Glass>
  );
}
