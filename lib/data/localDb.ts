import Dexie, { type Table } from "dexie";
import type { OutboxEntry } from "./outboxCore";

export type KvRow = { key: string; value: unknown };

class LocalDb extends Dexie {
  kv!: Table<KvRow, string>;
  outbox!: Table<OutboxEntry, string>;

  constructor() {
    super("be-yeu");
    this.version(1).stores({ kv: "key" });
    this.version(2).stores({
      kv: "key",
      outbox: "id, createdAt, userId, babyId",
    });
  }
}

let db: LocalDb | null = null;

// Created on first use so server-side prerendering never touches IndexedDB.
export function localDb(): LocalDb {
  db ??= new LocalDb();
  return db;
}
