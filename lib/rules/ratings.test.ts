import { describe, expect, it } from "vitest";
import type { LogLike } from "@/lib/rules/describeLog";
import {
  countFeedsInWindow,
  dailyNorm,
  groupFeedSessions,
  type MetricResult,
  rateLast24h,
  sleepMinutesInWindow,
  wetDiapersInWindow,
  windowTotals,
} from "@/lib/rules/ratings";

const NOW = new Date("2026-11-14T05:00:00Z");
const H = 3_600_000;
const ago = (hours: number) =>
  new Date(NOW.getTime() - hours * H).toISOString();
const log = (
  type: string,
  start: number,
  end: number | null,
  details: unknown = {},
): LogLike => ({
  type,
  started_at: ago(start),
  ended_at: end === null ? null : ago(end),
  details,
});
const bottle = (h: number, ml = 90) =>
  log("bottle", h, h, { ml, milk: "formula" });
const wet = (h: number) => log("diaper", h, h, { wet: true, dirty: false });
const bottlesEvery3h = (n: number) =>
  Array.from({ length: n }, (_, i) => bottle(1 + 3 * i));
const wets = (n: number) => Array.from({ length: n }, (_, i) => wet(1 + 2 * i));
const OLD = ago(48);

describe("feed sessions", () => {
  it("merges feeds that start within 30 minutes after the previous one ends", () => {
    const logs = [
      log("breast", 3, 2.75, { side: "left" }),
      log("breast", 2.6, 2.4, { side: "right" }),
      bottle(1.5),
      bottle(25),
    ];
    expect(groupFeedSessions(logs, NOW)).toHaveLength(3);
    expect(countFeedsInWindow(logs, NOW)).toBe(2);
  });
  it("does not let a forgotten breast timer absorb the feeds after it", () => {
    const logs = [log("breast", 10, null), bottle(7), bottle(4), bottle(1)];
    expect(countFeedsInWindow(logs, NOW)).toBe(4);
    // A timer started 20 minutes ago is one feed with the top-up right after it.
    expect(
      countFeedsInWindow([log("breast", 20 / 60, null), bottle(0.1)], NOW),
    ).toBe(1);
  });
});

describe("window totals", () => {
  it("clips sleep to the 24-hour window and counts a running sleep up to now", () => {
    expect(
      sleepMinutesInWindow(
        [log("sleep", 25, 23), log("sleep", 0.5, null)],
        NOW,
      ),
    ).toBe(90);
  });
  it("counts only valid wet diapers inside the window", () => {
    const logs = [
      wet(1),
      log("diaper", 2, 2, { wet: false, dirty: true }),
      wet(30),
      log("diaper", 3, 3, { bad: 1 }),
    ];
    expect(wetDiapersInWindow(logs, NOW)).toBe(1);
  });
  it("sums bottle ml and dirty diapers inside the window", () => {
    const logs = [
      bottle(1),
      bottle(2),
      log("diaper", 2, 2, { wet: true, dirty: true }),
      bottle(30, 50),
    ];
    expect(windowTotals(logs, NOW)).toEqual({ bottleMl: 180, dirtyDiapers: 1 });
  });
});

