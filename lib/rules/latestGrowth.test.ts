import { describe, expect, it } from "vitest";
import { latestGrowth } from "./growthForm";

const row = (
  measured_on: string,
  weight_g: number | null,
  length_cm: number | null,
  head_cm: number | null,
) => ({ measured_on, weight_g, length_cm, head_cm });

// Spec 2026-11-25 §3.4: the growth card of the Sức khỏe page.
describe("latestGrowth", () => {
  it("returns null without measurements", () => {
    expect(latestGrowth([])).toBeNull();
  });

  it("takes the newest day and, per indicator, the newest value that exists", () => {
    const rows = [
      row("2026-10-10", 4600, 55.2, 37.4),
      row("2026-11-25", 6100, null, null),
      row("2026-11-01", null, 58, null),
    ];
    expect(latestGrowth(rows)).toEqual({
      measuredOn: "2026-11-25",
      weightG: 6100,
      lengthCm: 58,
      headCm: 37.4,
    });
    // The rows keep the order they came in.
    expect(rows.map((r) => r.measured_on)).toEqual([
      "2026-10-10",
      "2026-11-25",
      "2026-11-01",
    ]);
  });

  it("an indicator never measured stays null", () => {
    expect(latestGrowth([row("2026-11-25", 6100, null, null)])).toEqual({
      measuredOn: "2026-11-25",
      weightG: 6100,
      lengthCm: null,
      headCm: null,
    });
  });

  it("two rows on one day: the first row wins, as the query lists the newest first", () => {
    expect(
      latestGrowth([
        row("2026-11-25", 6200, null, null),
        row("2026-11-25", 6100, 61.5, null),
      ]),
    ).toEqual({
      measuredOn: "2026-11-25",
      weightG: 6200,
      lengthCm: 61.5,
      headCm: null,
    });
  });
});
