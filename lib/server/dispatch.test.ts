import { describe, expect, it, vi } from "vitest";
import type { BabyDispatchState } from "@/lib/rules/pushSelection";
import {
  handleDispatch,
  type DispatchDeps,
  type SendResult,
  type StoredSubscription,
} from "./dispatch";

const SECRET = "c".repeat(64);
const now = new Date("2026-11-15T03:00:00Z");

const dueBaby: BabyDispatchState = {
  babyId: "b1",
  name: "Bun",
  feedIntervalMin: 180,
  lastFeed: { id: "L1", startedAt: "2026-11-14T23:00:00Z" }, // 4 hours ago
  breastRunningSince: null,
  runningTimers: [],
  medicine: { schedules: [], loggedToday: [], lastAntipyretic: null },
  wake: null,
  vaccine: null,
  growth: { dob: "2026-01-01", sex: "male", rows: [] },
  recipients: [{ userId: "u1", prefs: null }],
};

function fakeDeps(
  subscriptions: StoredSubscription[],
  sendResult: (s: StoredSubscription) => SendResult = () => ({ ok: true }),
) {
  const log = new Set<string>();
  const deps = {
    cronSecret: () => SECRET,
    loadState: async () => [dueBaby],
    claim: vi.fn(
      async (item: { userId: string; kind: string; refKey: string }) => {
        const key = `${item.userId}|${item.kind}|${item.refKey}`;
        if (log.has(key)) return false;
        log.add(key);
        return true;
      },
    ),
    release: vi.fn(
      async (item: { userId: string; kind: string; refKey: string }) => {
        log.delete(`${item.userId}|${item.kind}|${item.refKey}`);
      },
    ),
    subscriptionsFor: async () => subscriptions,
    send: vi.fn(async (s: StoredSubscription) => sendResult(s)),
    deleteSubscription: vi.fn(async () => undefined),
    markSuccess: vi.fn(async () => undefined),
  } satisfies DispatchDeps;
  return deps;
}

const sub = (id: string): StoredSubscription => ({
  id,
  endpoint: `https://web.push.apple.com/${id}`,
  p256dh: "p",
  auth: "a",
});

const call = (deps: DispatchDeps, token?: string) =>
  handleDispatch(
    new Request("https://bunkid.test/api/push/dispatch", {
      method: "POST",
      headers: token ? { authorization: `Bearer ${token}` } : {},
    }),
    deps,
    now,
  );

describe("POST /api/push/dispatch", () => {
  it("answers 401 to a missing or wrong secret and sends nothing", async () => {
    const deps = fakeDeps([sub("s1")]);
    expect((await call(deps)).status).toBe(401);
    expect((await call(deps, "d".repeat(64))).status).toBe(401);
    expect(deps.send).not.toHaveBeenCalled();
  });

  it("sends each reminder once even when cron calls twice", async () => {
    const deps = fakeDeps([sub("s1"), sub("s2")]);
    const first = await call(deps, SECRET);
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ selected: 1, sent: 2, failed: 0 });
    expect(await (await call(deps, SECRET)).json()).toEqual({
      selected: 1,
      sent: 0,
      failed: 0,
    });
    expect(deps.send).toHaveBeenCalledTimes(2);
    expect(deps.markSuccess).toHaveBeenCalledWith("s1", now);
  });

  it("removes subscriptions the push service reports as gone (404/410)", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const deps = fakeDeps([sub("gone"), sub("expired"), sub("flaky")], (s) =>
      s.id === "gone"
        ? { ok: false, statusCode: 410 }
        : s.id === "expired"
          ? { ok: false, statusCode: 404 }
          : { ok: false, statusCode: 500 },
    );
    expect(await (await call(deps, SECRET)).json()).toEqual({
      selected: 1,
      sent: 0,
      failed: 3,
    });
    expect(deps.deleteSubscription.mock.calls).toEqual([["gone"], ["expired"]]);
    expect(error).toHaveBeenCalledWith("push send failed", "flaky", 500);
    error.mockRestore();
  });

  it("gives the claim back when no device got it and the failure is temporary", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    let down = true;
    const deps = fakeDeps([sub("s1")], () =>
      down ? { ok: false, statusCode: 503 } : { ok: true },
    );
    expect(await (await call(deps, SECRET)).json()).toEqual({
      selected: 1,
      sent: 0,
      failed: 1,
    });
    expect(deps.release).toHaveBeenCalledTimes(1);
    down = false;
    expect(await (await call(deps, SECRET)).json()).toEqual({
      selected: 1,
      sent: 1,
      failed: 0,
    });
    error.mockRestore();
  });

  it("keeps the claim when one device got it or the failure is final", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const partly = fakeDeps([sub("ok"), sub("flaky")], (s) =>
      s.id === "ok" ? { ok: true } : { ok: false, statusCode: null },
    );
    await call(partly, SECRET);
    expect(partly.release).not.toHaveBeenCalled();
    const refused = fakeDeps([sub("s1")], () => ({
      ok: false,
      statusCode: 403,
    }));
    await call(refused, SECRET);
    expect(refused.release).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it("answers 500 when the secret is not configured", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const deps = {
      ...fakeDeps([]),
      cronSecret: () => {
        throw new Error("Thiếu hoặc sai biến môi trường: CRON_SECRET");
      },
    };
    expect((await call(deps, SECRET)).status).toBe(500);
    error.mockRestore();
  });
});
