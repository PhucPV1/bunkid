import { describe, expect, it } from "vitest";
import { cx } from "./cx";

describe("cx", () => {
  it("joins truthy class names with one space", () => {
    expect(cx("a", false, null, undefined, "", "b")).toBe("a b");
    expect(cx()).toBe("");
  });
});
