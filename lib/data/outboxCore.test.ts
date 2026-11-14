import { describe, expect, it } from "vitest";
import type { LogRow } from "@/lib/supabase/rows";
import {
  applyLogChange,
  applyToCache,
  classifyFailure,
  overlayPending,
  type OutboxEntry,
} from "./outboxCore";

const NOW = "2026-11-15T03:00:00.000Z";

function row(id: string, started_at: string, ended_at: string | null): LogRow {
  return {
    id,
    baby_id: "b1",
    type: "sleep",
    started_at,
    ended_at,
    details: {},
    note: null,
    created_by: "u0",
    created_at: started_at,
    updated_at: started_at,
  };
}

function entry(
  op: OutboxEntry["op"],
  rowId: string,
  data: Record<string, unknown> | null,
  createdAt = 1,
): OutboxEntry {
  return {
    id: `e-${rowId}-${createdAt}`,
    table: "logs",
    op,
    rowId,
    babyId: "b1",
    userId: "u1",
    row: data,
    createdAt,
    attempts: 0,
  };
}

const diaper = {
  type: "diaper",
  started_at: "2026-11-15T02:00:00.000Z",
  ended_at: "2026-11-15T02:00:00.000Z",
  details: { wet: true, dirty: false },
};

describe("classifyFailure (spec §9)", () => {
  it("treats 401 as temporary even with an RLS code", () => {
    expect(
      classifyFailure({ status: 401, code: "42501", message: "" }),
    ).toEqual({ kind: "refresh" });
    expect(
      classifyFailure({
        status: 401,
        code: "PGRST303",
        message: "jwt expired",
      }),
    ).toEqual({ kind: "refresh" });
  });

  it("retries network errors, timeouts, rate limits, server errors and unknowns", () => {
    for (const status of [0, 408, 429, 500, 503, 409])
      expect(classifyFailure({ status, code: null, message: "" })).toEqual({
        kind: "retry",
      });
  });

  it("drops permanent errors with a reason", () => {
    expect(
      classifyFailure({ status: 409, code: "23505", message: "" }),
    ).toEqual({
      kind: "drop",
      reason: "Đã có người bắt đầu trước",
    });
    expect(
      classifyFailure({ status: 403, code: "42501", message: "" }),
    ).toEqual({
      kind: "drop",
      reason: "Bạn không có quyền thực hiện thao tác này",
    });
    expect(
      classifyFailure({ status: 400, code: "22P02", message: "" }),
    ).toEqual({
      kind: "drop",
      reason: "Dữ liệu không hợp lệ",
    });
    expect(
      classifyFailure({ status: 400, code: "PGRST204", message: "" }),
    ).toEqual({
      kind: "drop",
      reason: "Dữ liệu không hợp lệ",
    });
    expect(classifyFailure({ zeroRows: true })).toEqual({
      kind: "drop",
      reason: "Bạn không có quyền thực hiện thao tác này",
    });
  });
});

describe("applyLogChange", () => {
  const rows = [
    row("a", "2026-11-15T01:00:00.000Z", null),
    row("b", "2026-11-14T20:00:00.000Z", "2026-11-14T21:00:00.000Z"),
  ];

  it("inserts a new row in started_at order, once", () => {
    const next = applyLogChange(rows, entry("insert", "c", diaper), NOW);
    expect(next.map((r) => r.id)).toEqual(["c", "a", "b"]);
    expect(next[0]).toMatchObject({
      type: "diaper",
      created_by: "u1",
      note: null,
    });
    expect(applyLogChange(next, entry("insert", "c", diaper), NOW)).toBe(next);
  });

  it("updates, deletes and stops rows", () => {
    expect(
      applyLogChange(rows, entry("update", "b", { note: "x" }), NOW)[1].note,
    ).toBe("x");
    expect(
      applyLogChange(rows, entry("delete", "a", null), NOW).map((r) => r.id),
    ).toEqual(["b"]);
    expect(
      applyLogChange(rows, entry("stop", "a", { ended_at: NOW }), NOW)[0]
        .ended_at,
    ).toBe(NOW);
    expect(
      applyLogChange(
        rows,
        entry("stop", "a", { ended_at: "2026-11-15T00:00:00.000Z" }),
        NOW,
      )[0].ended_at,
    ).toBe("2026-11-15T01:00:00.000Z");
  });

  it("applyToCache handles lists and infinite pages, new rows only on the first page", () => {
    const data = { pages: [[rows[0]], [rows[1]]], pageParams: [0, 1] };
    const inserted = applyToCache(
      data,
      entry("insert", "c", diaper),
      NOW,
    ) as typeof data;
    expect(inserted.pages.map((p) => p.map((r) => r.id))).toEqual([
      ["c", "a"],
      ["b"],
    ]);
    const deleted = applyToCache(
      data,
      entry("delete", "b", null),
      NOW,
    ) as typeof data;
    expect(deleted.pages[1]).toEqual([]);
    expect(
      applyToCache(undefined, entry("delete", "b", null), NOW),
    ).toBeUndefined();
  });

  it("overlayPending replays queued changes in order and filters inserts by range", () => {
    const queued = [
      entry("stop", "a", { ended_at: NOW }, 3),
      entry("insert", "c", diaper, 1),
      entry(
        "insert",
        "old",
        { ...diaper, started_at: "2026-11-01T00:00:00.000Z" },
        2,
      ),
    ];
    const result = overlayPending(
      rows,
      queued,
      (r) => r.started_at >= "2026-11-14T00:00:00.000Z",
      NOW,
    );
    expect(result.map((r) => r.id)).toEqual(["c", "a", "b"]);
    expect(result[1].ended_at).toBe(NOW);
  });
});
