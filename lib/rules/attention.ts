import type { CategoryToken } from "@/lib/ui/categories";
import type { IconName } from "@/lib/ui/icons";
import { formatDayShort, vnDayStartMs } from "./days";
import { alertTone, type GrowthAlert } from "./growthAlerts";
import type { HabitStats } from "./habits";
import type { ScheduleItem } from "./vaccines";

export type AttentionTone = "normal" | "warn" | "danger";

// Spec 2026-11-25 §4: one row of "Cần chú ý" on the Sức khỏe page.
export type AttentionItem = {
  key: string;
  icon: IconName;
  color: CategoryToken;
  title: string;
  detail: string;
  tone: AttentionTone;
  href: string;
};

export const ATTENTION_MAX = 4;
// A dose due later than this many days from today is not listed yet.
export const VACCINE_SOON_DAYS = 14;

const DAY_MS = 86_400_000;

// Rows 2 and 3 of the table: `next` is what nextDose returned.
export function vaccineAttention(
  next: ScheduleItem | null,
  today: string,
): AttentionItem | null {
  if (next === null) return null;
  const base = {
    key: "vaccine",
    icon: "syringe",
    color: "cat-temp",
    href: "/tiem-chung",
  } as const;
  if (next.state === "overdue")
    return {
      ...base,
      title: `Quá hạn: ${next.dose.name}`,
      detail: `Hẹn ${formatDayShort(next.due)}`,
      tone: "warn",
    };
  const days = Math.round(
    (vnDayStartMs(next.due) - vnDayStartMs(today)) / DAY_MS,
  );
  if (days < 0 || days > VACCINE_SOON_DAYS) return null;
  return {
    ...base,
    title: next.dose.name,
    detail:
      days === 0
        ? "Hẹn hôm nay"
        : `Hẹn ${formatDayShort(next.due)} · còn ${days} ngày`,
    tone: "normal",
  };
}

// Row 1 of the table: one row per growth alert, in the order growthAlerts
// returned them (red first). null: the alerts are not worked out yet.
export function growthAttention(alerts: GrowthAlert[] | null): AttentionItem[] {
  return (alerts ?? []).map((alert) => ({
    key: `growth-${alert.indicator}`,
    icon: "ruler",
    color: "cat-tummy",
    title: alert.title,
    detail: alert.advice,
    tone: alertTone(alert.level),
    href: "/tang-truong",
  }));
}

// Row 4 of the table: `measure` is what nextMeasureDue worked out and the day
// of the last measurement. null: the measurements have not loaded yet.
export function measureAttention(
  measure: { measureDue: boolean; lastMeasuredOn: string | null } | null,
): AttentionItem | null {
  if (measure === null || !measure.measureDue) return null;
  return {
    key: "measure",
    icon: "ruler",
    color: "cat-tummy",
    title: "Đến kỳ đo",
    detail:
      measure.lastMeasuredOn === null
        ? "Chưa có lần đo nào"
        : `Lần đo gần nhất ${formatDayShort(measure.lastMeasuredOn)}`,
    tone: "normal",
    href: "/tang-truong",
  };
}

// Rows 5 and 6 of the table: `habits` is what habitStats worked out, the
// detail of each row or null. null: the logs have not loaded yet.
export function habitAttention(
  habits: HabitStats["attention"] | null,
): AttentionItem[] {
  if (habits === null) return [];
  const rows: AttentionItem[] = [];
  if (habits.sleep !== null)
    rows.push({
      key: "sleep",
      icon: "moon",
      color: "cat-sleep",
      title: "Ngủ ít hơn chuẩn",
      detail: habits.sleep,
      tone: "warn",
      href: "/thong-ke",
    });
  if (habits.tummy !== null)
    rows.push({
      key: "tummy",
      icon: "smile",
      color: "cat-tummy",
      title: "Nằm sấp còn ít",
      detail: habits.tummy,
      tone: "warn",
      href: "/tang-truong/chieu-cao",
    });
  return rows;
}

// The rows in priority order, at most ATTENTION_MAX. A source whose data has
// not loaded is passed as null and gives no row.
export function attentionItems(input: {
  growth: GrowthAlert[] | null;
  vaccine: ScheduleItem | null;
  measure: { measureDue: boolean; lastMeasuredOn: string | null } | null;
  habits: HabitStats["attention"] | null;
  today: string;
}): AttentionItem[] {
  const rows = [
    ...growthAttention(input.growth),
    vaccineAttention(input.vaccine, input.today),
    measureAttention(input.measure),
    ...habitAttention(input.habits),
  ];
  return rows
    .filter((row): row is AttentionItem => row !== null)
    .slice(0, ATTENTION_MAX);
}
