import type { CategoryToken } from "@/lib/ui/categories";
import type { IconName } from "@/lib/ui/icons";
import { formatDayShort, vnDayStartMs } from "./days";
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

// The rows in priority order, at most ATTENTION_MAX. A source whose data has
// not loaded is passed as null and gives no row.
export function attentionItems(input: {
  vaccine: ScheduleItem | null;
  today: string;
}): AttentionItem[] {
  const rows = [vaccineAttention(input.vaccine, input.today)];
  return rows
    .filter((row): row is AttentionItem => row !== null)
    .slice(0, ATTENTION_MAX);
}
