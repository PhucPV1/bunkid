import { describe, expect, it } from "vitest";
import {
  canModifyLog,
  daySummary,
  groupByVnDay,
  historyPageRange,
  matchesFilter,
  nextHistoryPage,
} from "./history";

const now = new Date("2026-11-14T03:00:00Z"); // 10:00 on 14/11 in VN

describe("history", () => {
  it("matchesFilter groups breast and bottle under feed", () => {
    expect(matchesFilter({ type: "breast" }, "feed")).toBe(true);
    expect(matchesFilter({ type: "bottle" }, "feed")).toBe(true);
    expect(matchesFilter({ type: "sleep" }, "feed")).toBe(false);
    expect(matchesFilter({ type: "pump" }, "all")).toBe(true);
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
    expect(daySummary(logs, new Date(at("08:00")))).toBe(
      "2 cữ · 2 tã · ngủ 2g 15p",
    );
  });

  it("counts a running sleep up to now, and says 0 when nothing happened", () => {
    expect(
      daySummary([entry("sleep", "07:00", null)], new Date(at("07:30"))),
    ).toBe("0 cữ · 0 tã · ngủ 30p");
    expect(daySummary([], new Date(at("07:30")))).toBe("0 cữ · 0 tã · ngủ 0p");
  });
});
