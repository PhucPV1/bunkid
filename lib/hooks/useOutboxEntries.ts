"use client";

import { liveQuery } from "dexie";
import { useEffect, useState } from "react";
import { localDb } from "@/lib/data/localDb";
import type { OutboxEntry } from "@/lib/data/outboxCore";

// The signed-in user's queued writes, updated live as the outbox changes.
export function useOutboxEntries(userId: string): OutboxEntry[] {
  const [entries, setEntries] = useState<OutboxEntry[]>([]);
  useEffect(() => {
    const subscription = liveQuery(() =>
      localDb().outbox.where("userId").equals(userId).sortBy("createdAt"),
    ).subscribe({ next: setEntries, error: () => setEntries([]) });
    return () => subscription.unsubscribe();
  }, [userId]);
  return entries;
}
