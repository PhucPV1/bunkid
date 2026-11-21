import { formatDayShort } from "./days";
import type { GrowthInput } from "./growthForm";
import type { ScheduleItem } from "./vaccines";

const grams = new Intl.NumberFormat("vi-VN");

// Spec 2026-11-19 §9: the line on the Tăng trưởng card of Khám phá, from the
// latest measurement that has a weight. On the same day the first row wins.
export function growthCardText(
  rows: Pick<GrowthInput, "measured_on" | "weight_g">[],
): string | null {
  let latest: { day: string; weightG: number } | null = null;
  for (const row of rows) {
    if (row.weight_g === null) continue;
    if (latest === null || row.measured_on > latest.day)
      latest = { day: row.measured_on, weightG: row.weight_g };
  }
  if (latest === null) return null;
  return `Cân nặng ${grams.format(latest.weightG)} g · ${formatDayShort(latest.day)}`;
}

// Spec 2026-11-19 §9: the line on the Tiêm chủng card, for the dose nextDose
// returned. The day comes first so a long dose name cannot cut it off.
export function vaccineCardText(next: ScheduleItem | null): string | null {
  if (next === null) return null;
  return next.state === "overdue"
    ? `Quá hạn: ${next.dose.name}`
    : `${formatDayShort(next.due)} · ${next.dose.name}`;
}