describe("rateLast24h", () => {
  it("reports no data until the first log is 24 hours old", () => {
    expect(
      rateLast24h({
        logs: [bottle(1)],
        ageDays: 60,
        firstLogAt: ago(10),
        now: NOW,
      }),
    ).toEqual({
      sleepMinutes: { status: "no-data" },
      feeds: { status: "no-data" },
      wetDiapers: { status: "no-data" },
    });
  });

  it("rates sleep against the age band", () => {
    const rate = (logs: LogLike[], age: number) =>
      rateLast24h({ logs, ageDays: age, firstLogAt: OLD, now: NOW })
        .sleepMinutes;
    expect(rate([log("sleep", 20, 5)], 60)).toEqual({
      status: "rated",
      rating: "green",
      value: 900,
      explain: "Bé ngủ đủ (chuẩn 14–17 giờ)",
    });
    expect(rate([log("sleep", 20, 10)], 60)).toEqual({
      status: "rated",
      rating: "yellow",
      value: 600,
      explain: "Bé ngủ ít hơn chuẩn (14–17 giờ)",
    });
    expect(rate([log("sleep", 23, 4)], 200)).toEqual({
      status: "rated",
      rating: "yellow",
      value: 1140,
      explain: "Bé ngủ nhiều hơn chuẩn (12–15 giờ)",
    });
    expect(rate([bottle(1)], 60)).toEqual({ status: "no-data" });
  });

  it("rates feeds by age and stops rating after 180 days", () => {
    const rate = (logs: LogLike[], age: number) =>
      rateLast24h({ logs, ageDays: age, firstLogAt: OLD, now: NOW }).feeds;
    expect(rate(bottlesEvery3h(6), 60)).toEqual({
      status: "rated",
      rating: "green",
      value: 6,
      explain: "Đủ cữ bú (chuẩn từ 6 cữ)",
    });
    expect(rate(bottlesEvery3h(5), 60)).toEqual({
      status: "rated",
      rating: "yellow",
      value: 5,
      explain: "Ít cữ bú hơn chuẩn (từ 6 cữ)",
    });
    expect(rate(bottlesEvery3h(6), 20)).toMatchObject({
      rating: "yellow",
      explain: "Ít cữ bú hơn chuẩn (từ 8 cữ)",
    });
    expect(rate(bottlesEvery3h(6), 200)).toEqual({
      status: "not-rated",
      value: 6,
    });
  });

  it("rates wet diapers from day 6, red below 4", () => {
    const rate = (logs: LogLike[], age: number) =>
      rateLast24h({ logs, ageDays: age, firstLogAt: OLD, now: NOW }).wetDiapers;
    expect(rate(wets(2), 3)).toEqual({ status: "not-rated", value: 2 });
    expect(rate(wets(6), 60)).toEqual({
      status: "rated",
      rating: "green",
      value: 6,
      explain: "Đủ tã ướt (chuẩn từ 6 tã)",
    });
    expect(rate(wets(4), 60)).toMatchObject({
      rating: "yellow",
      explain: "Hơi ít tã ướt (chuẩn từ 6 tã)",
    });
    expect(rate(wets(3), 60)).toMatchObject({
      rating: "red",
      explain: "Rất ít tã ướt: nguy cơ mất nước",
    });
    expect(
      rate([log("diaper", 1, 1, { wet: false, dirty: true })], 60),
    ).toMatchObject({ rating: "red", value: 0 });
  });
});

// Spec 2026-11-19 §8: the norm the Thống kê chart draws.
describe("dailyNorm", () => {
  const AGES = [5, 6, 30, 31, 90, 91, 180, 181];

  it("gives the sleep band of the age, in hours", () => {
    expect(dailyNorm("sleep", 5)).toEqual({ min: 14, max: 17 });
    expect(dailyNorm("sleep", 90)).toEqual({ min: 14, max: 17 });
    expect(dailyNorm("sleep", 91)).toEqual({ min: 12, max: 15 });
    expect(dailyNorm("sleep", 364)).toEqual({ min: 12, max: 15 });
    expect(dailyNorm("sleep", 365)).toEqual({ min: 11, max: 14 });
    expect(dailyNorm("sleep", 729)).toEqual({ min: 11, max: 14 });
    expect(dailyNorm("sleep", 730)).toEqual({ min: 10, max: 13 });
  });

  it("gives the feed minimum up to 180 days and nothing after", () => {
    expect(dailyNorm("feed", 5)).toEqual({ min: 8 });
    expect(dailyNorm("feed", 30)).toEqual({ min: 8 });
    expect(dailyNorm("feed", 31)).toEqual({ min: 6 });
    expect(dailyNorm("feed", 180)).toEqual({ min: 6 });
    expect(dailyNorm("feed", 181)).toBeNull();
  });

  it("gives the wet-diaper minimum from day 6", () => {
    expect(dailyNorm("diaper", 5)).toBeNull();
    expect(dailyNorm("diaper", 6)).toEqual({ min: 6 });
    expect(dailyNorm("diaper", 181)).toEqual({ min: 6 });
  });

  it("has no norm for the other tabs", () => {
    for (const tab of ["pump", "tummy", "solids"] as const)
      for (const age of AGES) expect(dailyNorm(tab, age)).toBeNull();
  });

  it("uses the numbers rateLast24h explains at every boundary age", () => {
    // What the rating says: its explain line, or its status when not rated.
    const said = (result: MetricResult) =>
      result.status === "rated" ? result.explain : result.status;
    const logs = [log("sleep", 20, 5), ...bottlesEvery3h(8), ...wets(6)];
    for (const ageDays of AGES) {
      const day = rateLast24h({ logs, ageDays, firstLogAt: OLD, now: NOW });
      const sleep = dailyNorm("sleep", ageDays);
      const feed = dailyNorm("feed", ageDays);
      const wet = dailyNorm("diaper", ageDays);
      expect(said(day.sleepMinutes)).toContain(
        `${sleep?.min}–${sleep?.max} giờ`,
      );
      expect(said(day.feeds)).toContain(
        feed ? `từ ${feed.min} cữ` : "not-rated",
      );
      expect(said(day.wetDiapers)).toContain(
        wet ? `từ ${wet.min} tã` : "not-rated",
      );
    }
  });
});
