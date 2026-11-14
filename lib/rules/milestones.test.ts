import { describe, expect, it } from "vitest";
import type { MilestoneGroup, MotorMilestone } from "@/lib/content/milestones";
import {
  ageInMonths,
  motorStatus,
  parseMilestoneForm,
  visibleGroups,
} from "./milestones";

const group = (months: number) => ({ months }) as MilestoneGroup;
const groups = [2, 4, 6, 9, 12].map(group);

describe("visibleGroups (spec §6.9)", () => {
  it("shows the current age group and the next one", () => {
    const at = (m: number) => visibleGroups(groups, m).map((g) => g.months);
    expect(at(0.5)).toEqual([2, 4]);
    expect(at(2)).toEqual([2, 4]);
    expect(at(3.9)).toEqual([2, 4]);
    expect(at(4)).toEqual([4, 6]);
    expect(at(13)).toEqual([12]);
  });
});

describe("motorStatus", () => {
  const sitting = {
    code: "ngoi",
    fromMonths: 3.8,
    toMonths: 9.2,
  } as MotorMilestone;
  it("is early, in the window, late, or done", () => {
    expect(motorStatus(sitting, 2, false)).toEqual({
      state: "early",
      text: "Thường trong khoảng 3,8–9,2 tháng",
    });
    expect(motorStatus(sitting, 6, false).state).toBe("window");
    expect(motorStatus(sitting, 9.2, false).state).toBe("window");
    expect(motorStatus(sitting, 9.3, false)).toEqual({
      state: "late",
      text: "Đã quá khoảng bình thường (3,8–9,2 tháng), nên hỏi bác sĩ",
    });
    expect(motorStatus(sitting, 12, true)).toEqual({
      state: "done",
      text: "Đã đạt",
    });
  });

  it("converts days to months", () => {
    expect(ageInMonths(30.4375 * 6)).toBe(6);
  });
});

describe("parseMilestoneForm", () => {
  const ctx = { dob: "2026-09-14", today: "2026-11-14" };
  it("needs a day between birth and today and a short note", () => {
    expect(
      parseMilestoneForm(
        { achievedOn: "2026-11-14", note: " Lật lần đầu " },
        ctx,
      ),
    ).toEqual({
      ok: true,
      value: { achieved_on: "2026-11-14", note: "Lật lần đầu" },
    });
    expect(
      parseMilestoneForm({ achievedOn: "2026-09-13", note: "" }, ctx),
    ).toEqual({
      ok: false,
      message: "Ngày đạt phải từ ngày sinh đến hôm nay.",
    });
    expect(
      parseMilestoneForm(
        { achievedOn: "2026-11-14", note: "x".repeat(501) },
        ctx,
      ),
    ).toEqual({
      ok: false,
      message: "Ghi chú tối đa 500 ký tự.",
    });
  });
});
