import * as growth from "./growth";
import { describe, expect, it } from "vitest";
import {
  loadWhoTable,
  type WhoIndicator,
  type WhoSex,
} from "@/lib/content/who";
import {
  ageOnDay,
  assess,
  curve,
  lmsAt,
  normalCdf,
  percentile,
  rateZ,
  valueAtZ,
  zScore,
  type LmsRow,
} from "./growth";

// Reference values copied from the SD columns of the WHO expanded tables:
// [day, z, value] — the z-score of that value must come back as z.
const REFERENCES: Record<
  `${WhoIndicator}_${WhoSex}`,
  [number, number, number][]
> = {
  wfa_boys: [
    [0, 2, 4.419],
    [183, -2, 6.357],
    [365, 1, 10.755],
  ],
  wfa_girls: [
    [0, 2, 4.23],
    [183, -2, 5.733],
    [365, 1, 10.129],
  ],
  lhfa_boys: [
    [0, 2, 53.67],
    [183, -2, 63.362],
    [365, 1, 78.115],
  ],
  lhfa_girls: [
    [0, 2, 52.873],
    [183, -2, 61.217],
    [365, 1, 76.58],
  ],
  hcfa_boys: [
    [0, 2, 37.002],
    [183, -2, 40.898],
    [365, 1, 47.348],
  ],
  hcfa_girls: [
    [0, 2, 36.247],
    [183, -2, 39.602],
    [365, 1, 46.253],
  ],
};

describe("zScore against WHO reference values (spec §10.2)", () => {
  for (const [key, cases] of Object.entries(REFERENCES)) {
    it(key, async () => {
      const [indicator, sex] = key.split("_") as [WhoIndicator, WhoSex];
      const { rows } = await loadWhoTable(indicator, sex);
      for (const [day, z, value] of cases) {
        const lms = lmsAt(rows as LmsRow[], day);
        expect(lms).not.toBeNull();
        expect(zScore(lms!, value)).toBeCloseTo(z, 2);
        expect(valueAtZ(lms!, z)).toBeCloseTo(value, 2);
      }
    });
  }
});

describe("LMS helpers", () => {
  it("handles L = 0 and round-trips valueAtZ", () => {
    const lms = { l: 0, m: 10, s: 0.1 };
    expect(zScore(lms, 10 * Math.exp(0.1))).toBeCloseTo(1, 10);
    expect(valueAtZ(lms, -1)).toBeCloseTo(10 * Math.exp(-0.1), 10);
    const skewed = { l: -0.3, m: 7.5, s: 0.12 };
    expect(zScore(skewed, valueAtZ(skewed, 1.7))).toBeCloseTo(1.7, 10);
  });

  it("lmsAt returns null outside 0..1856 and for fractional days", () => {
    const rows: LmsRow[] = [
      [0, 1, 3, 0.1],
      [1, 1, 3.1, 0.1],
    ];
    expect(lmsAt(rows, 1)).toEqual({ l: 1, m: 3.1, s: 0.1 });
    expect(lmsAt(rows, 2)).toBeNull();
    expect(lmsAt(rows, -1)).toBeNull();
    expect(lmsAt(rows, 0.5)).toBeNull();
  });

  it("percentile = Φ(z)·100", () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 7);
    expect(percentile(1.881)).toBeCloseTo(97, 1);
    expect(percentile(-1.036)).toBeCloseTo(15, 1);
    expect(percentile(-2)).toBeCloseTo(2.275, 2);
  });
});

describe("rateZ (spec §7.3)", () => {
  it("green to |z| = 2, yellow to 3, red beyond", () => {
    expect(rateZ(2)).toEqual({ level: "green", text: null });
    expect(rateZ(-2)).toEqual({ level: "green", text: null });
    expect(rateZ(2.01)).toEqual({
      level: "yellow",
      text: "Nên hỏi bác sĩ ở lần khám tới",
    });
    expect(rateZ(-3)).toEqual({
      level: "yellow",
      text: "Nên hỏi bác sĩ ở lần khám tới",
    });
    expect(rateZ(3.01)).toEqual({ level: "red", text: "Nên cho bé đi khám" });
  });
});

describe("assess", () => {
  const rows: LmsRow[] = Array.from({ length: 70 }, (_, day) => [
    day,
    1,
    5,
    0.1,
  ]);

  it("uses the age on the measurement day", () => {
    expect(ageOnDay("2026-09-14", "2026-11-14")).toBe(61);
    expect(assess(rows, "2026-09-14", "2026-11-14", 6)).toEqual({
      ageDays: 61,
      z: expect.closeTo(2, 10),
      percentile: expect.closeTo(97.725, 2),
      level: "green",
      text: null,
    });
  });

  it("returns null before birth, past the table, or for an empty value", () => {
    expect(assess(rows, "2026-09-14", "2026-09-13", 5)).toBeNull();
    expect(assess(rows, "2026-09-14", "2026-12-14", 5)).toBeNull();
    expect(assess(rows, "2026-09-14", "2026-10-14", 0)).toBeNull();
  });
});

// Spec 2026-11-25 §5.4.
describe("curve", () => {
  it("gives the edges of the normal band (z −2 and z +2) and the median every `step` days", () => {
    const rows: LmsRow[] = Array.from({ length: 11 }, (_, day) => [
      day,
      1,
      10 + day,
      0.1,
    ]);
    const points = curve(rows, 0, 20, 5);
    expect(points.map((p) => p.day)).toEqual([0, 5, 10]);
    expect(Object.keys(points[1])).toEqual(["day", "low", "mid", "high"]);
    expect(points[1].mid).toBeCloseTo(15, 10);
    expect(points[1].high).toBeCloseTo(15 * (1 + 0.1 * 2), 10);
    expect(points[1].low).toBeCloseTo(15 * (1 - 0.1 * 2), 10);
  });

  it("BAND_LINES replaces the five percentile lines", () => {
    expect(growth.BAND_LINES).toEqual([
      { label: "low", z: -2 },
      { label: "mid", z: 0 },
      { label: "high", z: 2 },
    ]);
    expect(Object.keys(growth)).not.toContain("PERCENTILE_LINES");
  });
});
