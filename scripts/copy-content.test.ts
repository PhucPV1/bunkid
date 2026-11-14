import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { copyContent } from "./copy-content";

describe("copyContent", () => {
  it("copies only *.vi.json files into a fresh folder", () => {
    const from = mkdtempSync(join(tmpdir(), "content-"));
    const to = join(mkdtempSync(join(tmpdir(), "public-")), "content");
    writeFileSync(join(from, "vaccines.vi.json"), '{"a":1}');
    writeFileSync(join(from, "notes.md"), "skip me");
    expect(copyContent(from, to)).toEqual(["vaccines.vi.json"]);
    expect(readdirSync(to)).toEqual(["vaccines.vi.json"]);
    expect(readFileSync(join(to, "vaccines.vi.json"), "utf8")).toBe('{"a":1}');
  });
});
