import { describe, expect, it } from "vitest";
import {
  canModifyLog,
  daySummary,
  firstScreen,
  groupByVnDay,
  HISTORY_FILTERS,
  historyPageRange,
  historySheet,
  logTimeText,
  matchesFilter,
  nextHistoryPage,
} from "./history";
import { LOG_TYPES } from "./logDetails";

const now = new Date("2026-11-14T03:00:00Z"); // 10:00 on 14/11 in VN

describe("history", () => {
  it("matchesFilter groups breast and bottle under feed", () => {
    expect(matchesFilter({ type: "breast" }, "feed")).toBe(true);
    expect(matchesFilter({ type: "bottle" }, "feed")).toBe(true);
    expect(matchesFilter({ type: "sleep" }, "feed")).toBe(false);
    expect(matchesFilter({ type: "pump" }, "all")).toBe(true);
  });

  it("HISTORY_FILTERS: Ăn dặm and Khác come after Nhiệt độ", () => {
    expect(HISTORY_FILTERS).toHaveLength(8);
    expect(HISTORY_FILTERS.slice(5)).toEqual([
      { value: "temperature", label: "Nhiệt độ" },
      { value: "solids", label: "Ăn dặm" },
      { value: "other", label: "Khác" },
    ]);
  });

  it("matchesFilter: Ăn dặm is solids and water; Khác is bath, note, pump and tummy", () => {
    const shown = (filter: "solids" | "other") =>
      LOG_TYPES.filter((type) => matchesFilter({ type }, filter));
    expect(shown("solids")).toEqual(["solids", "water"]);
    expect(shown("other")).toEqual(["pump", "tummy", "bath", "note"]);
    expect(matchesFilter({ type: "water" }, "feed")).toBe(false);
    expect(matchesFilter({ type: "note" }, "all")).toBe(true);
  });

  it("spec 2026-11-26 §3.3: Nhiệt độ also shows symptom logs", () => {
    expect(
      LOG_TYPES.filter((type) => matchesFilter({ type }, "temperature")),
    ).toEqual(["temperature", "symptom"]);
    expect(matchesFilter({ type: "symptom" }, "other")).toBe(false);
    expect(matchesFilter({ type: "symptom" }, "all")).toBe(true);
    expect(HISTORY_FILTERS[5]).toEqual({
      value: "temperature",
      label: "Nhiệt độ",
    });
  });

  it("groupByVnDay splits at VN midnight, newest day and log first", () => {
    const groups = groupByVnDay([
      { id: "a", started_at: "2026-11-13T16:59:00Z" }, // 23:59 on 13/11
      { id: "c", started_at: "2026-11-14T02:00:00Z" }, // 09:00 on 14/11
      { id: "b", started_at: "2026-11-13T17:00:00Z" }, // 00:00 on 14/11
    ]);
    expect(groups.map((g) => g.day)).toEqual(["2026-11-14", "2026-11-13"]);
    expect(groups[0].logs.map((l) => l.id)).toEqual(["c", "b"]);
    expect(groups[1].logs.map((l) => l.id)).toEqual(["a"]);
  });

  it("spec 2026-11-27 §6.2: symptom logs head their day, oldest of them first", () => {
    const groups = groupByVnDay([
      { id: "s1", type: "symptom", started_at: "2026-11-14T01:00:00Z" }, // 08:00
      { id: "f", type: "bottle", started_at: "2026-11-14T02:00:00Z" }, // 09:00
      { id: "s2", type: "symptom", started_at: "2026-11-14T05:00:00Z" }, // 12:00
      { id: "d", type: "diaper", started_at: "2026-11-14T06:00:00Z" }, // 13:00
      { id: "y", type: "symptom", started_at: "2026-11-13T05:00:00Z" },
    ]);
    expect(groups.map((g) => g.logs.map((l) => l.id))).toEqual([
      ["s1", "s2", "d", "f"],
      ["y"],
    ]);
  });

  it("spec 2026-11-27 §6.2: a symptom log reads Cả ngày instead of its time", () => {
    const at = "2026-11-14T05:00:00Z"; // 12:00 VN
    expect(logTimeText({ type: "symptom", started_at: at })).toBe("Cả ngày");
    expect(logTimeText({ type: "bottle", started_at: at })).toBe("12:00");
  });

  it("spec 2026-11-27 §6.2: a symptom row opens its day's sheet, any other row its edit sheet", () => {
    const symptom = {
      id: "y",
      type: "symptom",
      started_at: "2026-11-13T17:30:00Z", // 00:30 on 14/11
    };
    expect(historySheet(symptom)).toEqual({
      kind: "symptoms",
      day: "2026-11-14",
    });
    const bottle = {
      id: "f",
      type: "bottle",
      started_at: "2026-11-14T02:00:00Z",
    };
    expect(historySheet(bottle)).toEqual({ kind: "log", log: bottle });
  });

  it("historyPageRange covers 7 VN days per page", () => {
    expect(historyPageRange(now, 0)).toEqual({
      fromDay: "2026-11-08",
      from: "2026-11-07T17:00:00.000Z",
      to: "2026-11-14T17:00:00.000Z",
    });
    expect(historyPageRange(now, 1)).toEqual({
      fromDay: "2026-11-01",
      from: "2026-10-31T17:00:00.000Z",
      to: "2026-11-07T17:00:00.000Z",
    });
  });

  it("nextHistoryPage stops once the loaded pages reach the birth date", () => {
    expect(nextHistoryPage("2026-09-01", now, 1)).toBe(1);
    expect(nextHistoryPage("2026-11-08", now, 1)).toBeUndefined();
    expect(nextHistoryPage("2026-11-10", now, 1)).toBeUndefined();
  });

  it("canModifyLog follows the owner/member rules", () => {
    expect(canModifyLog({ role: "owner", user_id: "u1" }, "u2")).toBe(true);
    expect(canModifyLog({ role: "member", user_id: "u1" }, "u1")).toBe(true);
    expect(canModifyLog({ role: "member", user_id: "u1" }, "u2")).toBe(false);
    expect(canModifyLog({ role: "member", user_id: null }, "u2")).toBe(false);
  });
});

