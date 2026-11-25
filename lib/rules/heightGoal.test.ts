import { describe, expect, it } from "vitest";
import type { LmsRow } from "@/lib/content/who";
import { addDays } from "./days";
import type { GrowthMeasure } from "./growthAlerts";
import {
  goalStatus,
  heightGoalRaw,
  lengthVelocity,
  midParental,
  parseHeightGoal,
  targetCurve,
  targetVsRange,
  targetZ,
} from "./heightGoal";

// L = 1, M = 16, S = 1/8 on every day: the value at z is 16 + 2z.
const FLAT: LmsRow[] = Array.from({ length: 1857 }, (_, d) => [
  d,
  1,
  16,
  0.125,
]);

// Spec 2026-11-25 §6.2.
describe("midParental", () => {
  it("a boy: the parents' mean plus 6,5, and a range of 8,5 either side, in whole cm", () => {
    expect(midParental(175, 160, "boys")).toEqual({
      mid: 174,
      low: 166,
      high: 183,
    });
  });

  it("a girl: the parents' mean minus 6,5", () => {
    expect(midParental(175, 160, "girls")).toEqual({
      mid: 161,
      low: 153,
      high: 170,
    });
  });

  it("keeps the middle as it is and rounds the two ends half up", () => {
    // mid 174,25: 165,75 → 166 and 182,75 → 183.
    expect(midParental(175.5, 160, "boys")).toEqual({
      mid: 174.25,
      low: 166,
      high: 183,
    });
    // mid 173,5: 165 and 182 exactly.
    expect(midParental(174, 160, "boys")).toEqual({
      mid: 173.5,
      low: 165,
      high: 182,
    });
  });
});

describe("targetZ", () => {
  it("is 0 at the median adult of the WHO reference", () => {
    expect(targetZ(176.5432, "boys")).toBeCloseTo(0, 9);
    expect(targetZ(163.1548, "girls")).toBeCloseTo(0, 9);
  });

  it("180 cm is about half a deviation above the median man, far above the median woman", () => {
    expect(targetZ(180, "boys")).toBeCloseTo(0.4737, 3);
    expect(targetZ(180, "girls")).toBeCloseTo(2.5756, 3);
  });

  it("a target below the median is negative", () => {
    expect(targetZ(170, "boys")).toBeLessThan(0);
  });
});

describe("targetCurve", () => {
  it("is the length at that z on each day, from birth, one point per step", () => {
    expect(targetCurve(FLAT, 1, 21, 7)).toEqual([
      { day: 0, value: 18 },
      { day: 7, value: 18 },
      { day: 14, value: 18 },
      { day: 21, value: 18 },
    ]);
  });

  it("follows the table as the median grows", () => {
    const growing: LmsRow[] = Array.from({ length: 1857 }, (_, d) => [
      d,
      1,
      50 + d,
      0.1,
    ]);
    expect(targetCurve(growing, -1, 10, 10)).toEqual([
      { day: 0, value: 45 },
      { day: 10, value: 54 },
    ]);
  });

  it("stops where the WHO table stops", () => {
    const points = targetCurve(FLAT, 0, 3000, 500);
    expect(points.map((point) => point.day)).toEqual([0, 500, 1000, 1500]);
  });
});

