import { formatDayShort } from "./days";
import type { ScheduleItem } from "./vaccines";

// Spec 2026-11-19 §9: the line on the Tiêm chủng card of Sức khỏe, for the dose nextDose
// returned. The day comes first so a long dose name cannot cut it off.
export function vaccineCardText(next: ScheduleItem | null): string | null {
  if (next === null) return null;
  return next.state === "overdue"
    ? `Quá hạn: ${next.dose.name}`
    : `${formatDayShort(next.due)} · ${next.dose.name}`;
}
