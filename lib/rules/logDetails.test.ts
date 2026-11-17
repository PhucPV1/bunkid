import { describe, expect, it } from "vitest";
import {
  detailsSchemas,
  isTimerType,
  LOG_TYPES,
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

describe("solids, water, bath and note (spec 2026-11-17 §3.1)", () => {
  const solids = { food: "Cháo bí đỏ", amount: "some", isNew: false };
  const ok = (type: "solids" | "water" | "bath" | "note", details: unknown) =>
    detailsSchemas[type].safeParse(details).success;

  it("LOG_TYPES ends with the four new types, none of them a timer", () => {
    expect(LOG_TYPES).toHaveLength(12);
    expect(LOG_TYPES.slice(8)).toEqual(["solids", "water", "bath", "note"]);
    for (const type of ["solids", "water", "bath", "note"] as const)
      expect(isTimerType(type)).toBe(false);
  });

  it("solids: food of 1–80 characters, three amounts, isNew, optional reaction up to 200", () => {
    expect(ok("solids", solids)).toBe(true);
    expect(ok("solids", { ...solids, food: "a".repeat(80) })).toBe(true);
    expect(ok("solids", { ...solids, food: "a".repeat(81) })).toBe(false);
    expect(ok("solids", { ...solids, food: "" })).toBe(false);
    expect(ok("solids", { ...solids, food: "   " })).toBe(false);
    for (const amount of ["little", "some", "lots"])
      expect(ok("solids", { ...solids, amount })).toBe(true);
    expect(ok("solids", { ...solids, amount: "half" })).toBe(false);
    expect(ok("solids", { food: "Cháo", amount: "some" })).toBe(false);
    expect(ok("solids", { ...solids, reaction: "r".repeat(200) })).toBe(true);
    expect(ok("solids", { ...solids, reaction: "r".repeat(201) })).toBe(false);
    expect(ok("solids", { ...solids, reaction: "" })).toBe(false);
    expect(ok("solids", { ...solids, extra: 1 })).toBe(false);
    expect(
      detailsSchemas.solids.parse({ ...solids, food: "  Cháo  " }).food,
    ).toBe("Cháo");
  });

  it("water: a whole number of ml from 1 to 500", () => {
    expect(ok("water", { ml: 1 })).toBe(true);
    expect(ok("water", { ml: 500 })).toBe(true);
    expect(ok("water", { ml: 0 })).toBe(false);
    expect(ok("water", { ml: 501 })).toBe(false);
    expect(ok("water", { ml: 12.5 })).toBe(false);
    expect(ok("water", { ml: 30, milk: "formula" })).toBe(false);
  });

  it("bath: only the empty object", () => {
    expect(ok("bath", {})).toBe(true);
    expect(ok("bath", { minutes: 10 })).toBe(false);
  });

  it("note: text of 1–500 characters after trimming", () => {
    expect(ok("note", { text: "Bé cười nhiều" })).toBe(true);
    expect(ok("note", { text: "a".repeat(500) })).toBe(true);
    expect(ok("note", { text: "a".repeat(501) })).toBe(false);
    expect(ok("note", { text: "" })).toBe(false);
    expect(ok("note", { text: "  " })).toBe(false);
    expect(ok("note", { text: "a", extra: 1 })).toBe(false);
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
