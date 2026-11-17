import { describe, expect, it } from "vitest";
import {
  actionLabel,
  isActionRunning,
  isSuggestedSide,
  NEXT_SIDE_LABEL,
  QUICK_ACTION_GROUPS,
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
  const labelsOf = (group: string) =>
    QUICK_ACTIONS.filter((a) => a.group === group).map((a) => a.label);

  it("lists thirteen actions group by group: timers, quick entries, the rest", () => {
    expect(QUICK_ACTIONS.map((a) => a.group)).toEqual([
      ...Array(5).fill("timer"),
      ...Array(4).fill("quick"),
      ...Array(4).fill("other"),
    ]);
    expect(labelsOf("timer")).toEqual([
      "Bú trái",
      "Bú phải",
      "Ngủ",
      "Hút sữa",
      "Nằm sấp",
    ]);
    expect(labelsOf("quick")).toEqual([
      "Bú bình",
      "Thay tã",
      "Thuốc",
      "Nhiệt độ",
    ]);
    expect(labelsOf("other")).toEqual([
      "Ăn dặm",
      "Uống nước",
      "Tắm",
      "Ghi chú",
    ]);
    expect(new Set(QUICK_ACTIONS.map((a) => a.key)).size).toBe(13);
  });

  it("QUICK_ACTION_GROUPS titles the three groups; the timer group is exactly the timers", () => {
    expect(QUICK_ACTION_GROUPS).toEqual([
      { group: "timer", title: "Bấm giờ" },
      { group: "quick", title: "Ghi nhanh" },
      { group: "other", title: "Khác" },
    ]);
    for (const action of QUICK_ACTIONS)
      expect(action.group === "timer").toBe(action.kind === "timer");
  });

  it("the four new actions are instant entries of their own category", () => {
    for (const type of ["solids", "water", "bath", "note"] as const)
      expect(byKey(type)).toMatchObject({
        kind: "instant",
        group: "other",
        category: type,
        instant: type,
      });
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

describe("next-side hint (spec 2026-11-17 §5.3)", () => {
  it("marks only the breast action of the suggested side", () => {
    expect(NEXT_SIDE_LABEL).toBe("Nên bú");
    expect(
      QUICK_ACTIONS.filter((a) => isSuggestedSide(a, "right")).map(
        (a) => a.key,
      ),
    ).toEqual(["breast-right"]);
    expect(
      QUICK_ACTIONS.filter((a) => isSuggestedSide(a, "left")).map((a) => a.key),
    ).toEqual(["breast-left"]);
    expect(QUICK_ACTIONS.some((a) => isSuggestedSide(a, null))).toBe(false);
  });
});
