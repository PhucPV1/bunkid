import { describe, expect, it } from "vitest";
import { contrastRatio, hue, mixOver, parseColor } from "./contrast";

describe("contrast", () => {
  it("parses hex and space-separated rgb with alpha", () => {
    expect(parseColor("#FBF3F0")).toEqual({ r: 251, g: 243, b: 240, a: 1 });
    expect(parseColor("rgb(255 255 255 / 0.55)")).toEqual({
      r: 255,
      g: 255,
      b: 255,
      a: 0.55,
    });
    expect(parseColor("rgb(43 27 34)")).toEqual({ r: 43, g: 27, b: 34, a: 1 });
    expect(() => parseColor("oklch(50% 0.1 20)")).toThrow();
  });

  it("mixes a translucent colour over a background", () => {
    expect(mixOver("rgb(255 255 255 / 0.55)", "#FBF3F0")).toBe("#fdfaf8");
    expect(mixOver("#123456", "#FFFFFF")).toBe("#123456");
  });

  it("matches known WCAG ratios", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
    expect(contrastRatio("#767676", "#FFFFFF")).toBeCloseTo(4.54, 2);
    expect(contrastRatio("#FFFFFF", "#767676")).toBeCloseTo(4.54, 2);
  });

  it("finds the hue, or null for greys", () => {
    expect(hue("#FF0000")).toBeCloseTo(0, 5);
    expect(hue("#0000FF")).toBeCloseTo(240, 5);
    expect(hue("#00FFFF")).toBeCloseTo(180, 5);
    expect(hue("#808080")).toBeNull();
    expect(hue("rgb(0 0 0 / 0.55)")).toBeNull();
  });
});
