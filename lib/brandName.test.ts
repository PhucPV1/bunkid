import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Built from two parts so this file does not match itself.
const OLD_NAME = ["Bé", "Yêu"].join(" ");
const ROOTS = ["app", "components", "lib", "sw", "scripts"];
const FILES = ["public/manifest.webmanifest", "README.md"];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return /\.(ts|tsx|js|json|md|webmanifest)$/.test(name) ? [path] : [];
  });
}

describe("app name", () => {
  it("no user-visible text still says the old name", () => {
    const hits = [...ROOTS.flatMap(walk), ...FILES].filter((file) =>
      readFileSync(file, "utf8").includes(OLD_NAME),
    );
    expect(hits).toEqual([]);
  });

  it("the manifest uses the new name", () => {
    const manifest = JSON.parse(
      readFileSync("public/manifest.webmanifest", "utf8"),
    );
    expect(manifest.name).toBe("Kim Bun");
    expect(manifest.short_name).toBe("Kim Bun");
  });
});
