import { describe, expect, it } from "vitest";
import { authStorageKey, parseStoredSession } from "./storedSession";

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
});
