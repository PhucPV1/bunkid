import { Icon } from "@/components/ui/Icon";
import { longTimerText } from "@/lib/rules/hero";
import type { LogRow } from "@/lib/supabase/rows";

// Spec 2026-11-17 §5.1: one yellow row for each timer that ran past its limit.
export function LongTimerBanner({
  log,
  now,
  busy,
  onStop,
}: {
  log: LogRow;
  now: Date;
  busy: boolean;
  onStop: () => void;
}) {
  return (
    <div
      role="status"
      className="flex items-center gap-2.5 rounded-[20px] bg-warn-soft py-2.5 pr-2.5 pl-3.5 text-warn-ink"
    >
      <Icon name="clock" className="shrink-0" />
      <p className="min-w-0 flex-1 text-[15px] leading-5 font-medium">
        {longTimerText(log, now)}
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={onStop}
        className="min-h-11 shrink-0 rounded-full border border-warn px-4 text-[15px] font-semibold transition-transform duration-[120ms] active:scale-[0.97] disabled:opacity-50"
      >
        Dừng
      </button>
    </div>
  );
}
