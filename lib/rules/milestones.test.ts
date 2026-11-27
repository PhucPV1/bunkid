import { describe, expect, it } from "vitest";
import {
  MILESTONES,
  type MilestoneGroup,
  type MotorMilestone,
} from "@/lib/content/milestones";
import {
  ageInMonths,
  defaultOpenMonths,
  MOTOR_AXIS_MONTHS,
  motorBar,
  motorRange,
  motorStatus,
  motorSummary,
  parseMilestoneForm,
  timelineSteps,
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
  it("is early, in the window, late, or done (spec 2026-11-27 §3.4)", () => {
    expect(motorStatus(sitting, 2, false)).toEqual({
      state: "early",
      text: "Sắp tới",
    });
    expect(motorStatus(sitting, 3.8, false)).toEqual({
      state: "window",
      text: "Đang tới tuổi",
    });
    expect(motorStatus(sitting, 6, false).state).toBe("window");
    expect(motorStatus(sitting, 9.2, false).state).toBe("window");
    expect(motorStatus(sitting, 9.3, false)).toEqual({
      state: "late",
      text: "Nên hỏi bác sĩ",
    });
    expect(motorStatus(sitting, 12, true)).toEqual({
      state: "done",
      text: "Đã đạt",
    });
  });

  it("says the normal window with a decimal comma", () => {
    expect(motorRange(sitting)).toBe("Thường trong khoảng 3,8–9,2 tháng");
    expect(motorRange({ fromMonths: 4, toMonths: 6 } as MotorMilestone)).toBe(
      "Thường trong khoảng 4–6 tháng",
    );
  });

  it("converts days to months", () => {
    expect(ageInMonths(30.4375 * 6)).toBe(6);
  });
});

const motor = MILESTONES.motor;
const codes = (...list: string[]) => new Set(list);

describe("motorSummary (spec 2026-11-27 §3.4)", () => {
  it("names the last milestone reached and those in their window", () => {
    expect(motorSummary(motor, 5, codes("lat"))).toEqual({
      tone: "muted",
      text: "Đã lật · đang tới tuổi ngồi, đứng có đỡ",
    });
    expect(motorSummary(motor, 7, codes("lat", "ngoi", "bo"))).toEqual({
      tone: "muted",
      text: "Đã bò · đang tới tuổi đứng có đỡ, đi có dắt, tự đứng",
    });
  });

  it("starts with the window when nothing is reached yet", () => {
    expect(motorSummary(motor, 3.9, codes())).toEqual({
      tone: "muted",
      text: "Đang tới tuổi ngồi",
    });
  });

  it("names the first coming milestone when none is reached or due", () => {
    expect(motorSummary(motor, 1, codes())).toEqual({
      tone: "muted",
      text: "Sắp tới tuổi lật",
    });
    expect(motorSummary(motor, 4.5, codes("lat", "ngoi"))).toEqual({
      tone: "muted",
      text: "Đã ngồi",
    });
  });

  it("warns about every late milestone", () => {
    expect(motorSummary(motor, 14, codes("lat", "ngoi", "dung_co_do"))).toEqual(
      { tone: "warn", text: "Bò, đi có dắt: nên hỏi bác sĩ" },
    );
    expect(motorSummary(motor, 6.5, codes())).toEqual({
      tone: "warn",
      text: "Lật: nên hỏi bác sĩ",
    });
  });

  it("says when all of them are reached", () => {
    const all = codes(...motor.map((m) => m.code));
    expect(motorSummary(motor, 20, all)).toEqual({
      tone: "muted",
      text: `Đã đạt đủ ${motor.length} mốc`,
    });
    expect(motor.length).toBe(7);
  });
});

describe("motorBar (spec 2026-11-27 §3.5)", () => {
  const byCode = (code: string) => motor.find((m) => m.code === code)!;
  it("places the window on a 0–18 month axis, as CSS percentages", () => {
    expect(MOTOR_AXIS_MONTHS).toBe(18);
    expect(motorBar(byCode("ngoi"), 5)).toEqual({
      left: "21.1%",
      width: "30%",
      today: "27.8%",
    });
    expect(motorBar(byCode("lat"), 0)).toEqual({
      left: "22.2%",
      width: "11.1%",
      today: "0%",
    });
  });

  it("keeps today's line at the end of the axis after 18 months", () => {
    expect(motorBar(byCode("tu_di"), 30)).toEqual({
      left: "45.6%",
      width: "52.2%",
      today: "100%",
    });
  });
});

describe("timelineSteps (spec 2026-11-27 §3.1–§3.2)", () => {
  const groups = MILESTONES.groups;
  const kinds = (age: number) =>
    timelineSteps(groups, age, codes(), true, "Bun").map(
      (s) => `${s.group.months}:${s.kind}`,
    );
  const allOf = (months: number) =>
    groups.find((g) => g.months === months)!.items.map((i) => i.code);

  it("puts the baby on the timeline", () => {
    expect(kinds(0.5)).toEqual([
      "2:next",
      "4:later",
      "6:later",
      "9:later",
      "12:later",
      "15:later",
      "18:later",
      "24:later",
    ]);
    expect(kinds(2).slice(0, 3)).toEqual(["2:current", "4:next", "6:later"]);
    expect(kinds(3.9).slice(0, 3)).toEqual(["2:current", "4:next", "6:later"]);
    expect(kinds(5).slice(0, 4)).toEqual([
      "2:past-missing",
      "4:current",
      "6:next",
      "9:later",
    ]);
    expect(kinds(13)).toEqual([
      "2:past-missing",
      "4:past-missing",
      "6:past-missing",
      "9:past-missing",
      "12:current",
      "15:next",
      "18:later",
      "24:later",
    ]);
    expect(kinds(30).slice(-2)).toEqual(["18:past-missing", "24:current"]);
  });

  it("writes the summary of each kind", () => {
    const two = allOf(2);
    const done = codes(...two.slice(0, -1), allOf(4)[0], allOf(6)[0]);
    const steps = timelineSteps(groups, 5, done, true, "Bun");
    expect(steps.slice(0, 4).map((s) => [s.summary, s.summaryTone])).toEqual([
      ["Còn 1 mốc chưa đạt · nên hỏi bác sĩ", "warn"],
      ["Bun đang ở đây · đạt 1/13", "muted"],
      ["Sắp tới · đạt 1/12", "muted"],
      ["Sau này", "muted"],
    ]);
    const full = timelineSteps(groups, 5, codes(...two), true, "Bun");
    expect(full[0]).toMatchObject({
      kind: "past-done",
      summary: "Đạt đủ 11 mốc",
      summaryTone: "muted",
    });
    expect(full[2].summary).toBe("Sắp tới");
    const later = timelineSteps(groups, 5, codes(allOf(9)[0]), true, "Bun");
    expect(later[3].summary).toBe("Đạt 1/13");
  });

  it("shows no summary and no orange before the data is loaded", () => {
    const steps = timelineSteps(groups, 5, codes(), false, "Bun");
    expect(steps.map((s) => s.summary)).toEqual(groups.map(() => null));
    expect(steps.slice(0, 3).map((s) => s.kind)).toEqual([
      "next",
      "current",
      "next",
    ]);
  });
});

describe("defaultOpenMonths (spec 2026-11-27 §3.3)", () => {
  it("opens the current group, or the first one for a newborn", () => {
    const groups = MILESTONES.groups;
    expect(defaultOpenMonths(groups, 0.5)).toBe(2);
    expect(defaultOpenMonths(groups, 5)).toBe(4);
    expect(defaultOpenMonths(groups, 30)).toBe(24);
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
