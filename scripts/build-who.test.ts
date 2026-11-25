import { describe, expect, it } from "vitest";
import { ADULT_HEIGHT_FILES, ADULT_MONTH, adultLms } from "./build-who";

// Spec 2026-11-25 §6.2: the adult constants come from the WHO 5–19 tables,
// and the script checks them before it writes anything.
describe("build-who: adult height", () => {
  const rows = [
    [227, 1, 176.5211, 0.04142],
    [228, 1, 176.5432, 0.04134],
  ];

  it("reads the row at 228 months", () => {
    expect(ADULT_MONTH).toBe(228);
    expect(adultLms(rows, "boys")).toEqual({ l: 1, m: 176.5432, s: 0.04134 });
  });

  it("stops when the table has no row for 228 months", () => {
    expect(() => adultLms(rows.slice(0, 1), "boys")).toThrow(/228/);
  });

  it("stops when the median is outside the range the spec expects", () => {
    // A girls' median in the boys' file, and the other way round.
    expect(() => adultLms([[228, 1, 163.1548, 0.04009]], "boys")).toThrow(
      /176–177/,
    );
    expect(() => adultLms(rows, "girls")).toThrow(/162.7–163.7/);
    expect(adultLms([[228, 1, 163.1548, 0.04009]], "girls").m).toBe(163.1548);
  });

  it("names one WHO file per sex", () => {
    expect(ADULT_HEIGHT_FILES.map((file) => file.sex)).toEqual([
      "boys",
      "girls",
    ]);
    for (const file of ADULT_HEIGHT_FILES)
      expect(file.url).toMatch(
        /^https:\/\/cdn\.who\.int\/.+\/hfa-(boys|girls)-z-who-2007-exp\.xlsx$/,
      );
  });
});
