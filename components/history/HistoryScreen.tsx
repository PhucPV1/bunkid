"use client";

import { useState } from "react";
import { toVietnameseError } from "@/lib/data/errors";
import { useMembers } from "@/lib/data/family";
import { useHistoryLogs } from "@/lib/data/logs";
import { useLogsRealtime } from "@/lib/data/realtime";
import { useNow } from "@/lib/hooks/useNow";
import { vnDayLabel } from "@/lib/rules/days";
import { describeLog } from "@/lib/rules/describeLog";
import {
  canModifyLog,
  groupByVnDay,
  HISTORY_FILTERS,
  matchesFilter,
  type HistoryFilter,
} from "@/lib/rules/history";
import { formatVnTime } from "@/lib/rules/time";
import type { Baby, FamilyMember, LogRow } from "@/lib/supabase/rows";
import { LogEditSheet } from "./LogEditSheet";

type SheetState = { log: LogRow | null } | null;

export function HistoryScreen({
  baby,
  member,
}: {
  baby: Baby;
  member: FamilyMember;
}) {
  const now = useNow(30_000);
  useLogsRealtime(baby.id);
  const history = useHistoryLogs(baby.id, baby.dob);
  const members = useMembers(baby.family_id);
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [sheet, setSheet] = useState<SheetState>(null);

  const rows = history.data?.pages.flat() ?? [];
  const groups = groupByVnDay(rows.filter((row) => matchesFilter(row, filter)));
  const nameOf = (userId: string) =>
    members.data?.find((m) => m.user_id === userId)?.display_name ?? "Ai đó";

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Nhật ký</h1>
        <button
          type="button"
          onClick={() => setSheet({ log: null })}
          className="min-h-11 rounded-xl bg-accent px-3 text-on-accent"
        >
          + Thêm
        </button>
      </header>

      <nav className="-mx-4 flex gap-2 overflow-x-auto px-4">
        {HISTORY_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={`min-h-11 shrink-0 rounded-full px-4 ${filter === f.value ? "bg-accent text-on-accent" : "bg-soft"}`}
          >
            {f.label}
          </button>
        ))}
      </nav>

      {history.isError && (
        <p role="alert" className="text-danger">
          {toVietnameseError(history.error)}
        </p>
      )}
      {history.isPending && <p className="text-muted">Đang tải…</p>}
      {history.isSuccess && groups.length === 0 && (
        <p className="text-muted">Không có bản ghi nào.</p>
      )}

      {groups.map((group) => (
        <section key={group.day} className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">{vnDayLabel(group.day, now)}</h2>
          <ul className="divide-y rounded-2xl border">
            {group.logs.map((log) => (
              <li key={log.id}>
                <button
                  type="button"
                  onClick={() => setSheet({ log })}
                  className="flex min-h-11 w-full gap-3 p-3 text-left"
                >
                  <span className="w-12 shrink-0 tabular-nums text-muted">
                    {formatVnTime(new Date(log.started_at))}
                  </span>
                  <span className="flex-1">
                    {describeLog(log, now)}
                    {log.note && (
                      <span className="block text-sm text-muted">
                        {log.note}
                      </span>
                    )}
                  </span>
                  <span className="text-sm text-muted">
                    {nameOf(log.created_by)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {history.hasNextPage && (
        <button
          type="button"
          disabled={history.isFetchingNextPage}
          onClick={() => void history.fetchNextPage()}
          className="min-h-12 rounded-2xl border disabled:opacity-50"
        >
          {history.isFetchingNextPage ? "Đang tải…" : "Xem thêm 7 ngày trước"}
        </button>
      )}

      {sheet && (
        <LogEditSheet
          babyId={baby.id}
          log={sheet.log}
          canModify={
            sheet.log === null || canModifyLog(member, sheet.log.created_by)
          }
          who={sheet.log ? nameOf(sheet.log.created_by) : ""}
          recentLogs={rows}
          onClose={() => setSheet(null)}
        />
      )}
    </main>
  );
}
