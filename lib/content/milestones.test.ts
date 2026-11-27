import { describe, expect, it } from "vitest";
import { MILESTONES } from "./milestones";

describe("content/milestones.vi.json (spec §6.9, §10.2)", () => {
  it("has the CDC month groups of spec §6.9 with all four domains", () => {
    expect(MILESTONES.groups.map((g) => g.months)).toEqual([
      2, 4, 6, 9, 12, 15, 18, 24,
    ]);
    for (const group of MILESTONES.groups) {
      expect(new Set(group.items.map((i) => i.domain))).toEqual(
        new Set(["social", "language", "cognitive", "movement"]),
      );
      expect(group.source).toMatch(/^https:\/\/www\.cdc\.gov\/act-early\//);
      expect(group.askDoctor.length).toBeGreaterThan(0);
    }
  });

  it("uses every milestone code once", () => {
    const codes = [
      ...MILESTONES.groups.flatMap((g) => g.items.map((i) => i.code)),
      ...MILESTONES.motor.map((m) => m.code),
    ];
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("has rolling plus the six WHO gross motor milestones with their windows", () => {
    expect(
      MILESTONES.motor.map((m) => [m.code, m.fromMonths, m.toMonths]),
    ).toEqual([
      ["lat", 4, 6],
      ["ngoi", 3.8, 9.2],
      ["dung_co_do", 4.8, 11.4],
      ["bo", 5.2, 13.5],
      ["di_co_dat", 6, 13.7],
      ["tu_dung", 6.9, 16.9],
      ["tu_di", 8.2, 17.6],
    ]);
    for (const m of MILESTONES.motor) expect(m.source).toMatch(/^https:\/\//);
  });

  it("has a short lower-case name for each motor milestone (spec 2026-11-27 §3.4)", () => {
    expect(MILESTONES.motor.map((m) => [m.code, m.short])).toEqual([
      ["lat", "lật"],
      ["ngoi", "ngồi"],
      ["dung_co_do", "đứng có đỡ"],
      ["bo", "bò"],
      ["di_co_dat", "đi có dắt"],
      ["tu_dung", "tự đứng"],
      ["tu_di", "tự đi"],
    ]);
  });
});
