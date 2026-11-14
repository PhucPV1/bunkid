import { describe, expect, it } from "vitest";
import {
  actionLabel,
  isActionRunning,
  QUICK_ACTIONS,
  shouldAskPumpAmounts,
} from "./quickActions";
import type { RunningLog } from "./timer";

const byKey = (key: string) => QUICK_ACTIONS.find((a) => a.key === key)!;
const leftFeed: RunningLog = {
  id: "l1",
  type: "breast",
  details: { side: "left" },
};

describe("QUICK_ACTIONS", () => {
  it("lists the nine actions of spec §6.3 in grid order", () => {
    expect(QUICK_ACTIONS.map((a) => a.label)).toEqual([
      "Bú trái",
      "Bú phải",
      "Bú bình",
      "Ngủ",
      "Thay tã",
      "Hút sữa",
      "Thuốc",
      "Nhiệt độ",
      "Nằm sấp",
    ]);
  });

  it("marks timers and instant entries", () => {
    expect(
      QUICK_ACTIONS.filter((a) => a.kind === "timer").map((a) => a.key),
    ).toEqual(["breast-left", "breast-right", "sleep", "pump", "tummy"]);
    expect(byKey("breast-right")).toMatchObject({
      kind: "timer",
      category: "breast",
      button: { type: "breast", side: "right" },
    });
    expect(byKey("diaper")).toMatchObject({
      kind: "instant",
      category: "diaper",
      instant: "diaper",
    });
    expect(byKey("temperature")).toMatchObject({
      kind: "instant",
      category: "temperature",
      instant: "temperature",
    });
  });
});

describe("running state", () => {
  it("a breast timer is running only for its own side", () => {
    expect(isActionRunning(byKey("breast-left"), [leftFeed])).toBe(true);
    expect(isActionRunning(byKey("breast-right"), [leftFeed])).toBe(false);
    expect(
      isActionRunning(byKey("sleep"), [
        { id: "s", type: "sleep", details: {} },
      ]),
    ).toBe(true);
    expect(isActionRunning(byKey("diaper"), [leftFeed])).toBe(false);
  });

  it("a running timer reads Dừng …", () => {
    expect(actionLabel(byKey("breast-left"), [leftFeed])).toBe("Dừng bú trái");
    expect(actionLabel(byKey("breast-right"), [leftFeed])).toBe("Bú phải");
    expect(
      actionLabel(byKey("tummy"), [{ id: "t", type: "tummy", details: {} }]),
    ).toBe("Dừng nằm sấp");
  });
});

describe("shouldAskPumpAmounts", () => {
  const pump = { type: "pump", created_by: "u1" };
  it("asks the owner or the person who started the pump", () => {
    expect(shouldAskPumpAmounts(pump, { role: "owner" }, "u2")).toBe(true);
    expect(shouldAskPumpAmounts(pump, { role: "member" }, "u1")).toBe(true);
  });
  it("does not ask anyone else, nor for other timers", () => {
    expect(shouldAskPumpAmounts(pump, { role: "member" }, "u2")).toBe(false);
    expect(
      shouldAskPumpAmounts(
        { type: "sleep", created_by: "u1" },
        { role: "owner" },
        "u1",
      ),
    ).toBe(false);
  });
});
