import { describe, expect, it } from "vitest";
import { ICON_PATHS } from "./icons";

// Spec 2026-11-25 §3.6.
describe("icons of the Sức khỏe and Tiện ích work", () => {
  it.each(["pulse", "grid", "flag", "alert", "pencil"] as const)(
    "%s is a stroke path that starts with a move",
    (name) => {
      expect(ICON_PATHS[name]).toMatch(/^[Mm]/);
      expect(ICON_PATHS[name].length).toBeGreaterThan(10);
    },
  );

  it("keeps every path unique", () => {
    const paths = Object.values(ICON_PATHS);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
