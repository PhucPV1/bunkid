"use client";

import { useState } from "react";
import { useQuickActions } from "@/components/actions/QuickActions";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { IconButton } from "@/components/ui/IconButton";
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
  groupByVnDay,
  HISTORY_FILTERS,
  matchesFilter,
  type HistoryFilter,
} from "@/lib/rules/history";
import type { Baby, FamilyMember, LogRow } from "@/lib/supabase/rows";
import { HistoryList } from "./HistoryList";
import { LogEditSheet } from "./LogEditSheet";

type SheetState = { log: LogRow | null } | null;

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
  const pending = pendingRowIds(entriesFor(useOutboxEntries(userId), "logs"));
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [sheet, setSheet] = useState<SheetState>(null);

  const rows = history.data?.pages.flat() ?? [];
  // The day summary counts every log of the day; the filter only hides rows (spec §9).
  const groups = groupByVnDay(rows)
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
    .filter((group) => group.logs.length > 0);
  const nameOf = (userId: string) =>
    members.data?.find((m) => m.user_id === userId)?.display_name ?? "Ai đó";

  return (
    <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
      <PageHeader
        title="Nhật ký"
        action={
          <IconButton
            label="Thêm bản ghi cũ"
            icon="calendar"
            onClick={() => setSheet({ log: null })}
          />
        }
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
              onClick: actions.openActionSheet,
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
        <HistoryList
          groups={groups}
          now={now}
          nameOf={nameOf}
          pending={pending}
          onOpen={(log) => setSheet({ log })}
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
          onClose={() => setSheet(null)}
        />
      )}
    </main>
  );
}
