import { addDays } from "./days";
import { formatVnTime, vnDateString } from "./time";

export const SNOOZE_HOURS = [2, 4, 8] as const;

export type PrefKey = "feed_reminder" | "wake_window" | "vaccine";

export const PREF_OPTIONS: {
  key: PrefKey;
  label: string;
  note: string | null;
}[] = [
  { key: "feed_reminder", label: "Nhắc cữ bú", note: null },
  {
    key: "wake_window",
    label: "Nhắc khi bé thức quá lâu",
    note: "Có từ đợt 2",
  },
  { key: "vaccine", label: "Nhắc lịch tiêm", note: null },
];

export function snoozeUntil(now: Date, hours: number): string {
  return new Date(now.getTime() + hours * 3_600_000).toISOString();
}

export function snoozeText(until: string | null, now: Date): string | null {
  if (!until || Date.parse(until) <= now.getTime()) return null;
  const end = new Date(until);
  const day = vnDateString(end);
  const today = vnDateString(now);
  const time = formatVnTime(end);
  if (day === today) return `Đang tạm tắt nhắc đến ${time}`;
  if (day === addDays(today, 1))
    return `Đang tạm tắt nhắc đến ${time} ngày mai`;
  const [, month, date] = day.split("-");
  return `Đang tạm tắt nhắc đến ${time} ngày ${date}/${month}`;
}
