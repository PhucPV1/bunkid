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

export function motorStatus(
  milestone: MotorMilestone,
  ageMonths: number,
  achieved: boolean,
): { state: MotorState; text: string } {
  const range = `${months.format(milestone.fromMonths)}–${months.format(milestone.toMonths)} tháng`;
  if (achieved) return { state: "done", text: "Đã đạt" };
  if (ageMonths < milestone.fromMonths)
    return { state: "early", text: `Thường trong khoảng ${range}` };
  if (ageMonths <= milestone.toMonths)
    return {
      state: "window",
      text: `Đang trong khoảng bình thường (${range})`,
    };
  return {
    state: "late",
    text: `Đã quá khoảng bình thường (${range}), nên hỏi bác sĩ`,
  };
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
