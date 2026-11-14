import { describe, expect, it, vi } from "vitest";
import type { OutboxEntry } from "./outboxCore";
import { flushOutbox, type FlushDeps, type SendOutcome } from "./outboxFlush";

const entry = (id: string, createdAt: number): OutboxEntry => ({
  id,
  table: "logs",
  op: "insert",
  rowId: `row-${id}`,
  babyId: "b1",
  userId: "u1",
  row: {},
  createdAt,
  attempts: 0,
});

function deps(
  outcomes: Record<string, SendOutcome>,
  over: Partial<FlushDeps> = {},
  queue: OutboxEntry[] = [entry("1", 1), entry("2", 2), entry("3", 3)],
) {
  const d = {
    currentUserId: async () => "u1",
    pending: async () => queue,
    send: vi.fn(
      async (e: OutboxEntry) => outcomes[e.id] ?? { ok: true as const },
    ),
    remove: vi.fn(async () => undefined),
    bumpAttempts: vi.fn(async () => undefined),
    refreshSession: vi.fn(async () => true),
    onDropped: vi.fn(),
    onSignedOut: vi.fn(),
    ...over,
  };
  return d;
}

describe("flushOutbox (spec §9)", () => {
  it("sends everything oldest first", async () => {
    const d = deps({});
    expect(await flushOutbox(d)).toEqual({
      sent: 3,
      dropped: 0,
      blocked: false,
    });
    expect(vi.mocked(d.send).mock.calls.map(([e]) => e.id)).toEqual([
      "1",
      "2",
      "3",
    ]);
    expect(d.remove).toHaveBeenCalledTimes(3);
  });

  it("does nothing without a signed-in user", async () => {
    const d = deps({}, { currentUserId: async () => null });
    expect(await flushOutbox(d)).toEqual({
      sent: 0,
      dropped: 0,
      blocked: false,
    });
    expect(d.send).not.toHaveBeenCalled();
  });

  it("drops a permanent error, reports it and keeps going", async () => {
    const d = deps({
      "2": { ok: false, failure: { status: 409, code: "23505", message: "" } },
    });
    expect(await flushOutbox(d)).toEqual({
      sent: 2,
      dropped: 1,
      blocked: false,
    });
    expect(d.onDropped).toHaveBeenCalledWith(
      expect.objectContaining({ id: "2" }),
      "Đã có người bắt đầu trước",
    );
  });

  it("stops at the first temporary error and keeps the rest", async () => {
    const d = deps({
      "2": {
        ok: false,
        failure: { status: 0, code: null, message: "Failed to fetch" },
      },
    });
    expect(await flushOutbox(d)).toEqual({
      sent: 1,
      dropped: 0,
      blocked: true,
    });
    expect(d.send).toHaveBeenCalledTimes(2);
    expect(d.bumpAttempts).toHaveBeenCalledWith("2");
    expect(d.remove).toHaveBeenCalledTimes(1);
  });

  it("on 401 refreshes the session; if that fails it signs out but keeps the outbox", async () => {
    const expired = {
      ok: false as const,
      failure: { status: 401, code: "PGRST303", message: "" },
    };
    const ok = deps({ "1": expired });
    expect(await flushOutbox(ok)).toEqual({
      sent: 0,
      dropped: 0,
      blocked: true,
    });
    expect(ok.refreshSession).toHaveBeenCalled();
    expect(ok.onSignedOut).not.toHaveBeenCalled();

    const failed = deps(
      { "1": expired },
      { refreshSession: vi.fn(async () => false) },
    );
    await flushOutbox(failed);
    expect(failed.onSignedOut).toHaveBeenCalled();
    expect(failed.remove).not.toHaveBeenCalled();
  });

  it("quietly drops later changes to a row whose insert was refused", async () => {
    const stop: OutboxEntry = { ...entry("2", 2), op: "stop", rowId: "row-1" };
    const d = deps(
      {
        "1": {
          ok: false,
          failure: { status: 409, code: "23505", message: "" },
        },
      },
      {},
      [entry("1", 1), stop, entry("3", 3)],
    );
    expect(await flushOutbox(d)).toEqual({
      sent: 1,
      dropped: 2,
      blocked: false,
    });
    expect(vi.mocked(d.send).mock.calls.map(([e]) => e.id)).toEqual(["1", "3"]);
    expect(d.onDropped).toHaveBeenCalledTimes(1);
  });
});
