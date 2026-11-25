import { describe, expect, it } from "vitest";
import * as cards from "./exploreCards";
import { vaccineCardText } from "./exploreCards";
import type { DoseState, ScheduleItem } from "./vaccines";

// Spec 2026-11-25 §3.4: the growth card reads latestGrowth now.
describe("growthCardText", () => {
  it("is gone", () => {
    expect(Object.keys(cards)).toEqual(["vaccineCardText"]);
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
