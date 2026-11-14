"use client";

import { describeLog } from "@/lib/rules/describeLog";
import { formatVnTime } from "@/lib/rules/time";
import type { LogRow } from "@/lib/supabase/rows";

export function RecentList({
  logs,
  now,
  nameOf,
}: {
  logs: LogRow[];
  now: Date;
  nameOf: (userId: string) => string;
}) {
  if (logs.length === 0)
    return <p className="text-muted">Chưa có ghi chép nào trong 24 giờ qua.</p>;
  return (
    <ul className="divide-y rounded-2xl border">
      {logs.map((log) => (
        <li key={log.id} className="flex gap-3 p-3">
          <span className="w-12 shrink-0 tabular-nums text-muted">
            {formatVnTime(new Date(log.started_at))}
          </span>
          <span className="flex-1">{describeLog(log, now)}</span>
          <span className="text-sm text-muted">{nameOf(log.created_by)}</span>
        </li>
      ))}
    </ul>
  );
}
