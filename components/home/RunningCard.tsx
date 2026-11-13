"use client";

import { describeLog } from "@/lib/rules/describeLog";
import { formatVnTime } from "@/lib/rules/time";
import type { LogRow } from "@/lib/supabase/rows";

export function RunningCard({
  log,
  who,
  now,
  busy,
  onStop,
}: {
  log: LogRow;
  who: string;
  now: Date;
  busy: boolean;
  onStop: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-pink-200 p-4">
      <div>
        <p className="font-medium">{describeLog(log, now)}</p>
        <p className="text-sm text-neutral-500">
          {who} bắt đầu lúc {formatVnTime(new Date(log.started_at))}
        </p>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={onStop}
        className="min-h-11 rounded-xl bg-pink-500 px-4 text-white disabled:opacity-50"
      >
        Dừng
      </button>
    </div>
  );
}
