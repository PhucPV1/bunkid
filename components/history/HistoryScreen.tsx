"use client";

import {
  memo,
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import { useQuickActions } from "@/components/actions/QuickActions";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { NeedsNetwork, waitingForNetwork } from "@/components/ui/NeedsNetwork";
import { Skeleton } from "@/components/ui/Skeleton";
import { toVietnameseError } from "@/lib/data/errors";
import { useMembers } from "@/lib/data/family";
import { useHistoryLogs } from "@/lib/data/logs";
import { useLogsRealtime } from "@/lib/data/realtime";
import { entriesFor, pendingRowIds } from "@/lib/data/outboxCore";
import { useNow } from "@/lib/hooks/useNow";
import { useOutboxEntries } from "@/lib/hooks/useOutboxEntries";
import {
  canModifyLog,
  daySummary,
  firstScreen,
  groupByVnDay,
  HISTORY_FILTERS,
  matchesFilter,
  type HistoryFilter,
} from "@/lib/rules/history";
import { ageDays } from "@/lib/rules/time";
import type { Baby, FamilyMember, LogRow } from "@/lib/supabase/rows";
import { HistoryList } from "./HistoryList";
import { LogEditSheet } from "./LogEditSheet";

type SheetState = { log: LogRow | null } | null;

// Skips re-rendering a week of rows when only the query state, the outbox or
// the quick-actions context changed.
const MemoHistoryList = memo(HistoryList);

// Spec 2026-11-19 §10: adding an old log is a labelled button, not a calendar icon.
export function BackfillButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      size="md"
      variant="secondary"
      aria-label="Thêm bản ghi cũ"
      onClick={onClick}
    >
      Ghi bù
    </Button>
  );
}

export function HistoryScreen({
  baby,
  member,
  userId,
}: {
  baby: Baby;
  member: FamilyMember;
  userId: string;
}) {
  const now = useNow(30_000);
  useLogsRealtime(baby.id);
  const history = useHistoryLogs(baby.id, baby.dob);
  const members = useMembers(baby.family_id);
  const actions = useQuickActions();
  const outbox = useOutboxEntries(userId);
  // Kept as a string so a new outbox array with the same rows keeps the same Set.
  const pendingKey = [...pendingRowIds(entriesFor(outbox, "logs"))]
    .sort()
    .join(",");
  const pending = useMemo(
    () => new Set(pendingKey ? pendingKey.split(",") : []),
    [pendingKey],
  );
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [sheet, setSheet] = useState<SheetState>(null);

  const rows = useMemo(() => history.data?.pages.flat() ?? [], [history.data]);
  // The day summary counts every log of the day; the filter only hides rows (spec §9).
  const groups = useMemo(
    () =>
      groupByVnDay(rows)
        .map((group) => ({
          day: group.day,
          summary: daySummary({
            day: group.day,
            logs: group.logs,
            all: rows,
            now,
          }),
          logs: group.logs.filter((row) => matchesFilter(row, filter)),
        }))
        .filter((group) => group.logs.length > 0),
    [rows, filter, now],
  );
  // A tab switch commits the first screen of rows only; React renders the
  // days below right after, so the tap is not held for the whole week.
  const deferredGroups = useDeferredValue(groups, firstScreen(groups));
  // Rows that arrive after the skeleton keep the first screen while the rest renders.
  const shownGroups =
    deferredGroups.length === 0 ? firstScreen(groups) : deferredGroups;
  const nameOf = useCallback(
    (userId: string) =>
      members.data?.find((m) => m.user_id === userId)?.display_name ?? "Ai đó",
    [members.data],
  );
  const openLog = useCallback((log: LogRow) => setSheet({ log }), []);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      <PageHeader
        title="Nhật ký"
        action={<BackfillButton onClick={() => setSheet({ log: null })} />}
      />

      <ChipGroup
        label="Lọc nhật ký"
        options={HISTORY_FILTERS}
        value={filter}
        onChange={setFilter}
      />

      {waitingForNetwork(history) ? (
        <NeedsNetwork what="nhật ký" />
      ) : history.isPending ? (
        <div className="flex flex-col gap-2.5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[60px]" />
          ))}
        </div>
      ) : history.isError && !history.data ? (
        <ErrorCard
          message={toVietnameseError(history.error)}
          onRetry={() => void history.refetch()}
        />
      ) : groups.length === 0 ? (
        filter === "all" && !history.hasNextPage ? (
          <EmptyState
            icon="list"
            text="Chưa có bản ghi nào."
            action={{
              label: "Ghi bản đầu tiên",
              // Not passed as is: the click event would be taken for groups.
              onClick: () => actions.openActionSheet(),
            }}
          />
        ) : (
          <EmptyState
            icon="list"
            text={
              filter === "all"
                ? "Chưa có bản ghi nào trong 7 ngày qua."
                : "Không có bản ghi nào cho mục này."
            }
          />
        )
      ) : (
        <MemoHistoryList
          groups={shownGroups}
          now={now}
          nameOf={nameOf}
          pending={pending}
          onOpen={openLog}
        />
      )}

      {history.hasNextPage && (
        <Button
          variant="secondary"
          block
          disabled={history.isFetchingNextPage}
          onClick={() => void history.fetchNextPage()}
        >
          {history.isFetchingNextPage ? "Đang tải…" : "Xem thêm 7 ngày trước"}
        </Button>
      )}

      {sheet && (
        <LogEditSheet
          babyId={baby.id}
          userId={userId}
          log={sheet.log}
          canModify={
            sheet.log === null || canModifyLog(member, sheet.log.created_by)
          }
          who={sheet.log ? nameOf(sheet.log.created_by) : ""}
          recentLogs={rows}
          ageDays={ageDays(baby.dob, now)}
          onClose={() => setSheet(null)}
        />
      )}
    </main>
  );
}