describe("goalStatus", () => {
  // The target line sits at 16 on every day (z 0).
  const at = (value: number) =>
    goalStatus({ reading: { value, ageDays: 76 }, z: 0, table: FLAT });

  it("within 1 cm of the line: close to it, on track", () => {
    for (const value of [15.1, 16, 16.9])
      expect(at(value)).toEqual({
        text: "Sát đường mục tiêu",
        short: "đang đúng hướng",
        chip: { text: "Đang đúng hướng", tone: "good" },
        diff: Math.round((value - 16) * 10) / 10,
      });
  });

  it("a hair under the line is a difference of 0, never minus zero", () => {
    expect(Object.is(at(15.96).diff, 0)).toBe(true);
  });

  it("1 cm or more above the line: says by how much, on track", () => {
    expect(at(17)).toEqual({
      text: "Trên đường mục tiêu 1,0 cm",
      short: "đang đúng hướng",
      chip: { text: "Đang đúng hướng", tone: "good" },
      diff: 1,
    });
    expect(at(18.25).text).toBe("Trên đường mục tiêu 2,3 cm");
  });

  it("1 cm or more below the line: says by how much, in a neutral chip, never a warning", () => {
    expect(at(15)).toEqual({
      text: "Dưới đường mục tiêu 1,0 cm",
      short: "dưới đường mục tiêu 1,0 cm",
      chip: { text: "Dưới đường mục tiêu", tone: "neutral" },
      diff: -1,
    });
    expect(at(12.6).text).toBe("Dưới đường mục tiêu 3,4 cm");
  });

  it("reads the line at the z of the target and the age of the measurement", () => {
    const growing: LmsRow[] = Array.from({ length: 1857 }, (_, d) => [
      d,
      1,
      50 + d,
      0.1,
    ]);
    // Day 10, z +1: 60 × 1,1 = 66.
    expect(
      goalStatus({
        reading: { value: 64.5, ageDays: 10 },
        z: 1,
        table: growing,
      }).text,
    ).toBe("Dưới đường mục tiêu 1,5 cm");
  });

  it("no length inside the WHO table yet: says so, with no chip", () => {
    expect(goalStatus({ reading: null, z: 0, table: FLAT })).toEqual({
      text: "Chưa có lần đo chiều dài",
      short: "chưa có lần đo chiều dài",
      chip: null,
      diff: null,
    });
    expect(
      goalStatus({ reading: { value: 110, ageDays: 1857 }, z: 0, table: FLAT })
        .chip,
    ).toBeNull();
  });
});

describe("targetVsRange", () => {
  const range = { mid: 174, low: 166, high: 183 };

  it("above the range: still followed, but hard to reach", () => {
    expect(targetVsRange(185, range)).toBe(
      "Mục tiêu 185 cm cao hơn khoảng dự kiến. App vẫn theo dõi, nhưng mục tiêu này khó đạt.",
    );
  });

  it("below the range", () => {
    expect(targetVsRange(165.5, range)).toBe(
      "Mục tiêu 165,5 cm thấp hơn khoảng dự kiến.",
    );
  });

  it("inside the range: the upper half from the middle up, the lower half below it", () => {
    expect(targetVsRange(180, range)).toBe(
      "Mục tiêu 180 cm nằm trong khoảng, ở nửa trên.",
    );
    expect(targetVsRange(174, range)).toBe(
      "Mục tiêu 174 cm nằm trong khoảng, ở nửa trên.",
    );
    expect(targetVsRange(173.9, range)).toBe(
      "Mục tiêu 173,9 cm nằm trong khoảng, ở nửa dưới.",
    );
  });

  it("the two ends of the range are inside it", () => {
    expect(targetVsRange(183, range)).toContain("nằm trong khoảng");
    expect(targetVsRange(166, range)).toContain("nằm trong khoảng");
  });
});

