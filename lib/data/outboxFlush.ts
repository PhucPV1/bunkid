import { classifyFailure, type Failure, type OutboxEntry } from "./outboxCore";

export type SendOutcome = { ok: true } | { ok: false; failure: Failure };

export type FlushDeps = {
  currentUserId(): Promise<string | null>;
  pending(userId: string): Promise<OutboxEntry[]>;
  send(entry: OutboxEntry): Promise<SendOutcome>;
  remove(id: string): Promise<void>;
  bumpAttempts(id: string): Promise<void>;
  refreshSession(): Promise<boolean>;
  onDropped(entry: OutboxEntry, reason: string): void;
  onSignedOut(): void;
};

export type FlushResult = { sent: number; dropped: number; blocked: boolean };

// Spec §9: oldest first; stop at the first temporary error so order is kept.
export async function flushOutbox(deps: FlushDeps): Promise<FlushResult> {
  const result: FlushResult = { sent: 0, dropped: 0, blocked: false };
  const userId = await deps.currentUserId();
  if (!userId) return result;
  // Rows whose insert was refused: later changes to them can only fail, so
  // they are dropped quietly instead of reporting a misleading reason.
  const refusedRows = new Set<string>();
  for (const entry of await deps.pending(userId)) {
    if (refusedRows.has(entry.rowId)) {
      await deps.remove(entry.id);
      result.dropped += 1;
      continue;
    }
    const outcome = await deps.send(entry);
    if (outcome.ok) {
      await deps.remove(entry.id);
      result.sent += 1;
      continue;
    }
    const verdict = classifyFailure(outcome.failure, entry.attempts);
    if (verdict.kind === "drop") {
      await deps.remove(entry.id);
      if (entry.op === "insert") refusedRows.add(entry.rowId);
      deps.onDropped(entry, verdict.reason);
      result.dropped += 1;
      continue;
    }
    await deps.bumpAttempts(entry.id);
    result.blocked = true;
    if (verdict.kind === "refresh" && !(await deps.refreshSession()))
      deps.onSignedOut();
    break;
  }
  return result;
}
