import { describe, expect, it } from "vitest";
import {
  DEFAULT_REMIND_MIN,
  enabledCountText,
  newScheduleError,
  scheduleRows,
  type ScheduleLike,
} from "./medicineSchedule";

const row = (over: Partial<ScheduleLike>): ScheduleLike => ({
  id: "s1",
  name: "Vitamin D",
  remind_at_min: 540,
  enabled: true,
  created_at: "2026-11-17T01:00:00Z",
  ...over,
});

describe("scheduleRows (spec 2026-11-17 §4.2)", () => {
  it("always lists the three presets first, off when not in the database", () => {
    const rows = scheduleRows([]);
    expect(rows.map((r) => [r.name, r.preset, r.schedule])).toEqual([
      ["Vitamin D", true, null],
      ["DHA", true, null],
      ["Men tiêu hoá", true, null],
    ]);
    expect(DEFAULT_REMIND_MIN).toBe(540);
  });

  it("attaches a saved preset to its row and lists other medicines by creation time", () => {
    const d3 = row({ id: "d", name: "vitamin d3", remind_at_min: 600 });
    const iron = row({
      id: "i",
      name: "Siro sắt",
      created_at: "2026-11-17T03:00:00Z",
    });
    const zinc = row({
      id: "z",
      name: "Kẽm",
      enabled: false,
      created_at: "2026-11-17T02:00:00Z",
    });
    const rows = scheduleRows([iron, d3, zinc]);
    expect(rows.map((r) => [r.name, r.preset, r.schedule?.id ?? null])).toEqual(
      [
        ["Vitamin D", true, "d"],
        ["DHA", true, null],
        ["Men tiêu hoá", true, null],
        ["Kẽm", false, "z"],
        ["Siro sắt", false, "i"],
      ],
    );
    expect(new Set(rows.map((r) => r.key)).size).toBe(5);
  });
});

describe("newScheduleError", () => {
  const saved = [row({ name: "Siro sắt" })];
  it("asks for a name", () => {
    expect(newScheduleError("   ", saved)).toBe("Nhập tên thuốc");
  });
  it("refuses a name already in the list, presets included", () => {
    expect(newScheduleError("siro sat", saved)).toBe(
      "Thuốc này đã có trong danh sách",
    );
    expect(newScheduleError("Men tiêu hóa", saved)).toBe(
      "Thuốc này đã có trong danh sách",
    );
    expect(newScheduleError("vitamin D3", [])).toBe(
      "Thuốc này đã có trong danh sách",
    );
  });
  it("accepts a new name", () => {
    expect(newScheduleError("Canxi", saved)).toBeNull();
  });
});

describe("enabledCountText (spec §4.4)", () => {
  it("counts the schedules that are on, or says Tắt", () => {
    expect(enabledCountText([])).toBe("Tắt");
    expect(enabledCountText([row({ enabled: false })])).toBe("Tắt");
    expect(
      enabledCountText([
        row({}),
        row({ id: "s2", name: "DHA" }),
        row({ id: "s3", name: "Kẽm", enabled: false }),
      ]),
    ).toBe("2 thuốc");
  });
});
