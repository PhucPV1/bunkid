import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EpisodeRow } from "@/lib/supabase/rows";
import {
  enqueueEpisodeChange,
  episodesKey,
  REFRESH_AFTER_FLUSH,
  withPendingEpisodes,
} from "./outbox";
import type { OutboxEntry } from "./outboxCore";
import { flushRequests } from "./outboxEvents";

// A stand-in for the device's IndexedDB outbox table.
const store = vi.hoisted(() => ({
  entries: [] as OutboxEntry[],
  broken: false,
}));

vi.mock("./localDb", () => ({
  localDb: () => ({
    outbox: {
      add: async (entry: OutboxEntry) => {
        store.entries.push(entry);
      },
      orderBy: () => ({ last: async () => store.entries.at(-1) }),
      where: (field: keyof OutboxEntry) => ({
        equals: (value: unknown) => ({
          toArray: async () => {
            if (store.broken) throw new Error("IndexedDB is not available");
            return store.entries.filter((entry) => entry[field] === value);
          },
        }),
      }),
    },
  }),
}));

const october: EpisodeRow = {
  id: "ep1",
  baby_id: "b1",
  started_at: "2026-10-10T01:00:00.000Z",
  ended_at: "2026-10-13T02:00:00.000Z",
  created_by: "u0",
  created_at: "2026-10-10T01:00:00.000Z",
  updated_at: "2026-10-13T02:00:00.000Z",
};
const START = "2026-11-25T02:00:00.000Z";
const start = (babyId = "b1") => ({
  op: "insert" as const,
  rowId: `ep-${babyId}`,
  babyId,
  userId: "u1",
  row: { started_at: START },
});

beforeEach(() => {
  store.entries = [];
  store.broken = false;
});

// Spec 2026-11-26 §4.2.
describe("enqueueEpisodeChange", () => {
  it("has its own query key per baby", () => {
    expect(episodesKey("b1")).toEqual(["illness-episodes", "b1"]);
  });

  it("queues the change, shows it at once and asks for a flush", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(episodesKey("b1"), [october]);
    const flushed = vi.fn();
    const stop = flushRequests.listen(flushed);
    await enqueueEpisodeChange(queryClient, start());
    stop();
    expect(store.entries).toHaveLength(1);
    expect(store.entries[0]).toMatchObject({
      table: "illness_episodes",
      op: "insert",
      rowId: "ep-b1",
      babyId: "b1",
      userId: "u1",
      row: { started_at: START },
      attempts: 0,
    });
    expect(
      queryClient
        .getQueryData<EpisodeRow[]>(episodesKey("b1"))
        ?.map((row) => [row.id, row.ended_at]),
    ).toEqual([
      ["ep-b1", null],
      ["ep1", "2026-10-13T02:00:00.000Z"],
    ]);
    expect(flushed).toHaveBeenCalledTimes(1);
  });

  it("leaves a list that never loaded alone, and keeps the order of two quick changes", async () => {
    const queryClient = new QueryClient();
    await enqueueEpisodeChange(queryClient, start());
    await enqueueEpisodeChange(queryClient, {
      op: "update",
      rowId: "ep-b1",
      babyId: "b1",
      userId: "u1",
      row: { ended_at: "2026-11-26T02:00:00.000Z" },
    });
    expect(queryClient.getQueryData(episodesKey("b1"))).toBeUndefined();
    expect(store.entries[1].createdAt).toBeGreaterThan(
      store.entries[0].createdAt,
    );
  });
});

describe("REFRESH_AFTER_FLUSH", () => {
  it("refreshes the episodes after a flush, so a refused change does not stay on screen", () => {
    expect(REFRESH_AFTER_FLUSH).toContainEqual([episodesKey("b1")[0]]);
    // The lists that were refreshed before still are.
    expect(REFRESH_AFTER_FLUSH.map((key) => key[0])).toEqual([
      "logs",
      "first-log",
      "vaccine-doses",
      "growth",
      "milestones",
      "illness-episodes",
    ]);
  });
});

describe("withPendingEpisodes", () => {
  it("lays this baby's waiting changes over the server's rows", async () => {
    const queryClient = new QueryClient();
    await enqueueEpisodeChange(queryClient, start());
    await enqueueEpisodeChange(queryClient, start("b2"));
    const rows = await withPendingEpisodes("b1", [october]);
    expect(rows.map((row) => row.id)).toEqual(["ep-b1", "ep1"]);
  });

  it("returns the server's rows when the device store cannot be read", async () => {
    store.broken = true;
    const rows = [october];
    expect(await withPendingEpisodes("b1", rows)).toBe(rows);
  });
});
