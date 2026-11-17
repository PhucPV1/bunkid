import { describe, expect, it } from "vitest";
import {
  inQuietHours,
  minutesToTime,
  PREF_OPTIONS,
  quietHoursPatch,
  quietHoursValue,
  snoozeText,
  snoozeUntil,
  SNOOZE_HOURS,
  timeToMinutes,
} from "./notifications";

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

describe("quiet hours (spec 2026-11-17 §4.3)", () => {
  // VN time is UTC+7: 15:30Z is 22:30, 23:00Z is 06:00 the next day.
  const at = (iso: string) => new Date(iso);
  const night = {
    quiet_enabled: true,
    quiet_start_min: 1320,
    quiet_end_min: 360,
  };

  it("a range across midnight covers the evening and the early morning", () => {
    expect(inQuietHours(night, at("2026-11-14T15:00:00Z"))).toBe(true); // 22:00
    expect(inQuietHours(night, at("2026-11-14T18:30:00Z"))).toBe(true); // 01:30
    expect(inQuietHours(night, at("2026-11-14T22:59:00Z"))).toBe(true); // 05:59
    expect(inQuietHours(night, at("2026-11-14T23:00:00Z"))).toBe(false); // 06:00
    expect(inQuietHours(night, at("2026-11-14T14:59:00Z"))).toBe(false); // 21:59
  });

  it("a range inside one day covers start up to, not including, end", () => {
    const nap = {
      quiet_enabled: true,
      quiet_start_min: 780,
      quiet_end_min: 900,
    };
    expect(inQuietHours(nap, at("2026-11-14T06:00:00Z"))).toBe(true); // 13:00
    expect(inQuietHours(nap, at("2026-11-14T07:59:00Z"))).toBe(true); // 14:59
    expect(inQuietHours(nap, at("2026-11-14T08:00:00Z"))).toBe(false); // 15:00
    expect(inQuietHours(nap, at("2026-11-14T05:59:00Z"))).toBe(false); // 12:59
  });

  it("is never quiet when switched off or when start equals end", () => {
    const evening = at("2026-11-14T16:00:00Z");
    expect(inQuietHours({ ...night, quiet_enabled: false }, evening)).toBe(
      false,
    );
    expect(
      inQuietHours(
        { quiet_enabled: true, quiet_start_min: 600, quiet_end_min: 600 },
        evening,
      ),
    ).toBe(false);
  });

  it("converts between minutes and HH:mm", () => {
    expect(minutesToTime(0)).toBe("00:00");
    expect(minutesToTime(1320)).toBe("22:00");
    expect(minutesToTime(1439)).toBe("23:59");
    expect(timeToMinutes("06:00")).toBe(360);
    expect(timeToMinutes("23:59")).toBe(1439);
    expect(timeToMinutes("24:00")).toBeNull();
    expect(timeToMinutes("6:00")).toBeNull();
    expect(timeToMinutes("")).toBeNull();
  });

  it("quietHoursValue is Tắt or the two times", () => {
    expect(quietHoursValue(night)).toBe("22:00–06:00");
    expect(quietHoursValue({ ...night, quiet_enabled: false })).toBe("Tắt");
  });

  it("quietHoursPatch refuses equal or unreadable times", () => {
    expect(quietHoursPatch(true, "22:00", "06:00")).toEqual({
      ok: true,
      patch: night,
    });
    expect(quietHoursPatch(false, "21:30", "05:15")).toEqual({
      ok: true,
      patch: {
        quiet_enabled: false,
        quiet_start_min: 1290,
        quiet_end_min: 315,
      },
    });
    expect(quietHoursPatch(true, "22:00", "22:00")).toEqual({
      ok: false,
      message: "Giờ bắt đầu và kết thúc phải khác nhau",
    });
    expect(quietHoursPatch(true, "", "06:00")).toEqual({
      ok: false,
      message: "Chọn giờ bắt đầu và giờ kết thúc",
    });
  });
});

describe("PREF_OPTIONS (spec 2026-11-17 §4.4)", () => {
  it("lists five switches, the two new ones last", () => {
    expect(PREF_OPTIONS.map((o) => [o.key, o.label])).toEqual([
      ["feed_reminder", "Nhắc cữ bú"],
      ["wake_window", "Nhắc khi bé thức quá lâu"],
      ["vaccine", "Nhắc lịch tiêm"],
      ["medicine", "Nhắc thuốc"],
      ["timer_alert", "Nhắc timer chạy quá lâu"],
    ]);
  });
});
