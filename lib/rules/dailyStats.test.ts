import { describe, expect, it } from "vitest";
import {
  chartRows,
  dailyStats,
  type DayStat,
  emptyStatsText,
  hasStatsData,
  sleepHours,
  STATS_TABS,
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
        pumpMl: 0,
        tummyMinutes: 0,
        solidsMeals: 0,
        waterMl: 0,
      },
      {
        day: "2026-11-14",
        sleepMinutes: 0,
        feeds: 0,
        bottleMl: 0,
        wetDiapers: 1,
        dirtyDiapers: 1,
        pumpMl: 0,
        tummyMinutes: 0,
        solidsMeals: 0,
        waterMl: 0,
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
      pumpMl: 150,
      tummyMinutes: 25,
      solidsMeals: 3,
      waterMl: 90,
    };
    expect(chartRows([stat], "sleep")).toEqual([
      { label: "9", primary: 14, secondary: null },
    ]);
    expect(chartRows([stat], "feed")[0].primary).toBe(8);
    expect(chartRows([stat], "diaper")).toEqual([
      { label: "9", primary: 6, secondary: 2 },
    ]);
    expect(chartRows([stat], "pump")[0].primary).toBe(150);
    expect(chartRows([stat], "tummy")[0].primary).toBe(25);
    expect(chartRows([stat], "solids")).toEqual([
      { label: "9", primary: 3, secondary: null },
    ]);
  });

  it("counts solids meals and adds water ml on the VN day they start (spec 2026-11-17 §3.4)", () => {
    const at = (type: string, iso: string, details: unknown = {}) =>
      log(type, iso, iso, details);
    const meal = { food: "Cháo bí đỏ", amount: "some", isNew: false };
    const stats = dailyStats(
      [
        at("solids", "2026-11-13T04:00:00Z", meal),
        at("solids", "2026-11-13T16:59:00Z", meal), // 23:59 on 13/11
        at("solids", "2026-11-13T17:00:00Z", meal), // 00:00 on 14/11
        at("water", "2026-11-13T05:00:00Z", { ml: 30 }),
        at("water", "2026-11-14T01:00:00Z", { ml: 40 }),
        at("water", "2026-11-14T02:00:00Z", { ml: 20 }),
        at("water", "2026-11-14T02:30:00Z", { ml: 0 }), // broken: not added
        at("bath", "2026-11-14T02:40:00Z"),
      ],
      days,
      now,
    );
    expect(stats.map((s) => s.solidsMeals)).toEqual([2, 1]);
    expect(stats.map((s) => s.waterMl)).toEqual([30, 60]);
    // Neither is a feed: the feed count and the bottle ml stay untouched (spec §3.5).
    expect(stats.map((s) => s.feeds)).toEqual([0, 0]);
    expect(stats.map((s) => s.bottleMl)).toEqual([0, 0]);
  });

  it("STATS_TABS ends with Ăn dặm", () => {
    expect(STATS_TABS).toHaveLength(6);
    expect(STATS_TABS.find((tab) => tab.value === "tummy")?.label).toBe(
      "Nằm sấp",
    );
    expect(STATS_TABS.at(-1)).toEqual({ value: "solids", label: "Ăn dặm" });
  });

  it("adds pumped ml of both sides and tummy minutes per VN day (spec §6.13)", () => {
    const stats = dailyStats(
      [
        log("pump", "2026-11-13T02:00:00Z", "2026-11-13T02:20:00Z", {
          mlLeft: 60,
          mlRight: 45,
        }),
        log("pump", "2026-11-14T01:00:00Z", "2026-11-14T01:15:00Z", {
          mlRight: 70,
        }),
        log("pump", "2026-11-14T02:00:00Z", null, {}),
        log("tummy", "2026-11-13T16:55:00Z", "2026-11-13T17:05:00Z"), // 23:55 → 00:05
        log("tummy", "2026-11-14T02:50:00Z", null), // 09:50, running at 10:00
      ],
      days,
      now,
    );
    expect(stats.map((s) => s.pumpMl)).toEqual([105, 70]);
    expect(stats.map((s) => s.tummyMinutes)).toEqual([5, 15]);
  });
});

describe("empty stats", () => {
  const stat = (day: string, over: Partial<DayStat> = {}): DayStat => ({
    day,
    sleepMinutes: 0,
    feeds: 0,
    bottleMl: 0,
    wetDiapers: 0,
    dirtyDiapers: 0,
    pumpMl: 0,
    tummyMinutes: 0,
    solidsMeals: 0,
    waterMl: 0,
    ...over,
  });

  it("hasStatsData looks at the series the tab draws, including dirty diapers", () => {
    const stats = [stat("2026-11-13"), stat("2026-11-14", { dirtyDiapers: 1 })];
    expect(hasStatsData(stats, "diaper")).toBe(true);
    expect(hasStatsData(stats, "sleep")).toBe(false);
    expect(hasStatsData([stat("2026-11-14", { pumpMl: 40 })], "pump")).toBe(
      true,
    );
  });

  it("the Ăn dặm chart only counts meals: water alone leaves it empty", () => {
    expect(hasStatsData([stat("2026-11-14", { waterMl: 60 })], "solids")).toBe(
      false,
    );
    expect(
      hasStatsData([stat("2026-11-14", { solidsMeals: 1 })], "solids"),
    ).toBe(true);
  });

  it("emptyStatsText names what is missing and the range", () => {
    expect(emptyStatsText("sleep", 7)).toBe(
      "Chưa có giấc ngủ nào trong 7 ngày",
    );
    expect(emptyStatsText("pump", 14)).toBe(
      "Chưa có lần hút sữa nào trong 14 ngày",
    );
    expect(emptyStatsText("tummy", 7)).toBe(
      "Chưa có lần nằm sấp nào trong 7 ngày",
    );
    expect(emptyStatsText("solids", 14)).toBe(
      "Chưa có bữa ăn dặm nào trong 14 ngày",
    );
  });
});
