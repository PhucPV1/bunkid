import type { ThemeName } from "@/lib/ui/tokens";

export type ThemePref = "light" | "dark" | "system";
export type NightSchedule = { enabled: boolean; start: string; end: string };
export type NightOverride = { on: boolean; until: string } | null;

// Spec §3.1: which theme "light" means. Anything unknown is Hồng dịu.
export type LightStyle = "white" | "rose" | "peach" | "lavender" | "sea";

const LIGHT_STYLES: readonly LightStyle[] = [
  "white",
  "rose",
  "peach",
  "lavender",
  "sea",
];

export function parseLightStyle(raw: string | null): LightStyle {
  return LIGHT_STYLES.find((style) => style === raw) ?? "rose";
}

export const DEFAULT_NIGHT_SCHEDULE: NightSchedule = {
  enabled: true,
  start: "21:00",
  end: "06:00",
};

const HM = /^([01]\d|2[0-3]):(00|30)$/;
const MINUTE = 60_000;
const DAY_MINUTES = 1440;
const VN_OFFSET_MINUTES = 7 * 60;

export const HALF_HOURS: string[] = Array.from(
  { length: 48 },
  (_, i) =>
    `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`,
);

export function vnMinuteOfDay(now: Date): number {
  const minutes = Math.floor(now.getTime() / MINUTE) + VN_OFFSET_MINUTES;
  return ((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
}

export function parseHm(hm: string): number {
  return Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5));
}

export function inNightWindow(now: Date, schedule: NightSchedule): boolean {
  if (!schedule.enabled) return false;
  const start = parseHm(schedule.start);
  const end = parseHm(schedule.end);
  if (start === end) return false;
  const m = vnMinuteOfDay(now);
  return start < end ? m >= start && m < end : m >= start || m < end;
}

export function nextNightBoundary(now: Date, schedule: NightSchedule): Date {
  const m = vnMinuteOfDay(now);
  const deltas = [parseHm(schedule.start), parseHm(schedule.end)].map(
    (target) => {
      const d = (target - m + DAY_MINUTES) % DAY_MINUTES;
      return d === 0 ? DAY_MINUTES : d;
    },
  );
  const minuteStart = Math.floor(now.getTime() / MINUTE);
  return new Date((minuteStart + Math.min(...deltas)) * MINUTE);
}

export function resolveActiveTheme(input: {
  pref: ThemePref;
  prefersDark: boolean;
  schedule: NightSchedule;
  override: NightOverride;
  lightStyle: LightStyle;
  now: Date;
}): ThemeName {
  const base: "light" | "dark" =
    input.pref === "system"
      ? input.prefersDark
        ? "dark"
        : "light"
      : input.pref;
  const day: ThemeName =
    base === "light" && input.lightStyle !== "white" ? input.lightStyle : base;
  const { override } = input;
  if (override && input.now.getTime() < Date.parse(override.until))
    return override.on ? "night" : day;
  return inNightWindow(input.now, input.schedule) ? "night" : day;
}

export function parseNightSchedule(raw: string | null): NightSchedule {
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    if (
      value !== null &&
      typeof value === "object" &&
      typeof (value as NightSchedule).enabled === "boolean" &&
      typeof (value as NightSchedule).start === "string" &&
      typeof (value as NightSchedule).end === "string" &&
      HM.test((value as NightSchedule).start) &&
      HM.test((value as NightSchedule).end)
    ) {
      const { enabled, start, end } = value as NightSchedule;
      return { enabled, start, end };
    }
  } catch {
    // Fall through to the default.
  }
  return DEFAULT_NIGHT_SCHEDULE;
}

export function parseNightOverride(raw: string | null): NightOverride {
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    if (
      value !== null &&
      typeof value === "object" &&
      typeof (value as { on: unknown }).on === "boolean" &&
      typeof (value as { until: unknown }).until === "string" &&
      !Number.isNaN(Date.parse((value as { until: string }).until))
    ) {
      const { on, until } = value as { on: boolean; until: string };
      return { on, until };
    }
  } catch {
    // Fall through.
  }
  return null;
}

export function toggleNightOverride(
  current: ThemeName,
  schedule: NightSchedule,
  now: Date,
): { on: boolean; until: string } {
  const until = schedule.enabled
    ? nextNightBoundary(now, schedule)
    : new Date(
        Date.UTC(
          now.getUTCFullYear() + 100,
          now.getUTCMonth(),
          now.getUTCDate(),
        ),
      );
  return { on: current !== "night", until: until.toISOString() };
}
