import { ADULT_HEIGHT } from "@/lib/content/adultHeight";
import type { LmsRow, WhoSex } from "@/lib/content/who";
import { lmsAt, valueAtZ, zScore } from "./growth";
import { type GrowthMeasure, readings } from "./growthAlerts";

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

const DAYS_PER_MONTH = 30.4375;
const VELOCITY_MIN_DAYS = 14;
// Below three quarters of what is usual the chip says so, in a neutral tone.
const VELOCITY_GOOD_SHARE = 0.75;

export type LengthVelocity = {
  // cm a month, to one decimal: the baby, and the WHO median over the same days.
  rate: string;
  expected: string;
  // measured_on of the two lengths compared.
  from: string;
  to: string;
  chip: { text: string; tone: "good" | "neutral" };
};

// The newest length against the nearest one at least 14 days before it. Null
// without two such lengths inside the WHO table.
export function lengthVelocity(
  rows: GrowthMeasure[],
  table: LmsRow[],
  dob: string,
): LengthVelocity | null {
  const [latest, ...older] = readings(rows, table, dob, "lhfa");
  const before = older.find(
    (reading) => latest.ageDays - reading.ageDays >= VELOCITY_MIN_DAYS,
  );
  if (!latest || !before) return null;
  const days = latest.ageDays - before.ageDays;
  const rate = ((latest.value - before.value) / days) * DAYS_PER_MONTH;
  const expected = ((latest.median - before.median) / days) * DAYS_PER_MONTH;
  return {
    rate: oneDecimal.format(tenth(rate)),
    expected: oneDecimal.format(tenth(expected)),
    from: before.day,
    to: latest.day,
    // Compared before rounding.
    chip:
      rate >= VELOCITY_GOOD_SHARE * expected
        ? { text: "Tăng tốt", tone: "good" }
        : { text: "Chậm hơn thường gặp", tone: "neutral" },
  };
}

// Spec §6.5: the sheet "Mục tiêu và chiều cao bố mẹ".
export type HeightGoalRaw = { father: string; mother: string; target: string };

export type HeightGoalInput = {
  father_height_cm: number | null;
  mother_height_cm: number | null;
  target_height_cm: number | null;
};

export type HeightGoalErrors = Partial<Record<keyof HeightGoalRaw, string>>;

const HEIGHT_MIN = 120;
const HEIGHT_MAX = 220;
const HEIGHT_RANGE = "Chiều cao từ 120 đến 220 cm.";
const BOTH_PARENTS = "Nhập cả bố và mẹ.";

// Vietnamese keyboards type "175,5"; both "," and "." are accepted.
function height(raw: string): number | null | "bad" {
  const text = raw.trim().replace(",", ".");
  if (text === "") return null;
  if (!/^\d+(\.\d+)?$/.test(text)) return "bad";
  const value = Number(text);
  return value < HEIGHT_MIN || value > HEIGHT_MAX ? "bad" : tenth(value);
}

export function parseHeightGoal(
  raw: HeightGoalRaw,
):
  | { ok: true; value: HeightGoalInput }
  | { ok: false; errors: HeightGoalErrors } {
  const father = height(raw.father);
  const mother = height(raw.mother);
  const target = height(raw.target);
  const errors: HeightGoalErrors = {};
  if (father === "bad") errors.father = HEIGHT_RANGE;
  if (mother === "bad") errors.mother = HEIGHT_RANGE;
  if (target === "bad") errors.target = HEIGHT_RANGE;
  // Father and mother are entered together or not at all.
  if (typeof father === "number" && mother === null)
    errors.mother = BOTH_PARENTS;
  if (typeof mother === "number" && father === null)
    errors.father = BOTH_PARENTS;
  if (father === "bad" || mother === "bad" || target === "bad")
    return { ok: false, errors };
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      father_height_cm: father,
      mother_height_cm: mother,
      target_height_cm: target,
    },
  };
}

export function heightGoalRaw(baby: HeightGoalInput): HeightGoalRaw {
  const text = (cm: number | null) => (cm === null ? "" : formatCm(cm));
  return {
    father: text(baby.father_height_cm),
    mother: text(baby.mother_height_cm),
    target: text(baby.target_height_cm),
  };
}
