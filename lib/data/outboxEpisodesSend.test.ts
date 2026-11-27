import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OutboxEntry } from "./outboxCore";
import { outboxDeps } from "./outboxDeps";

type Result = { data?: unknown; error: unknown; status: number };

// A stand-in for the Supabase client: every builder call is recorded, and each
// awaited request takes the next prepared result.
const db = vi.hoisted(() => ({
  calls: [] as unknown[][],
  results: [] as Result[],
}));

vi.mock("@/lib/supabase/client", () => ({
  supabase: () => ({
    from: (table: string) => {
      const chain: Record<string, unknown> = {};
      for (const name of ["upsert", "update", "delete", "select", "eq"])
        chain[name] = (...args: unknown[]) => {
          db.calls.push([table, name, ...args]);
          return chain;
        };
      chain.then = (resolve: (value: Result) => void) =>
        resolve(db.results.shift() ?? { data: [], error: null, status: 200 });
      return chain;
    },
  }),
}));

const entry = (
  op: OutboxEntry["op"],
  row: Record<string, unknown> | null,
  table: OutboxEntry["table"] = "illness_episodes",
): OutboxEntry => ({
  id: "e1",
  table,
  op,
  rowId: "ep1",
  babyId: "b1",
  userId: "u1",
  row,
  createdAt: 1,
  attempts: 0,
});

const send = (e: OutboxEntry) => outboxDeps().send(e);
const START = "2026-11-25T02:00:00.000Z";
const END = "2026-11-26T02:00:00.000Z";

beforeEach(() => {
  db.calls = [];
  db.results = [];
});

// Spec 2026-11-26 §4.2.
describe("sending an illness_episodes entry", () => {
  it("insert is an upsert on id that never overwrites, open unless an end came with it", async () => {
    db.results = [{ error: null, status: 201 }];
    expect(await send(entry("insert", { started_at: START }))).toEqual({
      ok: true,
    });
    expect(db.calls).toEqual([
      [
        "illness_episodes",
        "upsert",
        { id: "ep1", baby_id: "b1", started_at: START, ended_at: null },
        { onConflict: "id", ignoreDuplicates: true },
      ],
    ]);
    db.calls = [];
    await send(entry("insert", { started_at: START, ended_at: END }));
    expect(db.calls[0][2]).toMatchObject({ ended_at: END });
  });

  it("an overlap refused by the server comes back with its code", async () => {
    db.results = [
      {
        error: { code: "23P01", message: "conflicting key value" },
        status: 409,
      },
    ];
    expect(await send(entry("insert", { started_at: START }))).toEqual({
      ok: false,
      failure: {
        status: 409,
        code: "23P01",
        message: "conflicting key value",
      },
    });
  });

  it("update sends only the changed columns; no row changed means it was refused", async () => {
    db.results = [{ data: [{ id: "ep1" }], error: null, status: 200 }];
    expect(await send(entry("update", { ended_at: null }))).toEqual({
      ok: true,
    });
    expect(db.calls).toEqual([
      ["illness_episodes", "update", { ended_at: null }],
      ["illness_episodes", "eq", "id", "ep1"],
      ["illness_episodes", "select", "id"],
    ]);
    db.results = [{ data: [], error: null, status: 200 }];
    expect(await send(entry("update", { ended_at: END }))).toEqual({
      ok: false,
      failure: { zeroRows: true },
    });
  });

  it("delete: a row already gone counts as done, a row still there was refused", async () => {
    db.results = [{ data: [{ id: "ep1" }], error: null, status: 200 }];
    expect(await send(entry("delete", null))).toEqual({ ok: true });
    expect(db.calls).toEqual([
      ["illness_episodes", "delete"],
      ["illness_episodes", "eq", "id", "ep1"],
      ["illness_episodes", "select", "id"],
    ]);
    db.results = [
      { data: [], error: null, status: 200 },
      { data: [], error: null, status: 200 },
    ];
    expect(await send(entry("delete", null))).toEqual({ ok: true });
    db.results = [
      { data: [], error: null, status: 200 },
      { data: [{ id: "ep1" }], error: null, status: 200 },
    ];
    expect(await send(entry("delete", null))).toEqual({
      ok: false,
      failure: { zeroRows: true },
    });
  });

  it("an op episodes do not have is refused without a request", async () => {
    expect(await send(entry("stop", { ended_at: END }))).toEqual({
      ok: false,
      failure: { status: 400, code: null, message: "unsupported outbox entry" },
    });
    expect(db.calls).toEqual([]);
  });

  it("the other tables still go where they went", async () => {
    await send(entry("delete", null, "growth"));
    await send(entry("delete", null, "logs"));
    expect(db.calls.map((call) => call[0])).toEqual([
      "growth",
      "growth",
      "growth",
      "growth",
      "growth",
      "logs",
      "logs",
      "logs",
      "logs",
      "logs",
    ]);
  });
});
