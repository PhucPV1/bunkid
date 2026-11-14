import type { PersistedClient } from "@tanstack/react-query-persist-client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createDexiePersister, PERSIST_KEY } from "./persister";

function memoryTable() {
  const rows = new Map<string, unknown>();
  const put = vi.fn(async (row: { key: string; value: unknown }) => {
    rows.set(row.key, row.value);
  });
  return {
    rows,
    put,
    table: () => ({
      put,
      get: async (key: string) =>
        rows.has(key) ? { key, value: rows.get(key) } : undefined,
      delete: async (key: string) => {
        rows.delete(key);
      },
    }),
  };
}

const snapshot = (timestamp: number): PersistedClient => ({
  timestamp,
  buster: "",
  clientState: { queries: [], mutations: [] },
});

afterEach(() => vi.useRealTimers());

describe("createDexiePersister", () => {
  it("writes only the latest snapshot, once per second", async () => {
    vi.useFakeTimers();
    const memory = memoryTable();
    const persister = createDexiePersister(memory.table);
    expect(await persister.restoreClient()).toBeUndefined();
    await persister.persistClient(snapshot(1));
    await persister.persistClient(snapshot(2));
    expect(memory.put).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1000);
    expect(memory.put).toHaveBeenCalledTimes(1);
    expect([...memory.rows.keys()]).toEqual([PERSIST_KEY]);
    expect(await persister.restoreClient()).toEqual(snapshot(2));
    await persister.removeClient();
    expect(await persister.restoreClient()).toBeUndefined();
  });

  it("never throws when IndexedDB fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const broken = () => ({
      put: async () => {
        throw new Error("quota");
      },
      get: async () => {
        throw new Error("blocked");
      },
      delete: async () => {
        throw new Error("blocked");
      },
    });
    const persister = createDexiePersister(broken);
    expect(await persister.restoreClient()).toBeUndefined();
    await persister.removeClient();
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });
});
