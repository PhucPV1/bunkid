import { describe, expect, it } from "vitest";
import { contrastRatio, hue, mixOver } from "@/lib/rules/contrast";
import { THEME_NAMES, THEMES, TOKEN_NAMES, type TokenName } from "./tokens";

const TEXT: TokenName[] = [
  "ink",
  "muted",
  "accent-text",
  "good",
  "warn",
  "danger",
  "cat-feed",
  "cat-bottle",
  "cat-sleep",
  "cat-diaper",
  "cat-pump",
  "cat-tummy",
  "cat-med",
  "cat-temp",
];
const PAIRS: [TokenName, TokenName][] = [
  ["on-accent", "accent"],
  ["on-danger", "danger-solid"],
  ["danger-ink", "danger-soft"],
  ["warn-ink", "warn-soft"],
  ["good-ink", "good-soft"],
];

describe.each(THEME_NAMES)("theme %s", (name) => {
  const t = THEMES[name];
  const glassOverBg = mixOver(t.glass, t.bg);

  it.each(TEXT)("%s reads at ≥ 4.5:1 on the page and on glass", (token) => {
    expect(contrastRatio(t[token], t.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(t[token], glassOverBg)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(PAIRS)("%s on %s reads at ≥ 4.5:1", (fg, bg) => {
    expect(contrastRatio(t[fg], t[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it("the switch's on colour stands out from the page at ≥ 3:1", () => {
    expect(contrastRatio(t["switch-on"], t.bg)).toBeGreaterThanOrEqual(3);
  });
});

describe("Ban đêm", () => {
  it("has no pure white and no blue or cyan anywhere", () => {
    for (const token of TOKEN_NAMES) {
      const value = THEMES.night[token];
      expect(value.toUpperCase()).not.toBe("#FFFFFF");
      const h = hue(value);
      if (h !== null)
        expect(h < 180 || h > 260, `${token} ${value} hue ${h}`).toBe(true);
    }
  });
});
