import { fromVnLocalInput } from "./time";

export type TimeChip = "now" | "5m" | "15m" | "custom";

export const TIME_CHIPS: { value: TimeChip; label: string }[] = [
  { value: "now", label: "Bây giờ" },
  { value: "5m", label: "5p trước" },
  { value: "15m", label: "15p trước" },
  { value: "custom", label: "Giờ khác" },
];

const MINUTES_AGO: Record<Exclude<TimeChip, "custom">, number> = {
  now: 0,
  "5m": 5,
  "15m": 15,
};

// Spec §8.1. An empty or broken custom value gives an Invalid Date for the caller to reject.
export function timeChipToDate(
  chip: TimeChip,
  now: Date,
  custom?: string,
): Date {
  if (chip === "custom")
    return custom ? fromVnLocalInput(custom) : new Date(Number.NaN);
  return new Date(now.getTime() - MINUTES_AGO[chip] * 60_000);
}

const FUTURE_SLACK_MS = 60_000;

// A quick entry is something that already happened. A future time would also
// push the next-feed reminder out to that time and hide the row from Nhật ký.
export function timeChipError(when: Date, now: Date): string | null {
  if (Number.isNaN(when.getTime())) return "Chọn giờ hợp lệ";
  if (when.getTime() > now.getTime() + FUTURE_SLACK_MS)
    return "Giờ ghi không được ở tương lai";
  return null;
}
