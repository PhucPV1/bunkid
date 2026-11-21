import { describe, expect, it } from "vitest";
import {
  ACTION_SHEET_CLOSED,
  actionLabel,
  actionSheetReducer,
  isActionRunning,
  isSuggestedSide,
  NEXT_SIDE_LABEL,
  QUICK_ACTION_GROUPS,
  QUICK_ACTIONS,
  sheetGroups,
  shouldAskPumpAmounts,
  type QuickActionGroup,
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

  // Spec 2026-11-19 §5.4: the "+" sheet lists Khác, Ghi nhanh, then Bấm giờ.
  it("QUICK_ACTION_GROUPS titles the three groups, timers last; the timer group is exactly the timers", () => {
    expect(QUICK_ACTION_GROUPS).toEqual([
      { group: "other", title: "Khác" },
      { group: "quick", title: "Ghi nhanh" },
      { group: "timer", title: "Bấm giờ" },
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

// Spec 2026-11-19 §5.4: the "+" sheet can be opened with only some groups.
describe("sheetGroups", () => {
  it("draws all three groups without a filter", () => {
    expect(sheetGroups()).toEqual(QUICK_ACTION_GROUPS);
    expect(sheetGroups(undefined)).toEqual(QUICK_ACTION_GROUPS);
  });

  it("keeps only the groups asked for, in the sheet's own order", () => {
    expect(sheetGroups(["other"])).toEqual([{ group: "other", title: "Khác" }]);
    expect(sheetGroups(["timer", "other"]).map((g) => g.group)).toEqual([
      "other",
      "timer",
    ]);
  });
});

describe("actionSheetReducer", () => {
  const opened = (groups?: QuickActionGroup[]) =>
    actionSheetReducer(ACTION_SHEET_CLOSED, { type: "open", groups });

  it("starts closed", () => {
    expect(ACTION_SHEET_CLOSED).toEqual({ open: false });
  });

  it("opens with the groups asked for, or with all of them", () => {
    expect(opened(["other"])).toEqual({ open: true, groups: ["other"] });
    expect(opened().open).toBe(true);
    expect(sheetGroups(opened().groups)).toHaveLength(3);
  });

  it("+ opens every group, also right after a filtered sheet was closed", () => {
    const closed = actionSheetReducer(opened(["other"]), { type: "close" });
    const again = actionSheetReducer(closed, { type: "toggle" });
    expect(again.open).toBe(true);
    expect(again.groups).toBeUndefined();
  });

  it("closing keeps the groups, so the sheet does not change on its way out", () => {
    const shut = { open: false, groups: ["other"] };
    expect(actionSheetReducer(opened(["other"]), { type: "close" })).toEqual(
      shut,
    );
    expect(actionSheetReducer(opened(["other"]), { type: "toggle" })).toEqual(
      shut,
    );
    expect(actionSheetReducer(ACTION_SHEET_CLOSED, { type: "close" })).toBe(
      ACTION_SHEET_CLOSED,
    );
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
