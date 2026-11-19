import { describe, expect, it } from "vitest";
import { TIME_CHIPS, timeChipError, timeChipToDate } from "./timeChips";

const NOW = new Date("2026-11-14T05:00:00.000Z"); // 12:00 giờ VN

describe("timeChipToDate", () => {
  it("now, 5 and 15 minutes ago count back from now", () => {
    expect(timeChipToDate("now", NOW).toISOString()).toBe(
      "2026-11-14T05:00:00.000Z",
    );
    expect(timeChipToDate("5m", NOW).toISOString()).toBe(
      "2026-11-14T04:55:00.000Z",
    );
    expect(timeChipToDate("15m", NOW).toISOString()).toBe(
      "2026-11-14T04:45:00.000Z",
    );
  });

  it("Giờ khác reads the datetime-local value in Vietnam time", () => {
    expect(
      timeChipToDate("custom", NOW, "2026-11-14T08:30").toISOString(),
    ).toBe("2026-11-14T01:30:00.000Z");
    expect(Number.isNaN(timeChipToDate("custom", NOW, "").getTime())).toBe(
      true,
    );
    expect(Number.isNaN(timeChipToDate("custom", NOW).getTime())).toBe(true);
  });

  it("rejects a missing time and a time in the future", () => {
    expect(timeChipError(timeChipToDate("custom", NOW, ""), NOW)).toBe(
      "Chọn giờ hợp lệ",
    );
    expect(
      timeChipError(timeChipToDate("custom", NOW, "2026-11-24T12:00"), NOW),
    ).toBe("Giờ ghi không được ở tương lai");
    // One minute of slack for a clock that runs slightly ahead.
    expect(timeChipError(new Date(NOW.getTime() + 60_000), NOW)).toBeNull();
    expect(timeChipError(new Date(NOW.getTime() + 61_000), NOW)).toBe(
      "Giờ ghi không được ở tương lai",
    );
    expect(timeChipError(timeChipToDate("15m", NOW), NOW)).toBeNull();
  });

  it("lists the four chips in spec order", () => {
    expect(TIME_CHIPS).toEqual([
      { value: "now", label: "Bây giờ" },
      { value: "5m", label: "5p trước" },
      { value: "15m", label: "15p trước" },
      { value: "custom", label: "Giờ khác" },
    ]);
  });
});
