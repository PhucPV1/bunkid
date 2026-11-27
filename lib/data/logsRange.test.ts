import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LogRow } from "@/lib/supabase/rows";
import { fetchLogsBetween, useRangeLogs } from "./logs";

type Result = { data: unknown; error: unknown };

// A stand-in for the Supabase client: every builder call is recorded, and each
// awaited request takes the next prepared page.
const db = vi.hoisted(() => ({
  calls: [] as unknown[][],
  pages: [] as Result[],
}));
const withPending = vi.hoisted(() =>
  vi.fn(
    async (
      _babyId: string,
      rows: unknown[],
      _inRange: (row: { started_at: string }) => boolean,
    ) => rows,
  ),
);

vi.mock("@/lib/supabase/client", () => ({
  supabase: () => ({
    from: (table: string) => {
      const chain: Record<string, unknown> = {};
      for (const name of ["select", "eq", "gte", "lt", "order", "range"])
        chain[name] = (...args: unknown[]) => {
          db.calls.push([table, name, ...args]);
          return chain;
        };
      chain.then = (resolve: (value: Result) => void) =>
        resolve(db.pages.shift() ?? { data: [], error: null });
      return chain;
    },
  }),
}));
vi.mock("@tanstack/react-query", () => ({
  useQuery: (options: unknown) => options,
  useInfiniteQuery: (options: unknown) => options,
  useMutation: (options: unknown) => options,
  useQueryClient: () => ({}),
}));
vi.mock("./outbox", () => ({ enqueueLogChange: vi.fn(), withPending }));

const rows = (count: number, prefix: string) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${prefix}${i}`,
    started_at: "2026-11-20T02:00:00.000Z",
  })) as LogRow[];
const page = (data: LogRow[]): Result => ({ data, error: null });
const FROM = "2026-11-19T17:00:00.000Z";
const TO = "2026-11-23T17:00:00.000Z";

beforeEach(() => {
  db.calls = [];
  db.pages = [];
  withPending.mockClear();
});

// Spec 2026-11-26 §4.2.
describe("fetchLogsBetween", () => {
  it("one short page: from..to, oldest first then id, rows 0–999", async () => {
    db.pages = [page(rows(3, "a"))];
    const result = await fetchLogsBetween("b1", FROM, TO);
    expect(result.map((row) => row.id)).toEqual(["a0", "a1", "a2"]);
    expect(db.calls).toEqual([
      ["logs", "select", "*"],
      ["logs", "eq", "baby_id", "b1"],
      ["logs", "gte", "started_at", FROM],
      ["logs", "lt", "started_at", TO],
      ["logs", "order", "started_at", { ascending: true }],
      ["logs", "order", "id"],
      ["logs", "range", 0, 999],
    ]);
  });

  it("an open range has no upper bound", async () => {
    db.pages = [page(rows(1, "a"))];
    await fetchLogsBetween("b1", FROM, null);
    expect(db.calls.map((call) => call[1])).toEqual([
      "select",
      "eq",
      "gte",
      "order",
      "order",
      "range",
    ]);
  });

  it("reads on while a page comes back full, and stops at the first short one", async () => {
    db.pages = [
      page(rows(1000, "a")),
      page(rows(1000, "b")),
      page(rows(7, "c")),
      page(rows(5, "never")),
    ];
    const result = await fetchLogsBetween("b1", FROM, null);
    expect(result).toHaveLength(2007);
    expect(result[2006].id).toBe("c6");
    expect(
      db.calls
        .filter((call) => call[1] === "range")
        .map((call) => call.slice(2)),
    ).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
    ]);
  });

  it("a page of exactly 1000 rows is followed by one more request", async () => {
    db.pages = [page(rows(1000, "a")), page([])];
    expect(await fetchLogsBetween("b1", FROM, TO)).toHaveLength(1000);
    expect(db.calls.filter((call) => call[1] === "range")).toHaveLength(2);
  });

  it("throws the server's error, also on a later page", async () => {
    const error = { code: "42501", message: "denied" };
    db.pages = [page(rows(1000, "a")), { data: null, error }];
    await expect(fetchLogsBetween("b1", FROM, TO)).rejects.toBe(error);
    expect(withPending).not.toHaveBeenCalled();
  });

  it("waiting inserts are laid over only when they fall inside the range", async () => {
    db.pages = [page(rows(2, "a"))];
    await fetchLogsBetween("b1", FROM, TO);
    expect(withPending).toHaveBeenCalledTimes(1);
    const [babyId, passed, inRange] = withPending.mock.calls[0];
    expect(babyId).toBe("b1");
    expect(passed).toHaveLength(2);
    const at = (started_at: string) => inRange({ started_at });
    expect(at("2026-11-19T16:59:59.999Z")).toBe(false);
    expect(at(FROM)).toBe(true);
    expect(at("2026-11-23T16:59:59.999Z")).toBe(true);
    expect(at(TO)).toBe(false);

    db.pages = [page([])];
    await fetchLogsBetween("b1", FROM, null);
    const open = withPending.mock.calls[1][2];
    expect(open({ started_at: "2026-11-19T16:59:59.999Z" })).toBe(false);
    expect(open({ started_at: "2031-01-01T00:00:00.000Z" })).toBe(true);
  });
});

type QueryOptions = {
  queryKey: unknown[];
  queryFn: () => Promise<unknown>;
  enabled: boolean;
};

describe("useRangeLogs", () => {
  it("keys the range under the baby's logs, so a log change refreshes it", () => {
    const closed = useRangeLogs("b1", FROM, TO) as unknown as QueryOptions;
    expect(closed.queryKey).toEqual(["logs", "b1", "range", FROM, TO]);
    expect(closed.enabled).toBe(true);
    const open = useRangeLogs("b1", FROM, null) as unknown as QueryOptions;
    expect(open.queryKey).toEqual(["logs", "b1", "range", FROM, "open"]);
  });

  it("reads through fetchLogsBetween, and not at all when switched off", async () => {
    db.pages = [page(rows(2, "a"))];
    const options = useRangeLogs("b1", FROM, TO) as unknown as QueryOptions;
    expect(await options.queryFn()).toHaveLength(2);
    const off = useRangeLogs("b1", FROM, TO, false) as unknown as QueryOptions;
    expect(off.enabled).toBe(false);
  });
});
