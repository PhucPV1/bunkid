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

export function addDays(day: string, n: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

export function vnDayRange(now: Date, count: number): string[] {
  const today = vnDateString(now);
  return Array.from({ length: count }, (_, i) => addDays(today, i - count + 1));
}

export function formatDayShort(day: string): string {
  const [, month, date] = day.split("-");
  return `${date}/${month}`;
}

export function vnDayLabel(day: string, now: Date): string {
  const today = vnDateString(now);
  if (day === today) return "Hôm nay";
  if (day === addDays(today, -1)) return "Hôm qua";
  const weekday = WEEKDAYS[new Date(`${day}T00:00:00Z`).getUTCDay()];
  return `${weekday}, ${formatDayShort(day)}`;
}
