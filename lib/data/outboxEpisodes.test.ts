import { describe, expect, it } from "vitest";
import type { EpisodeRow } from "@/lib/supabase/rows";
import {
  applyEpisodeChange,
  classifyFailure,
  overlayPending,
  overlayPendingEpisodes,
  type OutboxEntry,
} from "./outboxCore";

const NOW = "2026-11-26T03:00:00.000Z";

const entry = (
  op: OutboxEntry["op"],
  rowId: string,
  row: Record<string, unknown> | null,
  createdAt = 1,
): OutboxEntry => ({
  id: `e-${rowId}-${createdAt}`,
  table: "illness_episodes",
  op,
  rowId,
  babyId: "b1",
  userId: "u1",
  row,
  createdAt,
  attempts: 0,
});

const october: EpisodeRow = {
  id: "ep1",
  baby_id: "b1",
  started_at: "2026-10-10T01:00:00.000Z",
  ended_at: "2026-10-13T02:00:00.000Z",
  created_by: "u0",
  created_at: "2026-10-10T01:00:00.000Z",
  updated_at: "2026-10-13T02:00:00.000Z",
};

// Spec 2026-11-26 §4.2.
describe("applyEpisodeChange", () => {
  it("insert adds an open episode newest first and ignores a repeat", () => {
    const start = entry("insert", "ep2", {
      started_at: "2026-11-25T02:00:00.000Z",
    });
    const rows = applyEpisodeChange([october], start, NOW);
    expect(rows.map((r) => r.id)).toEqual(["ep2", "ep1"]);
    expect(rows[0]).toEqual({
      id: "ep2",
      baby_id: "b1",
      started_at: "2026-11-25T02:00:00.000Z",
      ended_at: null,
      created_by: "u1",
      created_at: NOW,
      updated_at: NOW,
    });
    expect(applyEpisodeChange(rows, start, NOW)).toBe(rows);
  });

  it("insert keeps an end that came with it", () => {
    const rows = applyEpisodeChange(
      [],
      entry("insert", "ep3", {
        started_at: "2026-09-01T02:00:00.000Z",
        ended_at: "2026-09-02T02:00:00.000Z",
      }),
      NOW,
    );
    expect(rows[0].ended_at).toBe("2026-09-02T02:00:00.000Z");
  });

  it("update merges the changed columns and sorts again by start", () => {
    const newer: EpisodeRow = {
      ...october,
      id: "ep2",
      started_at: "2026-11-25T02:00:00.000Z",
      ended_at: null,
    };
    const closed = applyEpisodeChange(
      [newer, october],
      entry("update", "ep2", { ended_at: "2026-11-26T02:00:00.000Z" }),
      NOW,
    );
    expect(closed[0]).toEqual({
      ...newer,
      ended_at: "2026-11-26T02:00:00.000Z",
      updated_at: NOW,
    });
    expect(closed[1]).toBe(october);
    const moved = applyEpisodeChange(
      [newer, october],
      entry("update", "ep2", { started_at: "2026-10-01T02:00:00.000Z" }),
      NOW,
    );
    expect(moved.map((r) => r.id)).toEqual(["ep1", "ep2"]);
    // Reopening sends ended_at: null, which must win over the stored end.
    expect(
      applyEpisodeChange(
        [october],
        entry("update", "ep1", { ended_at: null }),
        NOW,
      )[0].ended_at,
    ).toBeNull();
  });

  it("delete removes the row; other ops leave the list alone", () => {
    expect(
      applyEpisodeChange([october], entry("delete", "ep1", null), NOW),
    ).toEqual([]);
    const rows = [october];
    expect(applyEpisodeChange(rows, entry("stop", "ep1", {}), NOW)).toBe(rows);
    expect(applyEpisodeChange(rows, entry("upsert", "ep1", {}), NOW)).toBe(
      rows,
    );
  });
});

describe("episode overlays stay apart from the other tables", () => {
  it("overlayPendingEpisodes uses illness_episodes entries only, oldest first", () => {
    const growthEntry: OutboxEntry = {
      ...entry("delete", "ep1", null, 0),
      table: "growth",
    };
    const rows = overlayPendingEpisodes(
      [october],
      [
        entry("update", "ep1", { ended_at: "2026-10-15T02:00:00.000Z" }, 3),
        entry("update", "ep1", { ended_at: "2026-10-14T02:00:00.000Z" }, 2),
        entry("insert", "ep2", { started_at: "2026-11-25T02:00:00.000Z" }, 4),
        growthEntry,
      ],
      NOW,
    );
    expect(rows.map((r) => [r.id, r.ended_at])).toEqual([
      ["ep2", null],
      ["ep1", "2026-10-15T02:00:00.000Z"],
    ]);
  });

  it("overlayPending (logs) ignores illness_episodes entries", () => {
    const logRow = { id: "ep1" } as unknown as Parameters<
      typeof overlayPending
    >[0][number];
    expect(
      overlayPending([logRow], [entry("delete", "ep1", null)], () => true, NOW),
    ).toEqual([logRow]);
  });
});

describe("classifyFailure for an overlapping episode", () => {
  it("drops 23P01 with the sentence of spec §4.2", () => {
    expect(
      classifyFailure({ status: 409, code: "23P01", message: "" }),
    ).toEqual({
      kind: "drop",
      reason: "Trùng thời gian với một đợt ốm khác",
    });
  });
});
