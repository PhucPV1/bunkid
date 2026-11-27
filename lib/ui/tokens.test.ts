import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { THEME_NAMES, THEMES, TOKEN_NAMES } from "./tokens";

const css = readFileSync("app/globals.css", "utf8");

const OPENERS = {
  light: "@theme {",
  rose: ':root[data-theme="rose"] {',
  peach: ':root[data-theme="peach"] {',
  lavender: ':root[data-theme="lavender"] {',
  sea: ':root[data-theme="sea"] {',
  dark: ':root[data-theme="dark"] {',
  night: ':root[data-theme="night"] {',
} as const;

function block(opener: string): Record<string, string> {
  const start = css.indexOf(opener);
  if (start < 0) throw new Error(`missing block ${opener}`);
  const body = css.slice(start + opener.length, css.indexOf("}", start));
  const vars: Record<string, string> = {};
  for (const m of body.matchAll(/--color-([a-z0-9-]+)\s*:\s*([^;]+);/g))
    vars[m[1]] = m[2].trim().replace(/\s+/g, " ");
  return vars;
}

describe("globals.css matches lib/ui/tokens.ts", () => {
  it.each(THEME_NAMES)(
    "%s block declares every token with the same value",
    (name) => {
      const vars = block(OPENERS[name]);
      for (const token of TOKEN_NAMES)
        expect(vars[token]?.toUpperCase(), `--color-${token}`).toBe(
          THEMES[name][token].toUpperCase(),
        );
    },
  );

  // Spec 2026-11-26 §9: the fever chart is printed with the doctor report,
  // black on white whatever the theme; its marks keep the light theme's
  // colours, so a dark theme does not print pale lines and dark halos.
  it("on paper the chart's colours are the light theme's", () => {
    const print = css.slice(css.indexOf("@media print {"));
    const start = print.indexOf(":root[data-theme] {");
    const vars = Object.fromEntries(
      [
        ...print
          .slice(start, print.indexOf("}", start))
          .matchAll(/--color-([a-z0-9-]+)\s*:\s*([^;]+);/g),
      ].map((m) => [m[1], m[2].trim().toUpperCase()]),
    );
    for (const token of [
      "glass-solid",
      "danger",
      "danger-ink",
      "cat-med",
      "cat-temp",
    ] as const)
      expect(vars[token], `--color-${token}`).toBe(
        THEMES.light[token].toUpperCase(),
      );
  });

  it("the legacy tokens are gone", () => {
    for (const name of LEGACY)
      expect(css, `--color-${name}`).not.toMatch(
        new RegExp(`--color-${name}\\s*:`),
      );
  });
});

const LEGACY = [
  "surface",
  "soft",
  "accent-soft",
  "accent-ink",
  "accent-line",
  "alarm",
];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
      ? [path]
      : [];
  });
}

describe("no legacy colour classes", () => {
  it("app and components use only current tokens", () => {
    const pattern = new RegExp(
      `\\b(?:bg|text|border|from|to|via|ring|outline|fill|stroke|decoration|divide|accent)-(?:${LEGACY.join("|")})\\b(?!-)`,
    );
    const problems = [...sourceFiles("app"), ...sourceFiles("components")]
      .filter((file) => pattern.test(readFileSync(file, "utf8")))
      .map(
        (file) => `${file}: ${readFileSync(file, "utf8").match(pattern)?.[0]}`,
      );
    expect(problems).toEqual([]);
  });
});
