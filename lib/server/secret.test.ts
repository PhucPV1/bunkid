import { describe, expect, it } from "vitest";
import { secretsMatch } from "./secret";

describe("secretsMatch", () => {
  it("accepts only the exact secret", () => {
    expect(secretsMatch("s3cret-value", "s3cret-value")).toBe(true);
    expect(secretsMatch("s3cret-valuE", "s3cret-value")).toBe(false);
    expect(secretsMatch("short", "s3cret-value")).toBe(false);
    expect(secretsMatch(null, "s3cret-value")).toBe(false);
    expect(secretsMatch("", "")).toBe(false);
  });
});
