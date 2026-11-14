import { describe, expect, it, vi } from "vitest";
import {
  bearerToken,
  handleSubscribe,
  handleUnsubscribe,
  type PushSubscriptionDeps,
} from "./pushSubscriptions";

function fakeDeps(): PushSubscriptionDeps & {
  upsertSubscription: ReturnType<typeof vi.fn>;
  deleteOwnSubscription: ReturnType<typeof vi.fn>;
} {
  return {
    userIdForToken: async (token) => (token === "good" ? "user-1" : null),
    upsertSubscription: vi.fn(async () => undefined),
    deleteOwnSubscription: vi.fn(async () => undefined),
  };
}

const post = (path: string, body: unknown, token?: string) =>
  new Request(`https://bunkid.test${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "iPhone",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const subscription = {
  endpoint: "https://web.push.apple.com/abc",
  keys: { p256dh: "BPkey", auth: "authsecret" },
};

describe("push subscription API", () => {
  it("bearerToken reads only a Bearer header", () => {
    expect(bearerToken("Bearer abc.def")).toBe("abc.def");
    expect(bearerToken("Basic abc")).toBeNull();
    expect(bearerToken(null)).toBeNull();
  });

  it("subscribe rejects a missing or unknown token with 401", async () => {
    const deps = fakeDeps();
    expect((await handleSubscribe(post("/s", subscription), deps)).status).toBe(
      401,
    );
    expect(
      (await handleSubscribe(post("/s", subscription, "bad"), deps)).status,
    ).toBe(401);
    expect(deps.upsertSubscription).not.toHaveBeenCalled();
  });

  it("subscribe rejects a bad body with 400", async () => {
    const deps = fakeDeps();
    for (const body of [
      "not json",
      { endpoint: "http://insecure.example/x", keys: subscription.keys },
      { endpoint: subscription.endpoint, keys: { p256dh: "", auth: "a" } },
    ])
      expect(
        (await handleSubscribe(post("/s", body, "good"), deps)).status,
      ).toBe(400);
    expect(deps.upsertSubscription).not.toHaveBeenCalled();
  });

  it("subscribe stores the subscription for the caller", async () => {
    const deps = fakeDeps();
    const response = await handleSubscribe(
      post("/s", subscription, "good"),
      deps,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(deps.upsertSubscription).toHaveBeenCalledWith({
      user_id: "user-1",
      endpoint: "https://web.push.apple.com/abc",
      p256dh: "BPkey",
      auth: "authsecret",
      user_agent: "iPhone",
    });
  });

  it("subscribe answers 500 when storing fails", async () => {
    const deps = fakeDeps();
    deps.upsertSubscription.mockRejectedValueOnce(new Error("db down"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(
      (await handleSubscribe(post("/s", subscription, "good"), deps)).status,
    ).toBe(500);
    error.mockRestore();
  });

  it("unsubscribe deletes with the caller's own token", async () => {
    const deps = fakeDeps();
    expect(
      (await handleUnsubscribe(post("/u", { endpoint: "x" }), deps)).status,
    ).toBe(401);
    expect((await handleUnsubscribe(post("/u", {}, "good"), deps)).status).toBe(
      400,
    );
    const response = await handleUnsubscribe(
      post("/u", { endpoint: subscription.endpoint }, "good"),
      deps,
    );
    expect(response.status).toBe(200);
    expect(deps.deleteOwnSubscription).toHaveBeenCalledWith(
      "good",
      subscription.endpoint,
    );
  });
});
