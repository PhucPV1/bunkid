"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { outboxDeps } from "@/lib/data/outboxDeps";
import { flushRequests } from "@/lib/data/outboxEvents";
import { flushOutbox } from "@/lib/data/outboxFlush";

const FLUSH_EVERY_MS = 30_000;

// One flush at a time across tabs (Web Locks, Safari 15.4+); a tab that finds
// the lock taken skips this round.
async function withOutboxLock<T>(fn: () => Promise<T>): Promise<T | null> {
  if (!("locks" in navigator)) return fn();
  return navigator.locks.request(
    "be-yeu-outbox",
    { ifAvailable: true },
    async (lock) => (lock ? fn() : null),
  );
}

// Sends queued writes at start-up, when the network comes back, every 30 s
// while online, and right after each new write (spec §9).
export function OutboxSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const deps = outboxDeps();
    let running = false;
    let again = false;

    async function run() {
      if (!navigator.onLine) return;
      // A write queued during a flush is not in that flush's snapshot: run again after.
      if (running) {
        again = true;
        return;
      }
      running = true;
      let blocked = false;
      try {
        const result = await withOutboxLock(() => flushOutbox(deps));
        blocked = result?.blocked ?? false;
        if (result && result.sent + result.dropped > 0) {
          void queryClient.invalidateQueries({ queryKey: ["logs"] });
          void queryClient.invalidateQueries({ queryKey: ["first-log"] });
          // Also rolls back a refused dose mark (spec §9) and drops temporary rows.
          void queryClient.invalidateQueries({ queryKey: ["vaccine-doses"] });
          void queryClient.invalidateQueries({ queryKey: ["growth"] });
          void queryClient.invalidateQueries({ queryKey: ["milestones"] });
        }
      } catch (error) {
        console.warn("Không gửi được dữ liệu chờ đồng bộ", error);
      } finally {
        running = false;
        const rerun = again && !blocked;
        again = false;
        if (rerun) void run();
      }
    }

    void run();
    const timer = window.setInterval(() => void run(), FLUSH_EVERY_MS);
    const onOnline = () => void run();
    window.addEventListener("online", onOnline);
    const stopListening = flushRequests.listen(() => void run());
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("online", onOnline);
      stopListening();
    };
  }, [queryClient]);

  return null;
}
