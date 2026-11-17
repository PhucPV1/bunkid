import { describe, expect, it } from "vitest";
import type { LogLike } from "@/lib/rules/describeLog";
import {
  buildDetails,
  defaultQuickValues,
  DIAPER_KIND_OPTIONS,
  diaperKind,
  MEDICINE_PRESETS,
  medicinePrefill,
  ML_STEP,
  QUICK_FIELDS,
  recentBottleAmounts,
  recentFoodNames,
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
      "solids",
      "water",
      "bath",
      "note",
    ] as const) {
      const defaults = defaultQuickValues(type);
      for (const field of QUICK_FIELDS[type])
        expect(defaults).toHaveProperty(field.key);
    }
  });
});

describe("solids, water, bath and note (spec 2026-11-17 §3.3)", () => {
  it("fields: labels, kinds and the schema's length limits", () => {
    expect(
      QUICK_FIELDS.solids.map((f) => [f.key, f.label, f.kind, f.maxLength]),
    ).toEqual([
      ["food", "Món", "text", 80],
      ["amount", "Lượng", "select", undefined],
      ["isNew", "Món mới", "checkbox", undefined],
      ["reaction", "Phản ứng (nếu có)", "text", 200],
    ]);
    expect(QUICK_FIELDS.solids[1].options).toEqual([
      { value: "little", label: "Ít" },
      { value: "some", label: "Vừa" },
      { value: "lots", label: "Nhiều" },
    ]);
    expect(QUICK_FIELDS.water).toEqual([
      { key: "ml", label: "Số ml", kind: "number" },
    ]);
    expect(QUICK_FIELDS.bath).toEqual([]);
    expect(QUICK_FIELDS.note).toEqual([
      { key: "text", label: "Nội dung", kind: "textarea", maxLength: 500 },
    ]);
  });

  it("defaults: a medium portion of nothing yet, empty ml, empty note", () => {
    expect(defaultQuickValues("solids")).toEqual({
      food: "",
      amount: "some",
      isNew: false,
      reaction: "",
    });
    expect(defaultQuickValues("water")).toEqual({ ml: "" });
    expect(defaultQuickValues("bath")).toEqual({});
    expect(defaultQuickValues("note")).toEqual({ text: "" });
  });

  it("solids: trims, leaves out an empty reaction, needs a food name", () => {
    const values = {
      food: " Cháo bí đỏ ",
      amount: "little",
      isNew: true,
      reaction: "  ",
    };
    expect(buildDetails("solids", values)).toEqual({
      ok: true,
      details: { food: "Cháo bí đỏ", amount: "little", isNew: true },
    });
    expect(
      buildDetails("solids", { ...values, reaction: " nổi mẩn " }),
    ).toEqual({
      ok: true,
      details: {
        food: "Cháo bí đỏ",
        amount: "little",
        isNew: true,
        reaction: "nổi mẩn",
      },
    });
    expect(buildDetails("solids", { ...values, food: "  " })).toEqual({
      ok: false,
      message: "Nhập tên món",
    });
  });

  it("water, bath and note: details and messages", () => {
    expect(buildDetails("water", { ml: "30" })).toEqual({
      ok: true,
      details: { ml: 30 },
    });
    for (const ml of ["", "0", "501", "12,5"])
      expect(buildDetails("water", { ml })).toEqual({
        ok: false,
        message: "Nhập số ml từ 1 đến 500",
      });
    expect(buildDetails("bath", {})).toEqual({ ok: true, details: {} });
    expect(buildDetails("note", { text: " Bé cười nhiều " })).toEqual({
      ok: true,
      details: { text: "Bé cười nhiều" },
    });
    expect(buildDetails("note", { text: "   " })).toEqual({
      ok: false,
      message: "Nhập ghi chú",
    });
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
const medDose = (
  minutesAgo: number,
  name: string,
  amount: number,
  unit: string,
  antipyretic = false,
): LogLike => ({
  type: "medicine",
  started_at: at(minutesAgo),
  ended_at: at(minutesAgo),
  details: { name, amount, unit, antipyretic },
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

  it("recentFoodNames: up to 4 names, case-insensitive, latest spelling", () => {
    const food = (minutesAgo: number, name: string): LogLike => ({
      type: "solids",
      started_at: at(minutesAgo),
      ended_at: at(minutesAgo),
      details: { food: name, amount: "some", isNew: false },
    });
    expect(
      recentFoodNames([
        food(100, "cháo bí đỏ"),
        food(10, "Cháo bí đỏ "),
        food(20, "Chuối"),
        food(30, "Bơ"),
        food(40, "Khoai lang"),
        food(50, "Táo"),
        medLog(1, "Vitamin D"),
        { ...food(5, "Hỏng"), details: { food: "Hỏng" } },
      ]),
    ).toEqual(["Cháo bí đỏ", "Chuối", "Bơ", "Khoai lang"]);
    expect(recentFoodNames([])).toEqual([]);
  });

  it("MEDICINE_PRESETS: Vitamin D, DHA, Men tiêu hoá in that order", () => {
    expect(MEDICINE_PRESETS).toEqual(["Vitamin D", "DHA", "Men tiêu hoá"]);
  });

  it("recentMedicineNames skips the presets before counting to 4", () => {
    expect(
      recentMedicineNames(
        [
          medLog(5, "DHA"),
          medLog(10, "Paracetamol"),
          medLog(15, "dha "),
          medLog(20, "Men tiêu hoá"),
          medLog(25, "Siro ho"),
          medLog(30, "vitamin d"),
          medLog(35, "Kẽm"),
          medLog(40, "Thuốc X"),
          medLog(45, "Cuối"),
        ],
        MEDICINE_PRESETS,
      ),
    ).toEqual(["Paracetamol", "Siro ho", "Kẽm", "Thuốc X"]);
  });

  it("medicinePrefill copies the latest dose of the same medicine, any case", () => {
    expect(
      medicinePrefill("DHA", [
        medDose(10, "dha", 2.5, "ml"),
        medDose(60, "DHA", 5, "giọt"),
        medDose(5, "Paracetamol", 2.5, "ml", true),
      ]),
    ).toEqual({ name: "DHA", amount: "2,5", unit: "ml", antipyretic: false });
    expect(
      medicinePrefill("Paracetamol", [
        medDose(5, "Paracetamol", 120, "mg", true),
      ]),
    ).toEqual({
      name: "Paracetamol",
      amount: "120",
      unit: "mg",
      antipyretic: true,
    });
  });

  it("medicinePrefill: Vitamin D never logged is 1 giọt", () => {
    expect(medicinePrefill("Vitamin D", [medDose(5, "DHA", 5, "giọt")])).toEqual({
      name: "Vitamin D",
      amount: "1",
      unit: "giọt",
      antipyretic: false,
    });
    expect(medicinePrefill("vitamin d", [])).toEqual({
      name: "Vitamin D",
      amount: "1",
      unit: "giọt",
      antipyretic: false,
    });
  });

  it("medicinePrefill: anything else never logged clears the amount and keeps the unit", () => {
    expect(medicinePrefill("Men tiêu hoá", [])).toEqual({
      name: "Men tiêu hoá",
      amount: "",
      antipyretic: false,
    });
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
