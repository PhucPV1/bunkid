import Dexie, { type Table } from "dexie";

export type KvRow = { key: string; value: unknown };

class LocalDb extends Dexie {
  kv!: Table<KvRow, string>;

  constructor() {
    super("be-yeu");
    this.version(1).stores({ kv: "key" });
  }
}

let db: LocalDb | null = null;

// Created on first use so server-side prerendering never touches IndexedDB.
export function localDb(): LocalDb {
  db ??= new LocalDb();
  return db;
}
