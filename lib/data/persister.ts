import type {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client";
import { localDb, type KvRow } from "./localDb";

export const PERSIST_KEY = "react-query";
export const PERSIST_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const WRITE_DELAY_MS = 1000;

type KvTable = {
  put(row: KvRow): Promise<unknown>;
  get(key: string): Promise<KvRow | undefined>;
  delete(key: string): Promise<unknown>;
};

function warn(error: unknown) {
  console.warn("Không lưu được dữ liệu để xem offline", error);
}

// The cache changes many times a second while queries load, so writes are
// batched: only the latest snapshot is written, at most once per second.
export function createDexiePersister(
  table: () => KvTable = () => localDb().kv,
): Persister {
  let pending: PersistedClient | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  async function flush() {
    timer = null;
    const client = pending;
    pending = null;
    if (client)
      await table().put({ key: PERSIST_KEY, value: client }).catch(warn);
  }

  return {
    persistClient: (client: PersistedClient) => {
      pending = client;
      timer ??= setTimeout(() => void flush(), WRITE_DELAY_MS);
    },
    restoreClient: async () => {
      try {
        return (await table().get(PERSIST_KEY))?.value as
          PersistedClient | undefined;
      } catch (error) {
        warn(error);
        return undefined;
      }
    },
    removeClient: async () => {
      pending = null;
      if (timer) clearTimeout(timer);
      timer = null;
      await table().delete(PERSIST_KEY).catch(warn);
    },
  };
}
