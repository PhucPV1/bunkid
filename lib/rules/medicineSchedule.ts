import { sameMedicine } from "./medicineNames";
import { MEDICINE_PRESETS } from "./quickEntry";

// The columns of medicine_schedules the settings screen works with.
export type ScheduleLike = {
  id: string;
  name: string;
  remind_at_min: number;
  enabled: boolean;
  created_at: string;
};

// One line of Cài đặt › Nhắc thuốc. `schedule` is null for a preset that has
// never been switched on, so it has no row in the database yet.
export type ScheduleRow = {
  key: string;
  name: string;
  preset: boolean;
  schedule: ScheduleLike | null;
};

// Spec 2026-11-17 §4.2: a schedule that is switched on for the first time reminds at 09:00.
export const DEFAULT_REMIND_MIN = 540;

const isPreset = (name: string) =>
  MEDICINE_PRESETS.some((preset) => sameMedicine(preset, name));

// The three presets first, in their own order, then the other medicines oldest first.
export function scheduleRows(schedules: ScheduleLike[]): ScheduleRow[] {
  const presets = MEDICINE_PRESETS.map((name): ScheduleRow => ({
    key: `preset:${name}`,
    name,
    preset: true,
    schedule: schedules.find((s) => sameMedicine(name, s.name)) ?? null,
  }));
  const others = schedules
    .filter((s) => !isPreset(s.name))
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((s): ScheduleRow => ({
      key: s.id,
      name: s.name,
      preset: false,
      schedule: s,
    }));
  return [...presets, ...others];
}

// Why "Thêm" cannot add this name, or null when it can.
export function newScheduleError(
  name: string,
  schedules: ScheduleLike[],
): string | null {
  if (name.trim() === "") return "Nhập tên thuốc";
  const taken =
    isPreset(name) || schedules.some((s) => sameMedicine(s.name, name));
  return taken ? "Thuốc này đã có trong danh sách" : null;
}

// Spec §4.4: the value on the "Lịch nhắc thuốc" row of Cài đặt.
export function enabledCountText(schedules: { enabled: boolean }[]): string {
  const count = schedules.filter((s) => s.enabled).length;
  return count === 0 ? "Tắt" : `${count} thuốc`;
}
