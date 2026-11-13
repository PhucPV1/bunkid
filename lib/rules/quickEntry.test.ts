import { describe, expect, it } from "vitest";
import {
  buildDetails,
  defaultQuickValues,
  QUICK_FIELDS,
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
