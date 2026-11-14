import { describe, expect, it } from "vitest";
import type { GrowthRow } from "@/lib/supabase/rows";
import {
  applyGrowthChange,
  overlayPending,
  overlayPendingGrowth,
  type OutboxEntry,
} from "./outboxCore";

const NOW = "2026-11-15T03:00:00.000Z";

const entry = (
  op: OutboxEntry["op"],
  rowId: string,
  row: Record<string, unknown> | null,
  createdAt = 1,
): OutboxEntry => ({
  id: `e-${rowId}-${createdAt}`,
  table: "growth",
  op,
  rowId,
  babyId: "b1",
  userId: "u1",
  row,
  createdAt,
  attempts: 0,
});

const october: GrowthRow = {
  id: "g1",
  baby_id: "b1",
  measured_on: "2026-10-14",
  weight_g: 4300,
  length_cm: 54.5,
  head_cm: null,
  created_by: "u0",
  created_at: "2026-10-14T03:00:00.000Z",
  updated_at: "2026-10-14T03:00:00.000Z",
};

describe("applyGrowthChange", () => {
  it("insert adds the measurement newest first and ignores a repeat", () => {
    const add = entry("insert", "g2", {
      measured_on: "2026-11-14",
      weight_g: 5125,
    });
    const rows = applyGrowthChange([october], add, NOW);
    expect(rows.map((r) => r.id)).toEqual(["g2", "g1"]);
    expect(rows[0]).toMatchObject({
      baby_id: "b1",
      weight_g: 5125,
      length_cm: null,
      created_by: "u1",
    });
    expect(applyGrowthChange(rows, add, NOW)).toBe(rows);
  });

  it("update merges the changed columns and keeps the order by date", () => {
    const rows = applyGrowthChange(
      [october],
      entry("update", "g1", { head_cm: 38.2 }),
      NOW,
    );
    expect(rows).toEqual([{ ...october, head_cm: 38.2, updated_at: NOW }]);
  });

  it("delete removes the row", () => {
    expect(
      applyGrowthChange([october], entry("delete", "g1", null), NOW),
    ).toEqual([]);
  });
});

describe("growth overlays stay apart from logs", () => {
  it("overlayPendingGrowth uses growth entries only, oldest first", () => {
    const logEntry: OutboxEntry = {
      ...entry("delete", "g1", null, 0),
      table: "logs",
    };
    const rows = overlayPendingGrowth(
      [october],
      [
        entry("update", "g1", { weight_g: 4400 }, 3),
        entry("update", "g1", { weight_g: 4350 }, 2),
        logEntry,
      ],
      NOW,
    );
    expect(rows[0].weight_g).toBe(4400);
  });

  it("overlayPending (logs) ignores growth entries", () => {
    const logRow = { id: "g1" } as unknown as Parameters<
      typeof overlayPending
    >[0][number];
    expect(
      overlayPending([logRow], [entry("delete", "g1", null)], () => true, NOW),
    ).toEqual([logRow]);
  });
});
