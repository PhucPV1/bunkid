import { describe, expect, it } from "vitest";
import type { Session } from "@supabase/supabase-js";
import {
  authStorageKey,
  effectiveSession,
  parseStoredSession,
} from "./storedSession";

describe("stored session", () => {
  it("authStorageKey matches the supabase-js default key", () => {
    expect(authStorageKey("https://abcdefgh.supabase.co")).toBe(
      "sb-abcdefgh-auth-token",
    );
    expect(authStorageKey("http://127.0.0.1:54321")).toBe("sb-127-auth-token");
  });

  it("parseStoredSession accepts a saved session and rejects anything else", () => {
    const saved = {
      access_token: "jwt",
      refresh_token: "r",
      expires_at: 1,
      user: { id: "u1", email: "me@example.com" },
    };
    expect(parseStoredSession(JSON.stringify(saved))?.user.id).toBe("u1");
    expect(parseStoredSession(null)).toBeNull();
    expect(parseStoredSession("not json")).toBeNull();
    expect(
      parseStoredSession(JSON.stringify({ access_token: "jwt" })),
    ).toBeNull();
  });

  it("effectiveSession falls back to the saved session until sign-out", () => {
    const live = { access_token: "new", user: { id: "u1" } } as Session;
    const saved = { access_token: "old", user: { id: "u1" } } as Session;
    expect(effectiveSession(live, saved)).toBe(live);
    // Refresh failed on the network: supabase-js gives null, storage still has it.
    expect(effectiveSession(null, saved)).toBe(saved);
    expect(effectiveSession(null, saved, "TOKEN_REFRESHED")).toBe(saved);
    // Refused refresh token or sign-out: storage was emptied.
    expect(effectiveSession(null, null)).toBeNull();
    expect(effectiveSession(null, saved, "SIGNED_OUT")).toBeNull();
  });
});
