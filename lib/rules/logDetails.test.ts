import { describe, expect, it } from "vitest";
import {
  detailsSchemas,
  isTimerType,
  MEDICINE_UNITS,
} from "@/lib/rules/logDetails";

describe("detailsSchemas", () => {
  it("accepts valid details for every type", () => {
    expect(detailsSchemas.breast.safeParse({ side: "left" }).success).toBe(
      true,
    );
    expect(
      detailsSchemas.bottle.safeParse({ ml: 90, milk: "formula" }).success,
    ).toBe(true);
    expect(detailsSchemas.sleep.safeParse({}).success).toBe(true);
    expect(
      detailsSchemas.diaper.safeParse({
        wet: true,
        dirty: true,
        stoolColor: "pale",
      }).success,
    ).toBe(true);
    expect(
      detailsSchemas.medicine.safeParse({
        name: "Vitamin D",
        amount: 1,
        unit: "giọt",
        antipyretic: false,
      }).success,
    ).toBe(true);
    expect(
      detailsSchemas.temperature.safeParse({ celsius: 37.5, method: "nach" })
        .success,
    ).toBe(true);
    expect(detailsSchemas.pump.safeParse({ mlLeft: 60 }).success).toBe(true);
    expect(detailsSchemas.tummy.safeParse({}).success).toBe(true);
  });
  it("rejects out-of-range or unknown values", () => {
    expect(
      detailsSchemas.bottle.safeParse({ ml: 0, milk: "formula" }).success,
    ).toBe(false);
    expect(
      detailsSchemas.bottle.safeParse({ ml: 401, milk: "formula" }).success,
    ).toBe(false);
    expect(
      detailsSchemas.diaper.safeParse({ wet: false, dirty: false }).success,
    ).toBe(false);
    expect(
      detailsSchemas.temperature.safeParse({ celsius: 43.1, method: "nach" })
        .success,
    ).toBe(false);
    expect(
      detailsSchemas.breast.safeParse({ side: "left", extra: 1 }).success,
    ).toBe(false);
    expect(
      detailsSchemas.medicine.safeParse({
        name: "  ",
        amount: 1,
        unit: "ml",
        antipyretic: false,
      }).success,
    ).toBe(false);
  });
  it("medicine takes the six units, gói and ống included, and nothing else", () => {
    expect(MEDICINE_UNITS).toEqual(["ml", "mg", "giọt", "viên", "gói", "ống"]);
    const dose = (unit: string) =>
      detailsSchemas.medicine.safeParse({
        name: "Men tiêu hoá",
        amount: 1,
        unit,
        antipyretic: false,
      }).success;
    expect(dose("gói")).toBe(true);
    expect(dose("ống")).toBe(true);
    expect(dose("thìa")).toBe(false);
  });
});

describe("isTimerType", () => {
  it("marks breast, sleep, pump and tummy as timers", () => {
    expect(
      ["breast", "sleep", "pump", "tummy"].every((t) =>
        isTimerType(t as never),
      ),
    ).toBe(true);
    expect(isTimerType("bottle")).toBe(false);
  });
});
