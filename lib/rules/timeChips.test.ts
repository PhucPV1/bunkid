import { describe, expect, it } from "vitest";
import { TIME_CHIPS, timeChipToDate } from "./timeChips";

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

  it("Chọn giờ… reads the datetime-local value in Vietnam time", () => {
    expect(
      timeChipToDate("custom", NOW, "2026-11-14T08:30").toISOString(),
    ).toBe("2026-11-14T01:30:00.000Z");
    expect(Number.isNaN(timeChipToDate("custom", NOW, "").getTime())).toBe(
      true,
    );
    expect(Number.isNaN(timeChipToDate("custom", NOW).getTime())).toBe(true);
  });

  it("lists the four chips in spec order", () => {
    expect(TIME_CHIPS).toEqual([
      { value: "now", label: "Bây giờ" },
      { value: "5m", label: "5 phút trước" },
      { value: "15m", label: "15 phút trước" },
      { value: "custom", label: "Chọn giờ…" },
    ]);
  });
});
