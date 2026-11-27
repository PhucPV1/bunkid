import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EpisodeRow } from "@/lib/supabase/rows";
import { fetchEpisodes, useEpisodeActions, useEpisodes } from "./illness";

type Result = { data: unknown; error: unknown };

const db = vi.hoisted(() => ({
  calls: [] as unknown[][],
  result: { data: [], error: null } as Result,
}));
const queryClient = vi.hoisted(() => ({ name: "query client" }));
const enqueueEpisodeChange = vi.hoisted(() => vi.fn(async () => undefined));
const withPendingEpisodes = vi.hoisted(() =>
  vi.fn(async (_babyId: string, rows: unknown[]) => [...rows, "pending"]),
);

vi.mock("@/lib/supabase/client", () => ({
  supabase: () => ({
    from: (table: string) => {
      const chain: Record<string, unknown> = {};
      for (const name of ["select", "eq", "order"])
        chain[name] = (...args: unknown[]) => {
          db.calls.push([table, name, ...args]);
          return chain;
        };
      chain.then = (resolve: (value: Result) => void) => resolve(db.result);
      return chain;
    },
  }),
}));
// The hooks are called outside React here: each returns the options it was given.
vi.mock("@tanstack/react-query", () => ({
  useQuery: (options: unknown) => options,
  useMutation: (options: unknown) => options,
  useQueryClient: () => queryClient,
}));
vi.mock("./outbox", () => ({
  enqueueEpisodeChange,
  withPendingEpisodes,
  episodesKey: (babyId: string) => ["illness-episodes", babyId],
}));

const row = { id: "ep1" } as EpisodeRow;

beforeEach(() => {
  db.calls = [];
  db.result = { data: [row], error: null };
  enqueueEpisodeChange.mockClear();
  withPendingEpisodes.mockClear();
});

// Spec 2026-11-26 §4.2.
describe("fetchEpisodes", () => {
  it("reads every episode of the baby, newest start first, under the waiting changes", async () => {
    expect(await fetchEpisodes("b1")).toEqual([row, "pending"]);
    expect(db.calls).toEqual([
      ["illness_episodes", "select", "*"],
      ["illness_episodes", "eq", "baby_id", "b1"],
      ["illness_episodes", "order", "started_at", { ascending: false }],
    ]);
    expect(withPendingEpisodes).toHaveBeenCalledWith("b1", [row]);
  });

  it("throws the server's error", async () => {
    const error = { code: "42501", message: "denied" };
    db.result = { data: null, error };
    await expect(fetchEpisodes("b1")).rejects.toBe(error);
  });
});

type QueryOptions = {
  queryKey: unknown[];
  queryFn: () => Promise<unknown>;
  staleTime: number;
  refetchInterval: number;
};
type MutationOptions<T> = {
  networkMode: string;
  mutationFn: (value: T) => Promise<unknown>;
};

describe("useEpisodes", () => {
  it("is fresh for a minute and asks again every minute", async () => {
    const options = useEpisodes("b1") as unknown as QueryOptions;
    expect(options.queryKey).toEqual(["illness-episodes", "b1"]);
    expect(options.staleTime).toBe(60_000);
    expect(options.refetchInterval).toBe(60_000);
    expect(await options.queryFn()).toEqual([row, "pending"]);
  });
});

describe("useEpisodeActions", () => {
  const actions = () =>
    useEpisodeActions("b1", "u1") as unknown as {
      start: MutationOptions<{ startedAt: string }>;
      update: MutationOptions<{
        id: string;
        patch: { started_at?: string; ended_at?: string | null };
      }>;
      remove: MutationOptions<string>;
    };

  it("start queues an open episode under a new id and resolves to that id", async () => {
    const id = await actions().start.mutationFn({
      startedAt: "2026-11-25T02:00:00.000Z",
    });
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(enqueueEpisodeChange).toHaveBeenCalledWith(queryClient, {
      babyId: "b1",
      userId: "u1",
      op: "insert",
      rowId: id,
      row: { started_at: "2026-11-25T02:00:00.000Z", ended_at: null },
    });
  });

  it("update queues only the columns it was given", async () => {
    await actions().update.mutationFn({
      id: "ep1",
      patch: { ended_at: null },
    });
    expect(enqueueEpisodeChange).toHaveBeenCalledWith(queryClient, {
      babyId: "b1",
      userId: "u1",
      op: "update",
      rowId: "ep1",
      row: { ended_at: null },
    });
  });

  it("remove queues a delete", async () => {
    await actions().remove.mutationFn("ep1");
    expect(enqueueEpisodeChange).toHaveBeenCalledWith(queryClient, {
      babyId: "b1",
      userId: "u1",
      op: "delete",
      rowId: "ep1",
      row: null,
    });
  });

  it("every action also runs offline", () => {
    const all = actions();
    for (const action of [all.start, all.update, all.remove])
      expect(action.networkMode).toBe("always");
  });
});
