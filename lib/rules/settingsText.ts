import type { NightSchedule } from "./theme";
import { formatVnTime } from "./time";

export function babySubtitle(baby: {
  sex: string;
  dob: string;
  birth_weight_g: number | null;
}): string {
  const [y, m, d] = baby.dob.split("-");
  const parts = [
    baby.sex === "female" ? "Bé gái" : "Bé trai",
    `sinh ${d}/${m}/${y}`,
  ];
  if (baby.birth_weight_g !== null)
    parts.push(
      `${(baby.birth_weight_g / 1000).toFixed(1).replace(".", ",")} kg`,
    );
  return parts.join(" · ");
}

export function memberCountText(count: number): string {
  return `${count} người`;
}

export function snoozeValue(until: string | null, now: Date): string {
  if (!until || Date.parse(until) <= now.getTime()) return "Không";
  return `Đến ${formatVnTime(new Date(until))}`;
}

export function nightHoursText(schedule: NightSchedule): string {
  return `${schedule.start}–${schedule.end}`;
}
