import type { MilestoneGroup, MotorMilestone } from "@/lib/content/milestones";

const DAYS_PER_MONTH = 30.4375;

export const ageInMonths = (ageDays: number) => ageDays / DAYS_PER_MONTH;

// Spec §6.9: show the current age group and the next one.
export function visibleGroups(
  groups: MilestoneGroup[],
  ageMonths: number,
): MilestoneGroup[] {
  let current = 0;
  groups.forEach((group, index) => {
    if (group.months <= ageMonths) current = index;
  });
  return groups.slice(current, current + 2);
}

export type MotorState = "done" | "early" | "window" | "late";

const months = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

// Spec 2026-11-27 §3.4: short words for the chip in the "Vận động lớn" sheet.
export function motorStatus(
  milestone: MotorMilestone,
  ageMonths: number,
  achieved: boolean,
): { state: MotorState; text: string } {
  if (achieved) return { state: "done", text: "Đã đạt" };
  if (ageMonths < milestone.fromMonths)
    return { state: "early", text: "Sắp tới" };
  if (ageMonths <= milestone.toMonths)
    return { state: "window", text: "Đang tới tuổi" };
  return { state: "late", text: "Nên hỏi bác sĩ" };
}

// The normal window, for screen readers in the sheet.
export function motorRange(milestone: MotorMilestone): string {
  return `Thường trong khoảng ${months.format(milestone.fromMonths)}–${months.format(milestone.toMonths)} tháng`;
}

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

// Spec 2026-11-27 §3.4: the line under "Vận động lớn" names milestones, no
// counts, and turns orange when one is late.
export function motorSummary(
  motor: readonly MotorMilestone[],
  ageMonths: number,
  achieved: ReadonlySet<string>,
): { tone: "muted" | "warn"; text: string } {
  const states = motor.map((m) => ({
    m,
    state: motorStatus(m, ageMonths, achieved.has(m.code)).state,
  }));
  const named = (state: MotorState) =>
    states.filter((s) => s.state === state).map((s) => s.m.short);
  const late = named("late");
  if (late.length > 0)
    return {
      tone: "warn",
      text: `${capitalize(late.join(", "))}: nên hỏi bác sĩ`,
    };
  const done = named("done");
  if (done.length === motor.length)
    return { tone: "muted", text: `Đã đạt đủ ${motor.length} mốc` };
  const window = named("window");
  const parts = [
    done.length > 0 ? `đã ${done[done.length - 1]}` : "",
    window.length > 0 ? `đang tới tuổi ${window.join(", ")}` : "",
  ].filter(Boolean);
  if (parts.length === 0) parts.push(`sắp tới tuổi ${named("early")[0]}`);
  return { tone: "muted", text: capitalize(parts.join(" · ")) };
}

// Spec 2026-11-27 §3.5: the age-window bars run from 0 to 18 months.
export const MOTOR_AXIS_MONTHS = 18;

const percent = (fraction: number) => `${Number((fraction * 100).toFixed(1))}%`;

export function motorBar(
  milestone: MotorMilestone,
  ageMonths: number,
): { left: string; width: string; today: string } {
  const axis = MOTOR_AXIS_MONTHS;
  const to = Math.min(milestone.toMonths, axis);
  return {
    left: percent(milestone.fromMonths / axis),
    width: percent((to - milestone.fromMonths) / axis),
    today: percent(Math.min(ageMonths, axis) / axis),
  };
}

export type StepKind =
  "past-done" | "past-missing" | "current" | "next" | "later";

export type TimelineStep = {
  group: MilestoneGroup;
  kind: StepKind;
  summary: string | null;
  summaryTone: "muted" | "warn";
};

// Spec 2026-11-27 §3.1: the last group the baby has reached, or -1 before
// the first one.
function currentIndex(groups: MilestoneGroup[], ageMonths: number): number {
  let current = -1;
  groups.forEach((group, index) => {
    if (group.months <= ageMonths) current = index;
  });
  return current;
}

// Spec 2026-11-27 §3.1–§3.2: every month group with its kind and summary.
// Before the data is loaded nothing is orange and no group has a summary.
export function timelineSteps(
  groups: MilestoneGroup[],
  ageMonths: number,
  achieved: ReadonlySet<string>,
  loaded: boolean,
  babyName: string,
): TimelineStep[] {
  const current = currentIndex(groups, ageMonths);
  return groups.map((group, index) => {
    const total = group.items.length;
    const done = group.items.filter((i) => achieved.has(i.code)).length;
    const step = (
      kind: StepKind,
      summary: string,
      summaryTone: "muted" | "warn" = "muted",
    ): TimelineStep => ({
      group,
      kind,
      summary: loaded ? summary : null,
      summaryTone,
    });
    if (index < current) {
      if (!loaded) return step("next", "");
      if (done === total) return step("past-done", `Đạt đủ ${total} mốc`);
      return step(
        "past-missing",
        `Còn ${total - done} mốc chưa đạt · nên hỏi bác sĩ`,
        "warn",
      );
    }
    if (index === current)
      return step("current", `${babyName} đang ở đây · đạt ${done}/${total}`);
    if (index === current + 1)
      return step(
        "next",
        done === 0 ? "Sắp tới" : `Sắp tới · đạt ${done}/${total}`,
      );
    return step("later", done === 0 ? "Sau này" : `Đạt ${done}/${total}`);
  });
}

// Spec 2026-11-27 §3.3: the group open when the screen opens.
export function defaultOpenMonths(
  groups: MilestoneGroup[],
  ageMonths: number,
): number {
  return groups[Math.max(currentIndex(groups, ageMonths), 0)].months;
}

export function parseMilestoneForm(
  raw: { achievedOn: string; note: string },
  ctx: { dob: string; today: string },
):
  | { ok: true; value: { achieved_on: string; note: string | null } }
  | { ok: false; message: string } {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(raw.achievedOn) ||
    raw.achievedOn < ctx.dob ||
    raw.achievedOn > ctx.today
  )
    return { ok: false, message: "Ngày đạt phải từ ngày sinh đến hôm nay." };
  const note = raw.note.trim();
  if (note.length > 500)
    return { ok: false, message: "Ghi chú tối đa 500 ký tự." };
  return {
    ok: true,
    value: { achieved_on: raw.achievedOn, note: note || null },
  };
}
