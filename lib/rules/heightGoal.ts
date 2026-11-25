import { ADULT_HEIGHT } from "@/lib/content/adultHeight";
import type { LmsRow, WhoSex } from "@/lib/content/who";
import { lmsAt, valueAtZ, zScore } from "./growth";

// Spec 2026-11-25 §6.2. Every function here is pure.

const upToOneDecimal = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 1,
});
const oneDecimal = new Intl.NumberFormat("vi-VN", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
// To one decimal, half up. The `+ 0` turns a rounded −0 into 0, which would
// otherwise be written "-0,0".
const tenth = (n: number) => Math.round(n * 10) / 10 + 0;

// "180", "165,5": a height as the family typed it.
export const formatCm = (cm: number) => upToOneDecimal.format(cm);

// The range a child's adult height is expected to fall in, from the parents'
// heights. `mid` is kept as it is; the two ends are whole centimetres, and
// every comparison with the range uses these rounded ends.
export type ParentalRange = { mid: number; low: number; high: number };

export function midParental(
  father: number,
  mother: number,
  sex: WhoSex,
): ParentalRange {
  const mid = (father + mother + (sex === "boys" ? 13 : -13)) / 2;
  return { mid, low: Math.round(mid - 8.5), high: Math.round(mid + 8.5) };
}

// Where an adult of that height stands in the WHO reference at 19 years.
export function targetZ(target: number, sex: WhoSex): number {
  return zScore(ADULT_HEIGHT[sex], target);
}

// The length, on each day of age, of a child who keeps that position on the
// WHO chart. Stops where the table stops.
export function targetCurve(
  table: LmsRow[],
  z: number,
  toDay: number,
  step: number,
): { day: number; value: number }[] {
  const points: { day: number; value: number }[] = [];
  const every = Math.max(1, Math.floor(step));
  for (let day = 0; day <= toDay; day += every) {
    const lms = lmsAt(table, day);
    if (!lms) break;
    points.push({ day, value: valueAtZ(lms, z) });
  }
  return points;
}

export type GoalStatus = {
  // "Sát đường mục tiêu", "Trên đường mục tiêu 1,2 cm", …
  text: string;
  // The same after "Mục tiêu {t} cm: " on the Sức khỏe page (§6.4).
  short: string;
  // Below the line is said in a neutral chip: it is not a warning.
  chip: { text: string; tone: "good" | "neutral" } | null;
  // The newest length minus the target line on that day, to one decimal; null
  // without a length the WHO table can place.
  diff: number | null;
};

const NO_LENGTH = "Chưa có lần đo chiều dài";
const ON_TRACK = { text: "Đang đúng hướng", tone: "good" } as const;

export function goalStatus(input: {
  // The newest length inside the WHO table (see `readings`), or null.
  reading: { value: number; ageDays: number } | null;
  z: number;
  table: LmsRow[];
}): GoalStatus {
  const lms = input.reading ? lmsAt(input.table, input.reading.ageDays) : null;
  if (!input.reading || !lms)
    return {
      text: NO_LENGTH,
      short: NO_LENGTH.toLocaleLowerCase("vi"),
      chip: null,
      diff: null,
    };
  const diff = tenth(input.reading.value - valueAtZ(lms, input.z));
  if (diff <= -1) {
    const text = `Dưới đường mục tiêu ${oneDecimal.format(-diff)} cm`;
    return {
      text,
      short: text.toLocaleLowerCase("vi"),
      chip: { text: "Dưới đường mục tiêu", tone: "neutral" },
      diff,
    };
  }
  return {
    text:
      diff >= 1
        ? `Trên đường mục tiêu ${oneDecimal.format(diff)} cm`
        : "Sát đường mục tiêu",
    short: "đang đúng hướng",
    chip: ON_TRACK,
    diff,
  };
}

// How the family's target compares with the range from the parents' heights.
export function targetVsRange(target: number, range: ParentalRange): string {
  const t = formatCm(target);
  if (target > range.high)
    return `Mục tiêu ${t} cm cao hơn khoảng dự kiến. App vẫn theo dõi, nhưng mục tiêu này khó đạt.`;
  if (target < range.low) return `Mục tiêu ${t} cm thấp hơn khoảng dự kiến.`;
  return `Mục tiêu ${t} cm nằm trong khoảng, ở nửa ${target >= range.mid ? "trên" : "dưới"}.`;
}
