import { PendingMark } from "@/components/sync/PendingMark";
import { Button } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import { timerLabel } from "@/lib/rules/hero";
import type { LogType } from "@/lib/rules/logDetails";
import { formatDuration } from "@/lib/rules/time";
import type { LogRow } from "@/lib/supabase/rows";
import { CATEGORIES, CATEGORY_CHIP } from "@/lib/ui/categories";
import { cx } from "@/lib/ui/cx";

// Spec §7.1 step 5: a running timer that is not on the hero card.
export function TimerRow({
  log,
  who,
  now,
  busy,
  pending,
  onStop,
}: {
  log: LogRow;
  who: string;
  now: Date;
  busy: boolean;
  pending: boolean;
  onStop: () => void;
}) {
  const category = CATEGORIES[log.type as LogType];
  return (
    <Glass radius="tile" className="flex items-center gap-3 py-2 pr-2 pl-3">
      <span
        className={cx(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          CATEGORY_CHIP[category.token],
        )}
      >
        <Icon name={category.icon} size={17} strokeWidth={2.2} />
      </span>
      <span className="min-w-0 flex-1 text-[15px] text-ink tabular-nums">
        {timerLabel(log)} ·{" "}
        {formatDuration(now.getTime() - Date.parse(log.started_at))} · {who}{" "}
        <PendingMark pending={pending} />
      </span>
      <Button size="md" variant="secondary" disabled={busy} onClick={onStop}>
        Dừng
      </Button>
    </Glass>
  );
}
