import { describe, expect, it } from "vitest";
import { loadWhoTable, WHO_LAST_DAY, whoSex } from "./who";

const TABLES = [
  ["wfa", "boys"],
  ["wfa", "girls"],
  ["lhfa", "boys"],
  ["lhfa", "girls"],
  ["hcfa", "boys"],
  ["hcfa", "girls"],
] as const;

describe("content/who/*.json (spec §7.3, §10.2)", () => {
  it("each table has its source, review date and one LMS row per day 0..1856", async () => {
    for (const [indicator, sex] of TABLES) {
      const table = await loadWhoTable(indicator, sex);
      expect(table.indicator).toBe(indicator);
      expect(table.sex).toBe(sex);
      expect(table.source).toMatch(/^https:\/\/cdn\.who\.int\/.+\.xlsx$/);
      expect(table.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(table.rows.map((r) => r[0])).toEqual(
        Array.from({ length: WHO_LAST_DAY + 1 }, (_, i) => i),
      );
    }
  });

  it("maps babies.sex to the table names", () => {
    expect(whoSex("female")).toBe("girls");
    expect(whoSex("male")).toBe("boys");
  });
});
