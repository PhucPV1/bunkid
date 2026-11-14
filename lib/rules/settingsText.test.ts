import { describe, expect, it } from "vitest";
import {
  babySubtitle,
  memberCountText,
  nightHoursText,
  snoozeValue,
} from "./settingsText";

describe("settings text", () => {
  it("babySubtitle shows sex, birth date and birth weight in kg", () => {
    expect(
      babySubtitle({ sex: "male", dob: "2026-09-10", birth_weight_g: 3200 }),
    ).toBe("Bé trai · sinh 10/09/2026 · 3,2 kg");
    expect(
      babySubtitle({ sex: "female", dob: "2026-01-01", birth_weight_g: 3400 }),
    ).toBe("Bé gái · sinh 01/01/2026 · 3,4 kg");
  });

  it("babySubtitle leaves out an unknown birth weight", () => {
    expect(
      babySubtitle({ sex: "female", dob: "2026-01-01", birth_weight_g: null }),
    ).toBe("Bé gái · sinh 01/01/2026");
  });

  it("memberCountText counts people", () => {
    expect(memberCountText(3)).toBe("3 người");
    expect(memberCountText(1)).toBe("1 người");
  });

  it("snoozeValue says Không unless reminders are paused for later", () => {
    const now = new Date("2026-11-14T12:00:00.000Z"); // 19:00 VN
    expect(snoozeValue(null, now)).toBe("Không");
    expect(snoozeValue("2026-11-14T11:00:00.000Z", now)).toBe("Không");
    expect(snoozeValue("2026-11-14T15:00:00.000Z", now)).toBe("Đến 22:00");
  });

  it("nightHoursText joins start and end with an en dash", () => {
    expect(
      nightHoursText({ enabled: true, start: "21:00", end: "06:00" }),
    ).toBe("21:00–06:00");
  });
});
