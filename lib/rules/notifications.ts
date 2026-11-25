import { addDays } from "./days";
import { formatVnTime, vnDateString } from "./time";

export const SNOOZE_HOURS = [2, 4, 8] as const;

export type PrefKey =
  | "feed_reminder"
  | "wake_window"
  | "vaccine"
  | "medicine"
  | "timer_alert"
  | "growth_alert"
  | "growth_measure";

export const PREF_OPTIONS: {
  key: PrefKey;
  label: string;
  note: string | null;
}[] = [
  { key: "feed_reminder", label: "Nhắc cữ bú", note: null },
  { key: "wake_window", label: "Nhắc khi bé thức quá lâu", note: null },
  { key: "vaccine", label: "Nhắc lịch tiêm", note: null },
  // Spec 2026-11-17 §4.4.
  { key: "medicine", label: "Nhắc thuốc", note: null },
  { key: "timer_alert", label: "Nhắc timer chạy quá lâu", note: null },
  // Spec 2026-11-25 §8.1.
  { key: "growth_alert", label: "Cảnh báo tăng trưởng", note: null },
  { key: "growth_measure", label: "Nhắc đo định kỳ", note: null },
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

// Spec 2026-11-17 §4.1 and §4.3: each user's quiet hours, in minutes after
// 00:00 Vietnam time.
export type QuietPrefs = {
  quiet_enabled: boolean;
  quiet_start_min: number;
  quiet_end_min: number;
};

export const DEFAULT_QUIET: QuietPrefs = {
  quiet_enabled: false,
  quiet_start_min: 1320,
  quiet_end_min: 360,
};

// Minutes after 00:00 Vietnam time.
export function vnMinuteOfDay(now: Date): number {
  const [hours, minutes] = formatVnTime(now).split(":").map(Number);
  return hours * 60 + minutes;
}

// Off when the switch is off or both ends are the same minute. A range whose
// start is after its end runs across midnight.
export function inQuietHours(prefs: QuietPrefs, now: Date): boolean {
  const { quiet_enabled, quiet_start_min: start, quiet_end_min: end } = prefs;
  if (!quiet_enabled || start === end) return false;
  const m = vnMinuteOfDay(now);
  return start < end ? m >= start && m < end : m >= start || m < end;
}

export function minutesToTime(minutes: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

// Reads the value of an <input type="time">; null when it is not HH:mm.
export function timeToMinutes(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

// Spec §4.4: the value shown on the "Giờ yên lặng" row.
export function quietHoursValue(prefs: QuietPrefs): string {
  return prefs.quiet_enabled
    ? `${minutesToTime(prefs.quiet_start_min)}–${minutesToTime(prefs.quiet_end_min)}`
    : "Tắt";
}

// Spec §4.4: what the quiet-hours sheet saves, or why it cannot.
export function quietHoursPatch(
  enabled: boolean,
  from: string,
  to: string,
): { ok: true; patch: QuietPrefs } | { ok: false; message: string } {
  const start = timeToMinutes(from);
  const end = timeToMinutes(to);
  if (start === null || end === null)
    return { ok: false, message: "Chọn giờ bắt đầu và giờ kết thúc" };
  if (start === end)
    return { ok: false, message: "Giờ bắt đầu và kết thúc phải khác nhau" };
  return {
    ok: true,
    patch: {
      quiet_enabled: enabled,
      quiet_start_min: start,
      quiet_end_min: end,
    },
  };
}
