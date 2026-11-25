import { describe, expect, it } from "vitest";
import raw from "@/content/who/adult_height.json";
import { ADULT_HEIGHT, AdultHeightSchema } from "./adultHeight";

// Spec 2026-11-25 §6.2: WHO Growth Reference 2007, height-for-age at 19 years.
describe("content/who/adult_height.json", () => {
  it("passes its schema and names its source and review day", () => {
    expect(AdultHeightSchema.parse(raw)).toEqual(ADULT_HEIGHT);
    expect(ADULT_HEIGHT.source).toMatch(
      /^https:\/\/www\.who\.int\/.+height-for-age$/,
    );
    expect(ADULT_HEIGHT.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("the median adult is where the WHO reference puts it", () => {
    expect(ADULT_HEIGHT.boys.m).toBeGreaterThanOrEqual(176.0);
    expect(ADULT_HEIGHT.boys.m).toBeLessThanOrEqual(177.0);
    expect(ADULT_HEIGHT.girls.m).toBeGreaterThanOrEqual(162.7);
    expect(ADULT_HEIGHT.girls.m).toBeLessThanOrEqual(163.7);
  });

  it("S is a small positive spread for both sexes", () => {
    for (const sex of ["boys", "girls"] as const) {
      expect(ADULT_HEIGHT[sex].s).toBeGreaterThan(0.03);
      expect(ADULT_HEIGHT[sex].s).toBeLessThan(0.05);
    }
  });

  it("rejects a file with a missing sex, an unknown key or a bad source", () => {
    const { girls: _girls, ...noGirls } = ADULT_HEIGHT;
    expect(AdultHeightSchema.safeParse(noGirls).success).toBe(false);
    expect(
      AdultHeightSchema.safeParse({ ...ADULT_HEIGHT, extra: 1 }).success,
    ).toBe(false);
    expect(
      AdultHeightSchema.safeParse({ ...ADULT_HEIGHT, source: "who" }).success,
    ).toBe(false);
    expect(
      AdultHeightSchema.safeParse({
        ...ADULT_HEIGHT,
        boys: { ...ADULT_HEIGHT.boys, m: 0 },
      }).success,
    ).toBe(false);
  });
});
