import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PALETTE =
  /\b(?:bg|text|border|divide|ring|fill|stroke|outline|from|to|via|placeholder|caret|decoration|shadow)-(?:white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d+)?(?:\/\d+)?/g;
const ALLOWED = new Set(["bg-black/40"]);

function tsxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return tsxFiles(path);
    return entry.name.endsWith(".tsx") ? [path] : [];
  });
}

describe("theme guard", () => {
  it("UI code uses theme colors, not fixed palette classes or hex colors", () => {
    const problems: string[] = [];
    for (const file of [...tsxFiles("app"), ...tsxFiles("components")]) {
      const source = readFileSync(file, "utf8");
      for (const match of source.match(PALETTE) ?? [])
        if (!ALLOWED.has(match)) problems.push(`${file}: ${match}`);
      if (file.startsWith("components") && /#[0-9a-fA-F]{6}\b/.test(source))
        problems.push(`${file}: hex color`);
    }
    expect(problems).toEqual([]);
  });
});
