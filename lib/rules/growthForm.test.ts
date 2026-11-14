import { describe, expect, it } from "vitest";
import {
  chartRange,
  formatGrowthValue,
  formatPercentile,
  formatZ,
  growthToRaw,
  indicatorValue,
  latestWeightG,
  parseGrowthForm,
} from "./growthForm";

const ctx = { dob: "2026-09-14", today: "2026-11-14" };
const raw = {
  measuredOn: "2026-11-14",
  weightKg: "",
  lengthCm: "",
  headCm: "",
};

describe("parseGrowthForm", () => {
  it("accepts a comma or a dot and converts kg to grams", () => {
    expect(
      parseGrowthForm(
        { ...raw, weightKg: "5,125", lengthCm: "58.46", headCm: " 39 " },
        ctx,
      ),
    ).toEqual({
      ok: true,
      value: {
        measured_on: "2026-11-14",
        weight_g: 5125,
        length_cm: 58.5,
        head_cm: 39,
      },
    });
  });

  it("needs a date between birth and today and at least one value", () => {
    expect(
      parseGrowthForm({ ...raw, measuredOn: "2026-11-15", headCm: "39" }, ctx),
    ).toEqual({
      ok: false,
      errors: { measuredOn: "Ngày đo phải từ ngày sinh đến hôm nay." },
    });
    expect(parseGrowthForm(raw, ctx)).toEqual({
      ok: false,
      errors: { weightKg: "Nhập ít nhất một số đo." },
    });
  });

  it("rejects values outside the ranges or that are not numbers", () => {
    expect(
      parseGrowthForm(
        { ...raw, weightKg: "41", lengthCm: "abc", headCm: "19,9" },
        ctx,
      ),
    ).toEqual({
      ok: false,
      errors: {
        weightKg: "Cân nặng từ 0,3 đến 40 kg.",
        lengthCm: "Chiều dài từ 20 đến 130 cm.",
        headCm: "Vòng đầu từ 20 đến 60 cm.",
      },
    });
  });
});

describe("display helpers", () => {
  const row = {
    measured_on: "2026-11-14",
    weight_g: 5125,
    length_cm: 58.5,
    head_cm: null,
  };

  it("growthToRaw writes commas back for editing", () => {
    expect(growthToRaw(row)).toEqual({
      measuredOn: "2026-11-14",
      weightKg: "5,125",
      lengthCm: "58,5",
      headCm: "",
    });
  });

  it("formats values, z and percentiles the Vietnamese way", () => {
    expect(formatGrowthValue("wfa", 5.125)).toBe("5,13 kg");
    expect(formatGrowthValue("hcfa", 39)).toBe("39 cm");
    expect(formatZ(0.456)).toBe("+0,5");
    expect(formatZ(-2.04)).toBe("-2,0");
    expect(formatZ(0)).toBe("0,0");
    expect(formatPercentile(67.04)).toBe("P67");
    expect(formatPercentile(2.27)).toBe("P2,3");
    expect(formatPercentile(0.05)).toBe("dưới P0,1");
    expect(formatPercentile(99.95)).toBe("trên P99,9");
  });

  it("indicatorValue gives kg for weight and cm otherwise", () => {
    expect(indicatorValue(row, "wfa")).toBe(5.125);
    expect(indicatorValue(row, "lhfa")).toBe(58.5);
    expect(indicatorValue(row, "hcfa")).toBeNull();
  });

  it("latestWeightG takes the newest measurement that has a weight", () => {
    expect(
      latestWeightG([
        { ...row, measured_on: "2026-10-14", weight_g: 4300 },
        { ...row, measured_on: "2026-11-20", weight_g: null },
        row,
      ]),
    ).toBe(5125);
    expect(latestWeightG([])).toBeNull();
  });

  it("chartRange covers the first year and two months past today", () => {
    expect(chartRange(61)).toEqual({ to: 365, step: 7 });
    expect(chartRange(400)).toEqual({ to: 480, step: 7 });
    expect(chartRange(1000)).toEqual({ to: 1080, step: 30 });
    expect(chartRange(1850)).toEqual({ to: 1856, step: 30 });
  });
});
