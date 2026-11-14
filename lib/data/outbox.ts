"use client";

import type { QueryClient } from "@tanstack/react-query";
import type { LogRow } from "@/lib/supabase/rows";
import { localDb } from "./localDb";
import { applyToCache, overlayPending, type OutboxEntry } from "./outboxCore";
import { flushRequests } from "./outboxEvents";

export type LogChange = Pick<
  OutboxEntry,
  "op" | "rowId" | "babyId" | "userId" | "row"
>;

let lastCreatedAt = 0;

// Strictly increasing, so a stop and a start queued in the same millisecond keep
// their order; seeded from the outbox so a clock that moved back after a reload
// cannot sort a new entry before older ones.
async function nextCreatedAt(): Promise<number> {
  const newest = await localDb().outbox.orderBy("createdAt").last();
  lastCreatedAt = Math.max(
    Date.now(),
    lastCreatedAt + 1,
    (newest?.createdAt ?? 0) + 1,
  );
  return lastCreatedAt;
}

export async function enqueueLogChange(
  queryClient: QueryClient,
  change: LogChange,
): Promise<void> {
  const entry: OutboxEntry = {
    ...change,
    id: crypto.randomUUID(),
    table: "logs",
    createdAt: await nextCreatedAt(),
    attempts: 0,
  };
  await localDb().outbox.add(entry);
  // A refetch already in flight would overwrite the optimistic change below.
  await queryClient.cancelQueries({ queryKey: ["logs", change.babyId] });
  const nowIso = new Date().toISOString();
  queryClient.setQueriesData({ queryKey: ["logs", change.babyId] }, (data) =>
    applyToCache(data, entry, nowIso),
  );
  flushRequests.emit();
}

export async function withPending(
  babyId: string,
  rows: LogRow[],
  inRange: (row: LogRow) => boolean,
): Promise<LogRow[]> {
  try {
    const entries = await localDb()
      .outbox.where("babyId")
      .equals(babyId)
      .toArray();
    return overlayPending(rows, entries, inRange, new Date().toISOString());
  } catch {
    return rows;
  }
}
