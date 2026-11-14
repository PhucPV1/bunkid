import type { LogRow } from "@/lib/supabase/rows";

export type OutboxOp = "insert" | "update" | "delete" | "stop";

export type OutboxEntry = {
  id: string;
  table: "logs";
  op: OutboxOp;
  rowId: string;
  babyId: string;
  userId: string;
  // insert: the new row; update: the changed columns; stop: { ended_at }; delete: null
  row: Record<string, unknown> | null;
  createdAt: number;
  attempts: number;
};

export type Failure =
  { zeroRows: true } | { status: number; code: string | null; message: string };

export type FailureClass =
  { kind: "retry" } | { kind: "refresh" } | { kind: "drop"; reason: string };

const PERMISSION = "Bạn không có quyền thực hiện thao tác này";
const INVALID = "Dữ liệu không hợp lệ";
const DROP_CODES: Record<string, string> = {
  "42501": PERMISSION,
  "23505": "Đã có người bắt đầu trước",
  "23514": INVALID,
  "23503": "Bản ghi liên quan không còn",
  "22P02": INVALID,
};

// Spec §9: 401 is always temporary; known permanent errors are dropped; anything
// else is retried on the next flush.
export function classifyFailure(failure: Failure): FailureClass {
  if ("zeroRows" in failure) return { kind: "drop", reason: PERMISSION };
  const { status, code } = failure;
  if (status === 401 || code === "PGRST301" || code === "PGRST303")
    return { kind: "refresh" };
  if (code && code in DROP_CODES)
    return { kind: "drop", reason: DROP_CODES[code] };
  if (status === 403) return { kind: "drop", reason: PERMISSION };
  if (status === 400) return { kind: "drop", reason: INVALID };
  return { kind: "retry" };
}

function newRow(entry: OutboxEntry, nowIso: string): LogRow {
  const row = entry.row ?? {};
  return {
    id: entry.rowId,
    baby_id: entry.babyId,
    type: String(row.type),
    started_at: String(row.started_at),
    ended_at: (row.ended_at as string | null | undefined) ?? null,
    details: (row.details ?? {}) as LogRow["details"],
    note: (row.note as string | null | undefined) ?? null,
    created_by: entry.userId,
    created_at: nowIso,
    updated_at: nowIso,
  };
}

const byNewest = (a: LogRow, b: LogRow) =>
  Date.parse(b.started_at) - Date.parse(a.started_at);

export function applyLogChange(
  rows: LogRow[],
  entry: OutboxEntry,
  nowIso: string,
): LogRow[] {
  switch (entry.op) {
    case "insert":
      if (rows.some((r) => r.id === entry.rowId)) return rows;
      return [newRow(entry, nowIso), ...rows].sort(byNewest);
    case "update":
      return rows
        .map((r) =>
          r.id === entry.rowId
            ? ({ ...r, ...entry.row, updated_at: nowIso } as LogRow)
            : r,
        )
        .sort(byNewest);
    case "delete":
      return rows.filter((r) => r.id !== entry.rowId);
    case "stop": {
      const endedAt = String(entry.row?.ended_at);
      return rows.map((r) =>
        r.id === entry.rowId && r.ended_at === null
          ? {
              ...r,
              ended_at:
                Date.parse(endedAt) < Date.parse(r.started_at)
                  ? r.started_at
                  : endedAt,
            }
          : r,
      );
    }
  }
}

// Applies a queued change to whatever React Query holds under logsKey:
// a plain list, or infinite-query pages (new rows go to the newest page).
export function applyToCache(
  data: unknown,
  entry: OutboxEntry,
  nowIso: string,
): unknown {
  if (Array.isArray(data))
    return applyLogChange(data as LogRow[], entry, nowIso);
  if (
    typeof data === "object" &&
    data !== null &&
    "pages" in data &&
    Array.isArray(data.pages)
  ) {
    const pages = data.pages as LogRow[][];
    return {
      ...data,
      pages: pages.map((page, index) =>
        entry.op === "insert" && index > 0
          ? page
          : applyLogChange(page, entry, nowIso),
      ),
    };
  }
  return data;
}

// Re-applies changes still waiting in the outbox on top of fresh server rows,
// so a refetch never hides them. Inserts are kept only when `inRange` accepts them.
export function overlayPending(
  rows: LogRow[],
  entries: OutboxEntry[],
  inRange: (row: LogRow) => boolean,
  nowIso: string,
): LogRow[] {
  return [...entries]
    .sort((a, b) => a.createdAt - b.createdAt)
    .reduce(
      (acc, entry) =>
        entry.op === "insert" && !inRange(newRow(entry, nowIso))
          ? acc
          : applyLogChange(acc, entry, nowIso),
      rows,
    );
}

// Ids of log rows that still have a change waiting in the outbox.
export function pendingRowIds(entries: OutboxEntry[]): Set<string> {
  return new Set(entries.map((entry) => entry.rowId));
}