describe("daySummary", () => {
  const at = (hhmm: string) => `2026-11-14T${hhmm}:00.000Z`; // UTC; VN = UTC+7
  const entry = (
    type: string,
    start: string,
    end: string | null,
    details: unknown = {},
  ) => ({
    type,
    started_at: at(start),
    ended_at: end === null ? null : at(end),
    details,
  });

  it("counts feed sessions, diapers and sleep of one day", () => {
    const logs = [
      entry("breast", "01:00", "01:20", { side: "left" }),
      entry("bottle", "01:30", "01:30", { ml: 60, milk: "formula" }),
      entry("bottle", "05:00", "05:00", { ml: 90, milk: "formula" }),
      entry("diaper", "02:00", "02:00", { wet: true, dirty: false }),
      entry("diaper", "06:00", "06:00", { wet: true, dirty: true }),
      entry("sleep", "02:00", "03:30"),
      entry("sleep", "06:00", "06:45"),
    ];
    expect(
      daySummary({
        day: "2026-11-14",
        logs,
        all: logs,
        now: new Date(at("08:00")),
      }),
    ).toBe("2 cữ · 2 tã · ngủ 2g 15p");
  });

  it("counts a running sleep up to now, and says 0 when nothing happened", () => {
    const running = [entry("sleep", "07:00", null)];
    const now = new Date(at("07:30"));
    expect(
      daySummary({ day: "2026-11-14", logs: running, all: running, now }),
    ).toBe("0 cữ · 0 tã · ngủ 30p");
    expect(daySummary({ day: "2026-11-14", logs: [], all: [], now })).toBe(
      "0 cữ · 0 tã · ngủ 0p",
    );
  });

  it("shares a night of sleep between the two days at VN midnight", () => {
    // 21:00 on 14/11 to 06:00 on 15/11 in VN.
    const night = {
      type: "sleep",
      started_at: "2026-11-14T14:00:00.000Z",
      ended_at: "2026-11-14T23:00:00.000Z",
      details: {},
    };
    const now = new Date("2026-11-15T03:00:00.000Z");
    expect(
      daySummary({ day: "2026-11-14", logs: [night], all: [night], now }),
    ).toBe("0 cữ · 0 tã · ngủ 3g");
    expect(daySummary({ day: "2026-11-15", logs: [], all: [night], now })).toBe(
      "0 cữ · 0 tã · ngủ 6g",
    );
  });
});

describe("firstScreen", () => {
  const day = (name: string, count: number) => ({
    day: name,
    logs: Array.from({ length: count }, (_, i) => `${name}-${i}`),
  });

  it("keeps whole days until the row budget is used", () => {
    const groups = [day("a", 5), day("b", 7), day("c", 4)];
    expect(firstScreen(groups, 12)).toEqual([groups[0], groups[1]]);
  });

  it("cuts the last day it reaches to the rows that are left", () => {
    const groups = [day("a", 5), day("b", 20), day("c", 4)];
    const shown = firstScreen(groups, 12);
    expect(shown.map((g) => g.logs.length)).toEqual([5, 7]);
    expect(shown[1].logs).toEqual(groups[1].logs.slice(0, 7));
    expect(groups[1].logs).toHaveLength(20);
  });

  it("returns every day when they fit", () => {
    const groups = [day("a", 2), day("b", 3)];
    expect(firstScreen(groups, 12)).toEqual(groups);
    expect(firstScreen([], 12)).toEqual([]);
  });
});
