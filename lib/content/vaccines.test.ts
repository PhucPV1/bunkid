import { describe, expect, it } from "vitest";
import { VACCINES } from "./vaccines";

const { groups, doses } = VACCINES;

describe("content/vaccines.vi.json (spec §6.8, §10.2)", () => {
  it("every dose carries a source URL and a review date", () => {
    for (const dose of doses) {
      expect(dose.source, dose.code).toMatch(/^https:\/\//);
      expect(dose.reviewedAt, dose.code).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("each vaccine code numbers its doses 1..n once, with intervals after dose 1", () => {
    const byCode = new Map<string, number[]>();
    for (const dose of doses)
      byCode.set(dose.code, [...(byCode.get(dose.code) ?? []), dose.doseNo]);
    for (const [code, numbers] of byCode)
      expect(numbers, code).toEqual(numbers.map((_, i) => i + 1));
    for (const dose of doses)
      expect(dose.minIntervalDaysFromPrev !== undefined, dose.code).toBe(
        dose.doseNo > 1,
      );
  });

  it("group and series always come together and point at a declared series", () => {
    const series = new Map(
      groups.flatMap((g) =>
        g.series.map((s) => [`${g.code}/${s.code}`, s] as const),
      ),
    );
    for (const dose of doses) {
      expect(dose.group === undefined, dose.code).toBe(
        dose.series === undefined,
      );
      if (dose.group) {
        const declared = series.get(`${dose.group}/${dose.series}`);
        expect(
          declared,
          `${dose.code} ${dose.group}/${dose.series}`,
        ).toBeDefined();
        expect(declared?.program, dose.code).toBe(dose.program);
      }
    }
  });

  it("ages are consistent: min ≤ recommended ≤ max", () => {
    for (const dose of doses) {
      expect(dose.minAgeDays, dose.code).toBeLessThanOrEqual(
        dose.recommendedAgeDays,
      );
      if (dose.maxAgeDays !== undefined)
        expect(dose.recommendedAgeDays, dose.code).toBeLessThanOrEqual(
          dose.maxAgeDays,
        );
    }
  });

  it("covers the TCMR doses due at 2 months", () => {
    const atTwoMonths = doses
      .filter((d) => d.program === "tcmr" && d.recommendedAgeDays === 60)
      .map((d) => `${d.code}#${d.doseNo}`);
    expect(atTwoMonths).toEqual(
      expect.arrayContaining([
        "dpt_vgb_hib#1",
        "opv#1",
        "rotavin#1",
        "pcv_tcmr#1",
      ]),
    );
  });
});