describe("lengthVelocity", () => {
  const DOB = "2026-01-01";
  // The median grows 1/8 cm a day from 50: 3,8 cm a month.
  const GROWING: LmsRow[] = Array.from({ length: 1857 }, (_, d) => [
    d,
    1,
    50 + d / 8,
    0.1,
  ]);
  const length = (age: number, cm: number | null): GrowthMeasure => ({
    measured_on: addDays(DOB, age),
    weight_g: 5000,
    length_cm: cm,
    head_cm: null,
  });
  const run = (rows: GrowthMeasure[]) => lengthVelocity(rows, GROWING, DOB);

  it("cm a month between the newest length and the nearest one at least 14 days before", () => {
    // 2 cm in 16 days is 3,8 cm a month, exactly what is usual.
    expect(run([length(56, 59), length(40, 57), length(10, 52)])).toEqual({
      rate: "3,8",
      expected: "3,8",
      from: addDays(DOB, 40),
      to: addDays(DOB, 56),
      chip: { text: "Tăng tốt", tone: "good" },
    });
  });

  it("a length less than 14 days before is skipped for an older one", () => {
    const speed = run([length(56, 59), length(43, 58.5), length(40, 57)]);
    expect(speed?.from).toBe(addDays(DOB, 40));
    expect(run([length(56, 59), length(42, 58)])?.from).toBe(addDays(DOB, 42));
  });

  it("at three quarters of the usual speed it is still good; just under, slower than usual", () => {
    // Usual over 16 days: 2 cm. Three quarters of that: 1,5 cm.
    expect(run([length(56, 58.5), length(40, 57)])?.chip).toEqual({
      text: "Tăng tốt",
      tone: "good",
    });
    expect(run([length(56, 58.4), length(40, 57)])).toMatchObject({
      rate: "2,7",
      expected: "3,8",
      chip: { text: "Chậm hơn thường gặp", tone: "neutral" },
    });
  });

  it("a length that barely moved reads 0,0, never minus zero", () => {
    expect(run([length(56, 56.98), length(40, 57)])).toMatchObject({
      rate: "0,0",
      chip: { text: "Chậm hơn thường gặp", tone: "neutral" },
    });
  });

  it("rows without a length are not measurements of length", () => {
    expect(
      run([length(56, null), length(50, 59), length(30, 56)]),
    ).toMatchObject({ from: addDays(DOB, 30), to: addDays(DOB, 50) });
  });

  it("is null without two lengths at least 14 days apart", () => {
    expect(run([])).toBeNull();
    expect(run([length(56, 59)])).toBeNull();
    expect(run([length(56, 59), length(43, 58)])).toBeNull();
  });

  it("a length outside the WHO table is left out", () => {
    expect(run([length(1857, 110), length(1800, 108)])).toBeNull();
  });
});

describe("parseHeightGoal", () => {
  const RANGE = "Chiều cao từ 120 đến 220 cm.";

  it("three heights, with a comma or a point", () => {
    expect(
      parseHeightGoal({ father: "175", mother: "160,5", target: "180.0" }),
    ).toEqual({
      ok: true,
      value: {
        father_height_cm: 175,
        mother_height_cm: 160.5,
        target_height_cm: 180,
      },
    });
  });

  it("all three empty is valid: it clears the goal", () => {
    expect(parseHeightGoal({ father: " ", mother: "", target: "" })).toEqual({
      ok: true,
      value: {
        father_height_cm: null,
        mother_height_cm: null,
        target_height_cm: null,
      },
    });
  });

  it("the target may be set or left empty on its own", () => {
    expect(
      parseHeightGoal({ father: "", mother: "", target: "180" }),
    ).toMatchObject({ ok: true, value: { target_height_cm: 180 } });
    expect(
      parseHeightGoal({ father: "175", mother: "160", target: "" }),
    ).toMatchObject({ ok: true, value: { target_height_cm: null } });
  });

  it("father and mother go together: the empty one carries the error", () => {
    expect(parseHeightGoal({ father: "175", mother: "", target: "" })).toEqual({
      ok: false,
      errors: { mother: "Nhập cả bố và mẹ." },
    });
    expect(
      parseHeightGoal({ father: "", mother: "160", target: "180" }),
    ).toEqual({ ok: false, errors: { father: "Nhập cả bố và mẹ." } });
  });

  it("each height stays within 120–220 cm", () => {
    expect(
      parseHeightGoal({ father: "119,9", mother: "220,1", target: "abc" }),
    ).toEqual({
      ok: false,
      errors: { father: RANGE, mother: RANGE, target: RANGE },
    });
    expect(
      parseHeightGoal({ father: "120", mother: "220", target: "120" }).ok,
    ).toBe(true);
  });

  it("a height out of range is not also asked for its partner", () => {
    expect(parseHeightGoal({ father: "300", mother: "", target: "" })).toEqual({
      ok: false,
      errors: { father: RANGE },
    });
  });

  it("rounds to one decimal", () => {
    expect(
      parseHeightGoal({ father: "175,25", mother: "160,04", target: "" }),
    ).toMatchObject({
      value: { father_height_cm: 175.3, mother_height_cm: 160 },
    });
  });
});

describe("heightGoalRaw", () => {
  it("fills the form from the profile, with a comma, empty where nothing is stored", () => {
    expect(
      heightGoalRaw({
        father_height_cm: 175,
        mother_height_cm: 160.5,
        target_height_cm: null,
      }),
    ).toEqual({ father: "175", mother: "160,5", target: "" });
  });
});
