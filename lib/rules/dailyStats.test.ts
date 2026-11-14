import { describe, expect, it } from "vitest";
import {
  chartRows,
  dailyStats,
  sleepHours,
  statsFetchSince,
} from "./dailyStats";

const days = ["2026-11-13", "2026-11-14"];
const now = new Date("2026-11-14T03:00:00Z"); // 10:00 on 14/11 in VN
const log = (
  type: string,
  started_at: string,
  ended_at: string | null,
  details: unknown = {},
) => ({ type, started_at, ended_at, details });

describe("dailyStats", () => {
  it("splits a sleep across VN midnight", () => {
    const stats = dailyStats(
      [log("sleep", "2026-11-13T15:00:00Z", "2026-11-13T23:00:00Z")], // 22:00 → 06:00
      days,
      now,
    );
    expect(stats.map((s) => s.sleepMinutes)).toEqual([120, 360]);
  });

  it("counts a running sleep up to now", () => {
    const stats = dailyStats(
      [log("sleep", "2026-11-14T01:00:00Z", null)], // 08:00, still asleep at 10:00
      days,
      now,
    );
    expect(stats[1].sleepMinutes).toBe(120);
  });

  it("counts a feed session on the day it starts", () => {
    const stats = dailyStats(
      [
        log("breast", "2026-11-13T16:40:00Z", "2026-11-13T16:55:00Z", {
          side: "left",
        }), // 23:40
        log("bottle", "2026-11-13T17:10:00Z", "2026-11-13T17:10:00Z", {
          ml: 60,
          milk: "formula",
        }), // 00:10, same session
        log("bottle", "2026-11-14T02:00:00Z", "2026-11-14T02:00:00Z", {
          ml: 90,
          milk: "formula",
        }),
      ],
      days,
      now,
    );
    expect(stats.map((s) => s.feeds)).toEqual([1, 1]);
    expect(stats.map((s) => s.bottleMl)).toEqual([0, 150]);
  });

  it("counts wet and dirty diapers and skips broken or out-of-range rows", () => {
    const stats = dailyStats(
      [
        log("diaper", "2026-11-14T01:00:00Z", "2026-11-14T01:00:00Z", {
          wet: true,
          dirty: true,
          stoolColor: "yellow",
        }),
        log("diaper", "2026-11-14T02:00:00Z", "2026-11-14T02:00:00Z", {
          wet: false,
          dirty: false,
        }),
        log("diaper", "2026-11-11T02:00:00Z", "2026-11-11T02:00:00Z", {
          wet: true,
          dirty: false,
        }),
      ],
      days,
      now,
    );
    expect(stats).toEqual([
      {
        day: "2026-11-13",
        sleepMinutes: 0,
        feeds: 0,
        bottleMl: 0,
        wetDiapers: 0,
        dirtyDiapers: 0,
      },
      {
        day: "2026-11-14",
        sleepMinutes: 0,
        feeds: 0,
        bottleMl: 0,
        wetDiapers: 1,
        dirtyDiapers: 1,
      },
    ]);
  });

  it("statsFetchSince starts one day before the first VN day", () => {
    expect(statsFetchSince(["2026-11-08", "2026-11-09"])).toBe(
      "2026-11-06T17:00:00.000Z",
    );
  });

  it("sleepHours rounds to one decimal and chartRows picks the tab's values", () => {
    expect(sleepHours(450)).toBe(7.5);
    expect(sleepHours(100)).toBe(1.7);
    const stat = {
      day: "2026-11-09",
      sleepMinutes: 840,
      feeds: 8,
      bottleMl: 120,
      wetDiapers: 6,
      dirtyDiapers: 2,
    };
    expect(chartRows([stat], "sleep")).toEqual([
      { label: "9", primary: 14, secondary: null },
    ]);
    expect(chartRows([stat], "feed")[0].primary).toBe(8);
    expect(chartRows([stat], "diaper")).toEqual([
      { label: "9", primary: 6, secondary: 2 },
    ]);
  });
});
