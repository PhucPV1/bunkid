"use client";

import { PendingMark } from "@/components/sync/PendingMark";
import { describeLog } from "@/lib/rules/describeLog";
import { formatVnTime } from "@/lib/rules/time";
import type { LogRow } from "@/lib/supabase/rows";

export function RunningCard({
  log,
  who,
  now,
  busy,
  onStop,
  pending,
}: {
  log: LogRow;
  who: string;
  now: Date;
  busy: boolean;
  onStop: () => void;
  pending: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-accent-line p-4">
      <div>
        <p className="font-medium">
          {describeLog(log, now)} <PendingMark pending={pending} />
        </p>
        <p className="text-sm text-muted">
          {who} bắt đầu lúc {formatVnTime(new Date(log.started_at))}
        </p>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={onStop}
        className="min-h-11 rounded-xl bg-accent px-4 text-on-accent disabled:opacity-50"
      >
        Dừng
      </button>
    </div>
  );
}
