import { describe, expect, it } from "vitest";
import { snoozeText, snoozeUntil, SNOOZE_HOURS } from "./notifications";

const now = new Date("2026-11-14T13:00:00Z"); // 20:00 on 14/11 in VN

describe("notification snooze", () => {
  it("offers 2, 4 and 8 hours", () => {
    expect([...SNOOZE_HOURS]).toEqual([2, 4, 8]);
    expect(snoozeUntil(now, 2)).toBe("2026-11-14T15:00:00.000Z");
  });

  it("snoozeText shows the VN end time, with the day when it is not today", () => {
    expect(snoozeText(snoozeUntil(now, 2), now)).toBe(
      "Đang tạm tắt nhắc đến 22:00",
    );
    expect(snoozeText(snoozeUntil(now, 8), now)).toBe(
      "Đang tạm tắt nhắc đến 04:00 ngày mai",
    );
    expect(snoozeText("2026-11-16T01:00:00Z", now)).toBe(
      "Đang tạm tắt nhắc đến 08:00 ngày 16/11",
    );
  });

  it("snoozeText is null when not snoozed or already over", () => {
    expect(snoozeText(null, now)).toBeNull();
    expect(snoozeText("2026-11-14T12:59:00Z", now)).toBeNull();
  });
});
