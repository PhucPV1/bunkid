import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildServiceWorker } from "./build-sw";

describe("buildServiceWorker", () => {
  it("fills in the cache version", () => {
    const out = buildServiceWorker(
      readFileSync("sw/sw.template.js", "utf8"),
      "abc123",
    );
    expect(out).toContain('const CACHE_VERSION = "abc123";');
    expect(out).not.toContain("__CACHE_VERSION__");
  });

  it("refuses a template without the placeholder", () => {
    expect(() => buildServiceWorker("self.x = 1;", "v")).toThrow(
      "sw.template.js has no __CACHE_VERSION__",
    );
  });
});
