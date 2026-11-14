import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("app/globals.css", "utf8");

// iOS Safari paints a backdrop-filter element nested inside another one as opaque white
// (seen on /khan-cap: the secondary Button inside the glass profile card).
describe("nested glass", () => {
  it("glass inside glass drops its own backdrop filter, outside any layer", () => {
    const rule = css.match(
      /:is\(\.glass, \.glass-strong\) :is\(\.glass, \.glass-strong\) \{([^}]*)\}/,
    );
    expect(rule, "nested glass rule").not.toBeNull();
    expect(rule?.[1]).toContain("-webkit-backdrop-filter: none;");
    expect(rule?.[1]).toContain("backdrop-filter: none;");
    // Top level (no @layer, @media or @supports around it), so it beats the glass utilities.
    const before = css.slice(0, rule?.index);
    const depth =
      (before.match(/\{/g)?.length ?? 0) - (before.match(/\}/g)?.length ?? 0);
    expect(depth).toBe(0);
  });
});
