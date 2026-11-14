import { describe, expect, it } from "vitest";
import type { MilestoneRow } from "@/lib/supabase/rows";
import {
  applyMilestoneChange,
  overlayPendingMilestones,
  type OutboxEntry,
} from "./outboxCore";

const NOW = "2026-11-15T03:00:00.000Z";
const entry = (
  op: OutboxEntry["op"],
  code: string,
  row: Record<string, unknown>,
  createdAt = 1,
): OutboxEntry => ({
  id: `e-${code}-${createdAt}`,
  table: "milestones_achieved",
  op,
  rowId: code,
  babyId: "b1",
  userId: "u1",
  row: { milestone_code: code, ...row },
  createdAt,
  attempts: 0,
});
const server: MilestoneRow = {
  id: "s1",
  baby_id: "b1",
  milestone_code: "lat",
  achieved_on: "2026-11-10",
  note: null,
  photo_id: null,
  created_by: "u0",
  created_at: "2026-11-10T03:00:00.000Z",
};

describe("applyMilestoneChange", () => {
  it("upsert adds a mark, then updates it in place", () => {
    const added = applyMilestoneChange(
      [server],
      entry("upsert", "ngoi", {
        achieved_on: "2026-11-14",
        note: "Ngồi vững",
        photo_id: "p1",
      }),
      NOW,
    );
    expect(added[1]).toMatchObject({
      id: "e-ngoi-1",
      milestone_code: "ngoi",
      achieved_on: "2026-11-14",
      note: "Ngồi vững",
      photo_id: "p1",
      created_by: "u1",
    });
    const edited = applyMilestoneChange(
      [server],
      entry("upsert", "lat", {
        achieved_on: "2026-11-09",
        note: null,
        photo_id: null,
      }),
      NOW,
    );
    expect(edited).toEqual([{ ...server, achieved_on: "2026-11-09" }]);
  });

  it("delete removes the mark by code", () => {
    expect(
      applyMilestoneChange([server], entry("delete", "lat", {}), NOW),
    ).toEqual([]);
  });
});

describe("overlayPendingMilestones", () => {
  it("applies milestone entries oldest first and ignores other tables", () => {
    const other: OutboxEntry = {
      ...entry("delete", "lat", {}, 0),
      table: "growth",
    };
    const rows = overlayPendingMilestones(
      [server],
      [
        entry(
          "upsert",
          "lat",
          { achieved_on: "2026-11-12", note: null, photo_id: null },
          3,
        ),
        entry("delete", "lat", {}, 2),
        other,
      ],
      NOW,
    );
    expect(rows.map((r) => [r.milestone_code, r.achieved_on])).toEqual([
      ["lat", "2026-11-12"],
    ]);
  });
});
