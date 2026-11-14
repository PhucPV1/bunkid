import type { GrowthRow, LogRow, VaccineDoseRow } from "@/lib/supabase/rows";

// logs: insert / update / delete / stop by row id.
// vaccine_doses: upsert (mark a dose) / insert (quick tick, keeps an existing row) /
// delete (clear the mark), keyed by "code#doseNo" because the row id is the server's.
export type OutboxOp = "insert" | "update" | "delete" | "stop" | "upsert";

export type OutboxEntry = {
  id: string;
  table: "logs" | "vaccine_doses" | "growth";
  op: OutboxOp;
  rowId: string;
  babyId: string;
  userId: string;
  // logs — insert: the new row; update: the changed columns; stop: { ended_at }; delete: null.
  // vaccine_doses — always { vaccine_code, dose_no, ... } plus the marked columns.
  // growth — insert: the measurement; update: the changed columns; delete: null.
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
    case "upsert":
      // Only vaccine_doses entries use upsert.
      return rows;
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
  return [...entriesFor(entries, "logs")]
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

// Entries of one table, for overlays and pending marks that must not mix tables.
export function entriesFor(
  entries: OutboxEntry[],
  table: OutboxEntry["table"],
): OutboxEntry[] {
  return entries.filter((entry) => entry.table === table);
}

const doseKeyOf = (row: { vaccine_code: string; dose_no: number }) =>
  `${row.vaccine_code}#${row.dose_no}`;

export function applyDoseChange(
  rows: VaccineDoseRow[],
  entry: OutboxEntry,
  nowIso: string,
): VaccineDoseRow[] {
  const existing = rows.find((row) => doseKeyOf(row) === entry.rowId);
  if (entry.op === "delete")
    return rows.filter((row) => doseKeyOf(row) !== entry.rowId);
  if (entry.op === "insert" && existing) return rows;
  const patch = (entry.row ?? {}) as Partial<VaccineDoseRow>;
  if (existing)
    return rows.map((row) =>
      row === existing ? { ...row, ...patch, updated_at: nowIso } : row,
    );
  return [
    ...rows,
    {
      id: entry.id,
      baby_id: entry.babyId,
      vaccine_code: String(patch.vaccine_code),
      dose_no: Number(patch.dose_no),
      status: String(patch.status),
      given_on: patch.given_on ?? null,
      due_on_override: patch.due_on_override ?? null,
      place: patch.place ?? null,
      note: patch.note ?? null,
      created_by: entry.userId,
      created_at: nowIso,
      updated_at: nowIso,
    },
  ];
}

// Fresh server rows plus the dose marks still waiting in the outbox.
export function overlayPendingDoses(
  rows: VaccineDoseRow[],
  entries: OutboxEntry[],
  nowIso: string,
): VaccineDoseRow[] {
  return [...entriesFor(entries, "vaccine_doses")]
    .sort((a, b) => a.createdAt - b.createdAt)
    .reduce((acc, entry) => applyDoseChange(acc, entry, nowIso), rows);
}

const byMeasuredOn = (a: GrowthRow, b: GrowthRow) =>
  b.measured_on.localeCompare(a.measured_on) ||
  b.created_at.localeCompare(a.created_at);

// growth rows use a client id, so entries match rows by id (like logs).
export function applyGrowthChange(
  rows: GrowthRow[],
  entry: OutboxEntry,
  nowIso: string,
): GrowthRow[] {
  const patch = (entry.row ?? {}) as Partial<GrowthRow>;
  switch (entry.op) {
    case "insert":
      if (rows.some((r) => r.id === entry.rowId)) return rows;
      return [
        ...rows,
        {
          id: entry.rowId,
          baby_id: entry.babyId,
          measured_on: String(patch.measured_on),
          weight_g: patch.weight_g ?? null,
          length_cm: patch.length_cm ?? null,
          head_cm: patch.head_cm ?? null,
          created_by: entry.userId,
          created_at: nowIso,
          updated_at: nowIso,
        },
      ].sort(byMeasuredOn);
    case "update":
      return rows
        .map((r) =>
          r.id === entry.rowId ? { ...r, ...patch, updated_at: nowIso } : r,
        )
        .sort(byMeasuredOn);
    case "delete":
      return rows.filter((r) => r.id !== entry.rowId);
    default:
      return rows;
  }
}

export function overlayPendingGrowth(
  rows: GrowthRow[],
  entries: OutboxEntry[],
  nowIso: string,
): GrowthRow[] {
  return [...entriesFor(entries, "growth")]
    .sort((a, b) => a.createdAt - b.createdAt)
    .reduce((acc, entry) => applyGrowthChange(acc, entry, nowIso), rows);
}
