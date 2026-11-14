import { fromVnLocalInput } from "./time";

export type TimeChip = "now" | "5m" | "15m" | "custom";

export const TIME_CHIPS: { value: TimeChip; label: string }[] = [
  { value: "now", label: "Bây giờ" },
  { value: "5m", label: "5 phút trước" },
  { value: "15m", label: "15 phút trước" },
  { value: "custom", label: "Chọn giờ…" },
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
