import { describe, expect, it } from "vitest";
import {
  nextBreastSide,
  overdueTimers,
  pillTimer,
  planTimerPress,
  TIMER_LIMIT_MIN,
  type RunningLog,
} from "@/lib/rules/timer";

const breastLeft: RunningLog = {
  id: "b1",
  type: "breast",
  details: { side: "left" },
};
const sleeping: RunningLog = { id: "s1", type: "sleep", details: {} };

describe("planTimerPress", () => {
  it("starts a timer when none of that type runs", () => {
    expect(planTimerPress([], { type: "sleep" })).toEqual([
      { kind: "start", type: "sleep", details: {} },
    ]);
    expect(planTimerPress([], { type: "breast", side: "right" })).toEqual([
      { kind: "start", type: "breast", details: { side: "right" } },
    ]);
  });
  it("stops the running timer when the same button is pressed", () => {
    expect(planTimerPress([sleeping], { type: "sleep" })).toEqual([
      { kind: "stop", id: "s1" },
    ]);
    expect(
      planTimerPress([breastLeft], { type: "breast", side: "left" }),
    ).toEqual([{ kind: "stop", id: "b1" }]);
  });
  it("switches breast side by stopping then starting", () => {
    expect(
      planTimerPress([breastLeft], { type: "breast", side: "right" }),
    ).toEqual([
      { kind: "stop", id: "b1" },
      { kind: "start", type: "breast", details: { side: "right" } },
    ]);
  });
  it("keeps different timer types independent", () => {
    expect(planTimerPress([breastLeft], { type: "sleep" })).toEqual([
      { kind: "start", type: "sleep", details: {} },
    ]);
  });
});

const NOW = new Date("2026-11-17T05:00:00Z"); // 12:00 giờ VN
const minutesAgo = (m: number) =>
  new Date(NOW.getTime() - m * 60_000).toISOString();
const timed = (
  id: string,
  type: string,
  startMin: number,
  endMin: number | null,
  details: unknown = {},
) => ({
  id,
  type,
  started_at: minutesAgo(startMin),
  ended_at: endMin === null ? null : minutesAgo(endMin),
  details,
});

describe("TIMER_LIMIT_MIN", () => {
  it("is 60 for breast and pump, 30 for tummy, 14 hours for sleep", () => {
    expect(TIMER_LIMIT_MIN).toEqual({
      breast: 60,
      pump: 60,
      tummy: 30,
      sleep: 840,
    });
  });
});

describe("overdueTimers", () => {
  it("keeps running timers at or past their limit, oldest first", () => {
    const logs = [
      timed("t", "tummy", 30, null),
      timed("b", "breast", 59, null, { side: "left" }),
      timed("p", "pump", 61, null),
      timed("s", "sleep", 840, null),
    ];
    expect(overdueTimers(logs, NOW).map((l) => l.id)).toEqual(["s", "p", "t"]);
  });

  it("ignores finished logs, instant logs and types without a limit", () => {
    const logs = [
      timed("done", "sleep", 900, 10),
      timed("bottle", "bottle", 500, 500),
      timed("odd", "bath", 500, null),
    ];
    expect(overdueTimers(logs, NOW)).toEqual([]);
  });
});

describe("nextBreastSide", () => {
  it("suggests the side opposite to the latest finished breast log", () => {
    const logs = [
      timed("a", "breast", 300, 290, { side: "right" }),
      timed("b", "breast", 120, 105, { side: "left" }),
      timed("c", "bottle", 60, 60, { ml: 90, milk: "formula" }),
    ];
    expect(nextBreastSide(logs, NOW)).toEqual({
      suggest: "right",
      last: "left",
      lastAt: minutesAgo(120),
    });
  });

  it("says nothing without a breast log in the last 24 hours", () => {
    expect(nextBreastSide([], NOW)).toBeNull();
    expect(
      nextBreastSide(
        [timed("old", "breast", 24 * 60 + 1, 24 * 60, { side: "left" })],
        NOW,
      ),
    ).toBeNull();
  });

  it("says nothing while a breast timer is running", () => {
    const logs = [
      timed("b", "breast", 120, 105, { side: "left" }),
      timed("run", "breast", 5, null, { side: "right" }),
    ];
    expect(nextBreastSide(logs, NOW)).toBeNull();
  });

  it("skips a breast log whose side cannot be read", () => {
    const logs = [
      timed("bad", "breast", 30, 20, {}),
      timed("ok", "breast", 200, 190, { side: "right" }),
    ];
    expect(nextBreastSide(logs, NOW)?.suggest).toBe("left");
  });
});

describe("pillTimer", () => {
  it("shows the timer started last and counts the others", () => {
    const logs = [
      timed("s", "sleep", 90, null),
      timed("b", "breast", 12, null, { side: "left" }),
      timed("done", "tummy", 40, 35),
    ];
    const pill = pillTimer(logs);
    expect(pill?.log.id).toBe("b");
    expect(pill?.more).toBe(1);
  });

  it("is null when nothing is running", () => {
    expect(pillTimer([timed("done", "sleep", 90, 10)])).toBeNull();
  });
});
