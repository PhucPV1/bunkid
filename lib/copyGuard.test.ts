import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
      ? [path]
      : [];
  });
}

// Spec 2026-11-19 §10: the tummy timer is "Nằm sấp" everywhere on screen.
describe("copy guard", () => {
  it('no source file shows the English word "Tummy"', () => {
    const files = [...sourceFiles("components"), ...sourceFiles("lib")];
    const problems = files.filter((file) =>
      readFileSync(file, "utf8").includes("Tummy"),
    );
    expect(problems).toEqual([]);
  });
});
