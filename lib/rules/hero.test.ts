import { describe, expect, it } from "vitest";
import type { LogLike } from "./describeLog";
import {
  formatClock,
  formatMinutes,
  formatTabClock,
  heroState,
  longTimerText,
  runningLabel,
  timerLabel,
} from "./hero";

const NOW = new Date("2026-11-14T05:00:00Z"); // 12:00 giờ VN
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
const bottle = (h: number) => log("bottle", h, h, { ml: 90, milk: "formula" });
const state = (logs: LogLike[]) =>
  heroState({ logs, feedIntervalMin: 180, now: NOW });

// Spec 2026-11-19 §3.2: running, empty, overdue, awake, none, in that order.
describe("heroState", () => {
  it("running: the timer that started last wins", () => {
    const sleep = log("sleep", 2, null);
    const breast = log("breast", 0.5, null, { side: "left" });
    expect(state([sleep, breast, bottle(1)])).toEqual({
      kind: "running",
      log: breast,
    });
  });

  it("running beats every other state", () => {
    const tummy = log("tummy", 0.1, null);
    expect(state([tummy])).toEqual({ kind: "running", log: tummy });
    expect(state([bottle(5), tummy])).toEqual({ kind: "running", log: tummy });
    expect(state([bottle(1), log("sleep", 3, 1), tummy])).toEqual({
      kind: "running",
      log: tummy,
    });
  });

  it("empty: no feed in the last 12 hours, even after a recent sleep", () => {
    expect(state([])).toEqual({ kind: "empty" });
    expect(state([bottle(12.5), log("sleep", 3, 1)])).toEqual({
      kind: "empty",
    });
  });

  it("overdue: at or after the expected feed time, even after a recent sleep", () => {
    expect(state([bottle(3)])).toEqual({
      kind: "overdue",
      due: new Date("2026-11-14T05:00:00Z"),
      lateMinutes: 0,
    });
    expect(state([bottle(3.5), log("sleep", 2, 1)])).toEqual({
      kind: "overdue",
      due: new Date("2026-11-14T04:30:00Z"),
      lateMinutes: 30,
    });
  });

  it("a feed exactly 12 hours old still counts", () => {
    expect(state([bottle(12)]).kind).toBe("overdue");
  });

  it("awake: before the expected feed, since the end of the last sleep", () => {
    expect(state([bottle(1), log("sleep", 2, 0.75)])).toEqual({
      kind: "awake",
      since: new Date("2026-11-14T04:15:00Z"),
    });
  });

  it("awake takes the sleep that ended last, not the one that started last", () => {
    const logs = [
      bottle(1),
      log("sleep", 11, 9),
      log("sleep", 5, 0.5),
      log("sleep", 3, 2),
    ];
    expect(state(logs)).toEqual({
      kind: "awake",
      since: new Date("2026-11-14T04:30:00Z"),
    });
  });

  it("a sleep that ended exactly 12 hours ago still counts", () => {
    expect(state([bottle(1), log("sleep", 14, 12)])).toEqual({
      kind: "awake",
      since: new Date("2026-11-13T17:00:00Z"),
    });
  });

  it("none: before the expected feed with no sleep ended in the last 12 hours", () => {
    expect(state([bottle(1)])).toEqual({ kind: "none" });
    expect(state([log("breast", 1, 0.5, { side: "right" })])).toEqual({
      kind: "none",
    });
    expect(state([bottle(1), log("sleep", 14, 12.5)])).toEqual({
      kind: "none",
    });
  });
});

describe("hero text helpers", () => {
  it("timerLabel names each timer", () => {
    expect(timerLabel(log("breast", 1, null, { side: "left" }))).toBe(
      "Bú trái",
    );
    expect(timerLabel(log("breast", 1, null, { side: "right" }))).toBe(
      "Bú phải",
    );
    expect(timerLabel(log("sleep", 1, null))).toBe("Ngủ");
    expect(timerLabel(log("pump", 1, null))).toBe("Hút sữa");
    expect(timerLabel(log("tummy", 1, null))).toBe("Nằm sấp");
  });

  // Spec 2026-11-19 §3.2: the label on the hero card of a running timer.
  it("runningLabel says what the baby is doing", () => {
    const label = (type: string, details: unknown = {}) =>
      runningLabel(log(type, 1, null, details));
    expect(label("sleep")).toBe("Đang ngủ");
    expect(label("breast", { side: "left" })).toBe("Đang bú trái");
    expect(label("breast", { side: "right" })).toBe("Đang bú phải");
    expect(label("pump")).toBe("Đang hút sữa");
    expect(label("tummy")).toBe("Đang nằm sấp");
    expect(label("vaccine")).toBe("Đang chạy");
  });

  it("formatClock shows M:SS, then H:MM:SS from one hour", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(65_000)).toBe("1:05");
    expect(formatClock(59 * 60_000 + 59_999)).toBe("59:59");
    expect(formatClock(3_725_000)).toBe("1:02:05");
    expect(formatClock(-5_000)).toBe("0:00");
  });

  // Spec 2026-11-19 §4: the clock on the tab bar's timer tile.
  it("formatTabClock shows M:SS, then hours and minutes from one hour", () => {
    expect(formatTabClock(0)).toBe("0:00");
    expect(formatTabClock(54 * 60_000 + 38_000)).toBe("54:38");
    expect(formatTabClock(59 * 60_000 + 59_999)).toBe("59:59");
    expect(formatTabClock(3_600_000)).toBe("1g 00p");
    expect(formatTabClock(3_900_000)).toBe("1g 05p");
    expect(formatTabClock(3_959_999)).toBe("1g 05p");
    expect(formatTabClock(14 * 3_600_000 + 30 * 60_000)).toBe("14g 30p");
    expect(formatTabClock(-5_000)).toBe("0:00");
  });

  it("formatMinutes switches to hours from 60 minutes", () => {
    expect(formatMinutes(0)).toBe("0 phút");
    expect(formatMinutes(25)).toBe("25 phút");
    expect(formatMinutes(60)).toBe("1 giờ 00 phút");
    expect(formatMinutes(125)).toBe("2 giờ 05 phút");
  });

  it("longTimerText says how long a timer has run and asks if it still is", () => {
    expect(longTimerText(log("tummy", 32 / 60, null), NOW)).toBe(
      "Nằm sấp đã chạy 32 phút. Còn đang nằm sấp không?",
    );
    expect(
      longTimerText(log("breast", 1.25, null, { side: "left" }), NOW),
    ).toBe("Bú trái đã chạy 1 giờ 15 phút. Còn đang bú không?");
    expect(longTimerText(log("sleep", 14.5, null), NOW)).toBe(
      "Ngủ đã chạy 14 giờ 30 phút. Còn đang ngủ không?",
    );
    expect(longTimerText(log("pump", 1, null), NOW)).toBe(
      "Hút sữa đã chạy 1 giờ 00 phút. Còn đang hút sữa không?",
    );
  });
});
