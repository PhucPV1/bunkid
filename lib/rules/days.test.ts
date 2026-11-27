import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  formatDayFull,
  formatDayShort,
  startOfDayIso,
  vnDayLabel,
  vnDayRange,
  vnDayStartMs,
} from "./days";

describe("days", () => {
  it("vnDayStartMs is VN midnight in UTC", () => {
    expect(new Date(vnDayStartMs("2026-11-14")).toISOString()).toBe(
      "2026-11-13T17:00:00.000Z",
    );
  });

  it("spec 2026-11-27 §4.3: startOfDayIso is VN midnight as an ISO string", () => {
    expect(startOfDayIso("2026-11-14")).toBe("2026-11-13T17:00:00.000Z");
  });

  it("addMonths keeps the day of month and clamps to the month's last day", () => {
    expect(addMonths("2026-01-15", 12)).toBe("2027-01-15");
    expect(addMonths("2026-11-30", 3)).toBe("2027-02-28");
    expect(addMonths("2027-12-31", 2)).toBe("2028-02-29");
    expect(addMonths("2026-05-01", 0)).toBe("2026-05-01");
  });
  it("addDays crosses month and year boundaries", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("vnDayRange ends on today in VN time, oldest first", () => {
    const now = new Date("2026-11-13T18:30:00Z"); // 01:30 on 14/11 in VN
    expect(vnDayRange(now, 3)).toEqual([
      "2026-11-12",
      "2026-11-13",
      "2026-11-14",
    ]);
  });

  it("formatDayShort gives dd/MM", () => {
    expect(formatDayShort("2026-01-05")).toBe("05/01");
  });

  // Spec 2026-11-19 §7.2: the dates in the vaccine table.
  it("formatDayFull gives dd/MM/yyyy", () => {
    expect(formatDayFull("2026-10-29")).toBe("29/10/2026");
    expect(formatDayFull("2027-01-05")).toBe("05/01/2027");
  });

  it("vnDayLabel names today, yesterday and older days", () => {
    const now = new Date("2026-11-14T03:00:00Z"); // 10:00 Saturday 14/11 in VN
    expect(vnDayLabel("2026-11-14", now)).toBe("Hôm nay");
    expect(vnDayLabel("2026-11-13", now)).toBe("Hôm qua");
    expect(vnDayLabel("2026-11-09", now)).toBe("Thứ Hai, 09/11");
    expect(vnDayLabel("2026-11-08", now)).toBe("Chủ nhật, 08/11");
  });
});
