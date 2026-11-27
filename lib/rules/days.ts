import { vnDateString } from "./time";

const DAY_MS = 86_400_000;
export const WEEKDAYS = [
  "Chủ nhật",
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
];

export function vnDayStartMs(day: string): number {
  return Date.parse(`${day}T00:00:00+07:00`);
}

// Spec 2026-11-27 §4.3: the start of a VN day as an ISO string, the form
// useRangeLogs takes.
export function startOfDayIso(day: string): string {
  return new Date(vnDayStartMs(day)).toISOString();
}

export function addDays(day: string, n: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

// Calendar months; a day the target month lacks becomes its last day (31/01 + 1 → 28/02).
export function addMonths(day: string, n: number): string {
  const [year, month, date] = day.split("-").map(Number);
  const first = new Date(Date.UTC(year, month - 1 + n, 1));
  const lastDate = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  ).getUTCDate();
  first.setUTCDate(Math.min(date, lastDate));
  return first.toISOString().slice(0, 10);
}

export function vnDayRange(now: Date, count: number): string[] {
  const today = vnDateString(now);
  return Array.from({ length: count }, (_, i) => addDays(today, i - count + 1));
}

export function formatDayShort(day: string): string {
  const [, month, date] = day.split("-");
  return `${date}/${month}`;
}

// Spec 2026-11-19 §7.2: "2026-10-29" → "29/10/2026".
export function formatDayFull(day: string): string {
  const [year, month, date] = day.split("-");
  return `${date}/${month}/${year}`;
}

export function vnDayLabel(day: string, now: Date): string {
  const today = vnDateString(now);
  if (day === today) return "Hôm nay";
  if (day === addDays(today, -1)) return "Hôm qua";
  const weekday = WEEKDAYS[new Date(`${day}T00:00:00Z`).getUTCDay()];
  return `${weekday}, ${formatDayShort(day)}`;
}
