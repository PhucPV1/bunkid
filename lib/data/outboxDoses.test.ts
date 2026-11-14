import { describe, expect, it } from "vitest";
import type { LogRow, VaccineDoseRow } from "@/lib/supabase/rows";
import {
  applyDoseChange,
  entriesFor,
  overlayPending,
  overlayPendingDoses,
  type OutboxEntry,
} from "./outboxCore";

const NOW = "2026-11-15T03:00:00.000Z";

function dose(
  op: OutboxEntry["op"],
  key: string,
  data: Record<string, unknown>,
  createdAt = 1,
): OutboxEntry {
  return {
    id: `e-${key}-${createdAt}`,
    table: "vaccine_doses",
    op,
    rowId: key,
    babyId: "b1",
    userId: "u1",
    row: data,
    createdAt,
    attempts: 0,
  };
}

const server: VaccineDoseRow = {
  id: "server-1",
  baby_id: "b1",
  vaccine_code: "bcg",
  dose_no: 1,
  status: "done",
  given_on: "2026-09-14",
  due_on_override: null,
  place: "Bệnh viện",
  note: null,
  created_by: "u0",
  created_at: "2026-09-14T03:00:00.000Z",
  updated_at: "2026-09-14T03:00:00.000Z",
};

const marked = {
  vaccine_code: "hexa",
  dose_no: 1,
  status: "done",
  given_on: "2026-11-14",
  due_on_override: null,
  place: null,
  note: null,
};

describe("applyDoseChange", () => {
  it("upsert adds a new row, then merges into it", () => {
    const added = applyDoseChange(
      [server],
      dose("upsert", "hexa#1", marked),
      NOW,
    );
    expect(added).toHaveLength(2);
    expect(added[1]).toMatchObject({
      id: "e-hexa#1-1",
      baby_id: "b1",
      vaccine_code: "hexa",
      dose_no: 1,
      status: "done",
      created_by: "u1",
    });
    const skipped = applyDoseChange(
      [server],
      dose("upsert", "bcg#1", {
        vaccine_code: "bcg",
        dose_no: 1,
        status: "skipped",
        given_on: null,
      }),
      NOW,
    );
    expect(skipped).toEqual([
      { ...server, status: "skipped", given_on: null, updated_at: NOW },
    ]);
  });

  it("insert (quick tick) keeps a row that already exists", () => {
    const tick = dose("insert", "bcg#1", {
      vaccine_code: "bcg",
      dose_no: 1,
      status: "done",
    });
    expect(applyDoseChange([server], tick, NOW)).toEqual([server]);
    expect(applyDoseChange([], tick, NOW)[0]).toMatchObject({
      vaccine_code: "bcg",
      status: "done",
      given_on: null,
    });
  });

  it("delete removes the row by its dose key", () => {
    expect(
      applyDoseChange(
        [server],
        dose("delete", "bcg#1", { vaccine_code: "bcg", dose_no: 1 }),
        NOW,
      ),
    ).toEqual([]);
  });
});

describe("overlays keep tables apart", () => {
  it("overlayPendingDoses applies dose entries in order and ignores log entries", () => {
    const log: OutboxEntry = {
      ...dose("delete", "bcg#1", {}, 0),
      table: "logs",
    };
    const rows = overlayPendingDoses(
      [server],
      [
        dose("delete", "bcg#1", { vaccine_code: "bcg", dose_no: 1 }, 3),
        dose("upsert", "bcg#1", { ...marked, vaccine_code: "bcg" }, 2),
        log,
      ],
      NOW,
    );
    expect(rows).toEqual([]);
  });

  it("overlayPending for logs ignores vaccine entries", () => {
    const logRow = { id: "bcg#1" } as LogRow;
    const vaccine = dose("delete", "bcg#1", {
      vaccine_code: "bcg",
      dose_no: 1,
    });
    expect(overlayPending([logRow], [vaccine], () => true, NOW)).toEqual([
      logRow,
    ]);
    expect(entriesFor([vaccine], "logs")).toEqual([]);
  });
});
