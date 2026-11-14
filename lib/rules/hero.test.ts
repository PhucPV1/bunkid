import { describe, expect, it } from "vitest";
import type { LogLike } from "./describeLog";
import {
  formatClock,
  formatMinutes,
  heroState,
  ringProgress,
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

describe("heroState", () => {
  it("running: the timer that started last wins", () => {
    const sleep = log("sleep", 2, null);
    const breast = log("breast", 0.5, null, { side: "left" });
    expect(state([sleep, breast, bottle(1)])).toEqual({
      kind: "running",
      log: breast,
    });
  });

  it("running beats an overdue feed", () => {
    const tummy = log("tummy", 0.1, null);
    expect(state([bottle(5), tummy])).toEqual({ kind: "running", log: tummy });
  });

  it("next: before the expected feed time", () => {
    expect(state([bottle(1)])).toEqual({
      kind: "next",
      due: new Date("2026-11-14T07:00:00Z"),
      minutesLeft: 120,
    });
    expect(state([log("breast", 1, 0.5, { side: "right" })])).toEqual({
      kind: "next",
      due: new Date("2026-11-14T07:00:00Z"),
      minutesLeft: 120,
    });
  });

  it("overdue: at or after the expected feed time", () => {
    expect(state([bottle(3)])).toEqual({
      kind: "overdue",
      due: new Date("2026-11-14T05:00:00Z"),
      lateMinutes: 0,
    });
    expect(state([bottle(3.5)])).toEqual({
      kind: "overdue",
      due: new Date("2026-11-14T04:30:00Z"),
      lateMinutes: 30,
    });
  });

  it("empty: no feed in the last 12 hours", () => {
    expect(state([])).toEqual({ kind: "empty" });
    expect(state([bottle(12.5), log("sleep", 3, 1)])).toEqual({
      kind: "empty",
    });
  });

  it("a feed exactly 12 hours old still counts", () => {
    expect(state([bottle(12)]).kind).toBe("overdue");
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

  it("formatClock shows M:SS, then H:MM:SS from one hour", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(65_000)).toBe("1:05");
    expect(formatClock(59 * 60_000 + 59_999)).toBe("59:59");
    expect(formatClock(3_725_000)).toBe("1:02:05");
    expect(formatClock(-5_000)).toBe("0:00");
  });

  it("formatMinutes switches to hours from 60 minutes", () => {
    expect(formatMinutes(0)).toBe("0 phút");
    expect(formatMinutes(25)).toBe("25 phút");
    expect(formatMinutes(60)).toBe("1 giờ 00 phút");
    expect(formatMinutes(125)).toBe("2 giờ 05 phút");
  });

  it("ringProgress fills the ring once an hour", () => {
    expect(ringProgress(0)).toBe(0);
    expect(ringProgress(15 * 60_000)).toBe(0.25);
    expect(ringProgress(75 * 60_000)).toBe(0.25);
    expect(ringProgress(-1_000)).toBe(0);
  });
});
