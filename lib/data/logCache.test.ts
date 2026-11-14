import { describe, expect, it } from "vitest";
import { cacheHasLog } from "./logCache";

describe("cacheHasLog", () => {
  it("finds a row in a plain list", () => {
    expect(cacheHasLog([{ id: "a" }, { id: "b" }], "b")).toBe(true);
    expect(cacheHasLog([{ id: "a" }], "z")).toBe(false);
  });

  it("finds a row in infinite-query pages", () => {
    const data = { pages: [[{ id: "a" }], [{ id: "b" }]], pageParams: [0, 1] };
    expect(cacheHasLog(data, "b")).toBe(true);
    expect(cacheHasLog(data, "z")).toBe(false);
  });

  it("returns false for empty or unknown cache entries", () => {
    expect(cacheHasLog(undefined, "a")).toBe(false);
    expect(cacheHasLog(null, "a")).toBe(false);
    expect(cacheHasLog("x", "a")).toBe(false);
  });
});
