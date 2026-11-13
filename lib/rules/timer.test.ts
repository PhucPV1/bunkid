import { describe, expect, it } from "vitest";
import { planTimerPress, type RunningLog } from "@/lib/rules/timer";

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
