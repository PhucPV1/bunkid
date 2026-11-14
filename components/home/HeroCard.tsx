import type { ReactNode } from "react";
import { PendingMark } from "@/components/sync/PendingMark";
import { Button } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { TimerRing } from "@/components/ui/TimerRing";
import {
  formatClock,
  formatMinutes,
  ringProgress,
  timerLabel,
  type HeroState,
} from "@/lib/rules/hero";
import type { LogType } from "@/lib/rules/logDetails";
import type { TimerButton } from "@/lib/rules/timer";
import { formatVnTime } from "@/lib/rules/time";
import type { LogRow } from "@/lib/supabase/rows";
import { CATEGORIES } from "@/lib/ui/categories";
import { cx } from "@/lib/ui/cx";

const LABEL =
  "text-[13px] leading-[18px] font-semibold tracking-[0.04em] uppercase";
const BIG =
  "text-[48px] leading-[52px] font-semibold tracking-[-0.02em] text-ink tabular-nums";
const BIG_LONG =
  "text-[38px] leading-[44px] font-semibold tracking-[-0.02em] text-ink tabular-nums";
const META = "text-[15px] text-muted tabular-nums";
const LEFT: TimerButton = { type: "breast", side: "left" };
const RIGHT: TimerButton = { type: "breast", side: "right" };

export function HeroCardView({
  state,
  now,
  who,
  sub,
  pending,
  busy,
  onTimer,
  onStop,
}: {
  state: HeroState<LogRow>;
  now: Date;
  who: string;
  sub: string | null;
  pending: boolean;
  busy: boolean;
  onTimer: (button: TimerButton) => void;
  onStop: (log: LogRow) => void;
}) {
  const feedButtons = (
    <div className="grid w-full grid-cols-2 gap-2.5">
      <Button disabled={busy} onClick={() => onTimer(LEFT)}>
        Bú trái
      </Button>
      <Button disabled={busy} onClick={() => onTimer(RIGHT)}>
        Bú phải
      </Button>
    </div>
  );

  let body: ReactNode;
  if (state.kind === "running") {
    const log = state.log;
    const elapsed = now.getTime() - Date.parse(log.started_at);
    const clock = formatClock(elapsed);
    const side = (log.details as { side?: unknown } | null)?.side;
    body = (
      <>
        <TimerRing
          token={CATEGORIES[log.type as LogType].token}
          progress={ringProgress(elapsed)}
        >
          <span className={cx(LABEL, "text-muted")}>
            {timerLabel(log)} <PendingMark pending={pending} />
          </span>
          <span className={clock.length > 5 ? BIG_LONG : BIG}>{clock}</span>
          <span className="text-[13px] leading-[18px] text-muted">
            {who} · từ {formatVnTime(new Date(log.started_at))}
          </span>
        </TimerRing>
        {log.type === "breast" ? (
          <div className="grid w-full grid-cols-2 gap-2.5">
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => onTimer(side === "left" ? RIGHT : LEFT)}
            >
              Đổi bên
            </Button>
            <Button disabled={busy} onClick={() => onStop(log)}>
              Dừng
            </Button>
          </div>
        ) : (
          <Button block disabled={busy} onClick={() => onStop(log)}>
            Dừng
          </Button>
        )}
      </>
    );
  } else if (state.kind === "overdue") {
    body = (
      <>
        <span className={cx(LABEL, "text-warn")}>Trễ cữ bú</span>
        <span className={state.lateMinutes < 60 ? BIG : BIG_LONG}>
          {formatMinutes(state.lateMinutes)}
        </span>
        <span className={META}>Dự kiến lúc {formatVnTime(state.due)}</span>
        {feedButtons}
      </>
    );
  } else if (state.kind === "next") {
    body = (
      <>
        <span className={cx(LABEL, "text-muted")}>Cữ bú tiếp theo</span>
        <span className={BIG}>{formatVnTime(state.due)}</span>
        <span className={META}>còn {formatMinutes(state.minutesLeft)}</span>
      </>
    );
  } else {
    body = (
      <>
        <span className="text-[17px] leading-[22px] font-semibold text-ink">
          Chưa có cữ bú nào gần đây
        </span>
        {feedButtons}
      </>
    );
  }

  return (
    <Glass
      as="section"
      radius="hero"
      className={cx(
        "flex flex-col items-center gap-2.5 p-4 text-center shadow-[0_10px_40px_rgb(0_0_0/0.10)] in-data-[theme=dark]:shadow-[0_10px_40px_rgb(0_0_0/0.40)] in-data-[theme=night]:shadow-none",
        state.kind === "overdue" && "border-warn!",
      )}
    >
      {body}
      {sub && <p className="text-[13px] leading-[18px] text-muted">{sub}</p>}
    </Glass>
  );
}
