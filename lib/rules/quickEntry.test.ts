import { describe, expect, it } from "vitest";
import type { LogLike } from "@/lib/rules/describeLog";
import {
  buildDetails,
  defaultQuickValues,
  DIAPER_KIND_OPTIONS,
  diaperKind,
  ML_STEP,
  QUICK_FIELDS,
  recentBottleAmounts,
  recentMedicineNames,
  stepAmount,
  STOOL_OPTIONS,
  TEMP_STEP,
  withDiaperKind,
} from "@/lib/rules/quickEntry";

describe("buildDetails", () => {
  it("builds bottle details, accepting comma decimals in numbers", () => {
    expect(buildDetails("bottle", { ml: "90", milk: "formula" })).toEqual({
      ok: true,
      details: { ml: 90, milk: "formula" },
    });
    expect(buildDetails("bottle", { ml: "", milk: "formula" })).toEqual({
      ok: false,
      message: "Nhập số ml từ 1 đến 400",
    });
  });
  it("only keeps the stool colour for a dirty diaper", () => {
    expect(
      buildDetails("diaper", { wet: true, dirty: false, stoolColor: "yellow" }),
    ).toEqual({
      ok: true,
      details: { wet: true, dirty: false },
    });
    expect(
      buildDetails("diaper", { wet: false, dirty: true, stoolColor: "pale" }),
    ).toEqual({
      ok: true,
      details: { wet: false, dirty: true, stoolColor: "pale" },
    });
    expect(
      buildDetails("diaper", { wet: false, dirty: false, stoolColor: "" }),
    ).toEqual({
      ok: false,
      message: "Chọn ít nhất ướt hoặc bẩn",
    });
  });
  it("builds medicine and temperature details", () => {
    expect(
      buildDetails("medicine", {
        name: " Paracetamol ",
        amount: "2,5",
        unit: "ml",
        antipyretic: true,
      }),
    ).toEqual({
      ok: true,
      details: {
        name: "Paracetamol",
        amount: 2.5,
        unit: "ml",
        antipyretic: true,
      },
    });
    expect(
      buildDetails("temperature", { celsius: "38,2", method: "nach" }),
    ).toEqual({
      ok: true,
      details: { celsius: 38.2, method: "nach" },
    });
    expect(
      buildDetails("temperature", { celsius: "45", method: "nach" }),
    ).toEqual({
      ok: false,
      message: "Nhập nhiệt độ từ 34 đến 43°C",
    });
  });
  it("provides a default for every declared field", () => {
    for (const type of [
      "bottle",
      "diaper",
      "medicine",
      "temperature",
    ] as const) {
      const defaults = defaultQuickValues(type);
      for (const field of QUICK_FIELDS[type])
        expect(defaults).toHaveProperty(field.key);
    }
  });
});

const at = (minutesAgo: number) =>
  new Date(Date.UTC(2026, 10, 14, 5) - minutesAgo * 60_000).toISOString();
const bottleLog = (minutesAgo: number, ml: number): LogLike => ({
  type: "bottle",
  started_at: at(minutesAgo),
  ended_at: at(minutesAgo),
  details: { ml, milk: "formula" },
});
const medLog = (minutesAgo: number, name: string): LogLike => ({
  type: "medicine",
  started_at: at(minutesAgo),
  ended_at: at(minutesAgo),
  details: { name, amount: 1, unit: "ml", antipyretic: false },
});

describe("recent suggestions", () => {
  it("recentBottleAmounts: up to 3 different amounts, newest first", () => {
    expect(
      recentBottleAmounts([
        bottleLog(300, 60),
        bottleLog(10, 90),
        bottleLog(60, 120),
        bottleLog(30, 90),
        bottleLog(200, 100),
        medLog(5, "Vitamin D"),
      ]),
    ).toEqual([90, 120, 100]);
    expect(recentBottleAmounts([bottleLog(10, 90)])).toEqual([90]);
    expect(recentBottleAmounts([])).toEqual([]);
  });

  it("recentMedicineNames: up to 4 names, case-insensitive, latest spelling", () => {
    expect(
      recentMedicineNames([
        medLog(100, "paracetamol"),
        medLog(10, "Paracetamol "),
        medLog(20, "Vitamin D"),
        medLog(30, "Men vi sinh"),
        medLog(40, "Siro ho"),
        medLog(50, "Kẽm"),
        bottleLog(1, 90),
      ]),
    ).toEqual(["Paracetamol", "Vitamin D", "Men vi sinh", "Siro ho"]);
  });
});

describe("number steppers", () => {
  it("ml: ±10 from empty as 0, never below 0", () => {
    expect(stepAmount("", 10, ML_STEP)).toBe("10");
    expect(stepAmount("90", 10, ML_STEP)).toBe("100");
    expect(stepAmount("5", -10, ML_STEP)).toBe("0");
    expect(stepAmount("", -10, ML_STEP)).toBe("0");
  });

  it("temperature: ±0,1 from empty as 37,0, comma decimals", () => {
    expect(stepAmount("", 0.1, TEMP_STEP)).toBe("37,1");
    expect(stepAmount("", -0.1, TEMP_STEP)).toBe("36,9");
    expect(stepAmount("38,5", 0.1, TEMP_STEP)).toBe("38,6");
    expect(stepAmount("38.5", -0.1, TEMP_STEP)).toBe("38,4");
  });
});

describe("diaper kind", () => {
  it("maps Ướt / Bẩn / Cả hai to wet and dirty, and back", () => {
    expect(DIAPER_KIND_OPTIONS.map((o) => o.label)).toEqual([
      "Ướt",
      "Bẩn",
      "Cả hai",
    ]);
    expect(diaperKind(defaultQuickValues("diaper"))).toBe("wet");
    const both = withDiaperKind(
      { wet: true, dirty: false, stoolColor: "" },
      "both",
    );
    expect(both).toEqual({ wet: true, dirty: true, stoolColor: "" });
    expect(diaperKind(both)).toBe("both");
    const dirty = withDiaperKind({ ...both, stoolColor: "green" }, "dirty");
    expect(dirty).toEqual({ wet: false, dirty: true, stoolColor: "green" });
    expect(withDiaperKind(dirty, "wet")).toEqual({
      wet: true,
      dirty: false,
      stoolColor: "",
    });
    expect(STOOL_OPTIONS.map((o) => o.value)).toEqual([
      "",
      "yellow",
      "green",
      "brown",
      "black",
      "pale",
      "red",
    ]);
  });
});
