import { describe, expect, it } from "vitest";
import { addDays, formatDayShort, vnDayLabel, vnDayStartMs } from "./days";

describe("days", () => {
  it("vnDayStartMs is VN midnight in UTC", () => {
    expect(new Date(vnDayStartMs("2026-11-14")).toISOString()).toBe(
      "2026-11-13T17:00:00.000Z",
    );
  });

  it("addDays crosses month and year boundaries", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("formatDayShort gives dd/MM", () => {
    expect(formatDayShort("2026-01-05")).toBe("05/01");
  });

  it("vnDayLabel names today, yesterday and older days", () => {
    const now = new Date("2026-11-14T03:00:00Z"); // 10:00 Saturday 14/11 in VN
    expect(vnDayLabel("2026-11-14", now)).toBe("Hôm nay");
    expect(vnDayLabel("2026-11-13", now)).toBe("Hôm qua");
    expect(vnDayLabel("2026-11-09", now)).toBe("Thứ Hai, 09/11");
    expect(vnDayLabel("2026-11-08", now)).toBe("Chủ nhật, 08/11");
  });
});
