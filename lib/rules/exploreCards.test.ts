import { describe, expect, it } from "vitest";
import { growthCardText, vaccineCardText } from "./exploreCards";
import type { DoseState, ScheduleItem } from "./vaccines";

const measure = (measured_on: string, weight_g: number | null) => ({
  measured_on,
  weight_g,
  length_cm: 58.5,
  head_cm: null,
});

// Spec 2026-11-19 §9.
describe("growthCardText", () => {
  it("shows the latest weight in grams with a thousands dot, then its day", () => {
    expect(growthCardText([measure("2026-11-15", 5500)])).toBe(
      "Cân nặng 5.500 g · 15/11",
    );
    expect(growthCardText([measure("2026-09-10", 950)])).toBe(
      "Cân nặng 950 g · 10/09",
    );
    expect(growthCardText([measure("2027-03-01", 10250)])).toBe(
      "Cân nặng 10.250 g · 01/03",
    );
  });

  it("takes the newest measurement that has a weight, whatever the row order", () => {
    const rows = [
      measure("2026-10-14", 4300),
      measure("2026-11-20", null),
      measure("2026-11-15", 5500),
    ];
    expect(growthCardText(rows)).toBe("Cân nặng 5.500 g · 15/11");
    expect(growthCardText([...rows].reverse())).toBe(
      "Cân nặng 5.500 g · 15/11",
    );
    // The rows keep the order they came in.
    expect(rows.map((row) => row.measured_on)).toEqual([
      "2026-10-14",
      "2026-11-20",
      "2026-11-15",
    ]);
  });

  it("two weights on one day: the first row wins, as the query lists the newest first", () => {
    expect(
      growthCardText([
        measure("2026-11-15", 5600),
        measure("2026-11-15", 5500),
      ]),
    ).toBe("Cân nặng 5.600 g · 15/11");
  });

  it("returns null when no measurement has a weight", () => {
    expect(growthCardText([])).toBeNull();
    expect(growthCardText([measure("2026-11-20", null)])).toBeNull();
  });
});

const next = (state: DoseState, due: string) =>
  ({
    dose: { code: "bexsero", doseNo: 2, name: "Bexsero mũi 2" },
    due,
    state,
    record: null,
    unchosen: false,
    pastMaxAge: false,
  }) as ScheduleItem;

describe("vaccineCardText", () => {
  it("overdue: Quá hạn and the dose name, no date", () => {
    expect(vaccineCardText(next("overdue", "2026-11-10"))).toBe(
      "Quá hạn: Bexsero mũi 2",
    );
  });

  it("upcoming or later: the due day first, then the dose name", () => {
    expect(vaccineCardText(next("upcoming", "2026-12-10"))).toBe(
      "10/12 · Bexsero mũi 2",
    );
    expect(vaccineCardText(next("later", "2027-06-05"))).toBe(
      "05/06 · Bexsero mũi 2",
    );
  });

  it("returns null when there is no next dose", () => {
    expect(vaccineCardText(null)).toBeNull();
  });
});
