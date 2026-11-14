import { addDays, vnDayStartMs } from "./days";
import type { LogLike } from "./describeLog";
import { detailsSchemas } from "./logDetails";
import { groupFeedSessions } from "./ratings";
import { vnDateString } from "./time";

export type DayStat = {
  day: string;
  sleepMinutes: number;
  feeds: number;
  bottleMl: number;
  wetDiapers: number;
  dirtyDiapers: number;
  pumpMl: number;
  tummyMinutes: number;
};

export type StatsTab = "sleep" | "feed" | "diaper" | "pump" | "tummy";

export const STATS_TABS: { value: StatsTab; label: string }[] = [
  { value: "sleep", label: "Ngủ" },
  { value: "feed", label: "Bú" },
  { value: "diaper", label: "Tã" },
  { value: "pump", label: "Hút sữa" },
  { value: "tummy", label: "Tummy" },
];

function minutesBetween(
  type: "sleep" | "tummy",
  logs: LogLike[],
  from: number,
  to: number,
  now: Date,
): number {
  let total = 0;
  for (const log of logs) {
    if (log.type !== type) continue;
    const start = Math.max(Date.parse(log.started_at), from);
    const end = Math.min(
      log.ended_at ? Date.parse(log.ended_at) : now.getTime(),
      to,
    );
    if (end > start) total += end - start;
  }
  return Math.round(total / 60_000);
}

export function dailyStats(
  logs: LogLike[],
  days: string[],
  now: Date,
): DayStat[] {
  const result: DayStat[] = days.map((day) => {
    const from = vnDayStartMs(day);
    const to = Math.min(vnDayStartMs(addDays(day, 1)), now.getTime());
    return {
      day,
      sleepMinutes: minutesBetween("sleep", logs, from, to, now),
      feeds: 0,
      bottleMl: 0,
      wetDiapers: 0,
      dirtyDiapers: 0,
      pumpMl: 0,
      // Spec §6.13: tummy minutes per day, split at midnight like sleep.
      tummyMinutes: minutesBetween("tummy", logs, from, to, now),
    };
  });
  const byDay = new Map(result.map((stat) => [stat.day, stat]));
  for (const session of groupFeedSessions(logs, now)) {
    const stat = byDay.get(vnDateString(new Date(session.start)));
    if (stat) stat.feeds += 1;
  }
  for (const log of logs) {
    const stat = byDay.get(vnDateString(new Date(log.started_at)));
    if (!stat) continue;
    if (log.type === "bottle") {
      const p = detailsSchemas.bottle.safeParse(log.details);
      if (p.success) stat.bottleMl += p.data.ml;
    }
    if (log.type === "diaper") {
      const p = detailsSchemas.diaper.safeParse(log.details);
      if (p.success && p.data.wet) stat.wetDiapers += 1;
      if (p.success && p.data.dirty) stat.dirtyDiapers += 1;
    }
    if (log.type === "pump") {
      const p = detailsSchemas.pump.safeParse(log.details);
      if (p.success)
        stat.pumpMl += (p.data.mlLeft ?? 0) + (p.data.mlRight ?? 0);
    }
  }
  return result;
}

export function statsFetchSince(days: string[]): string {
  return new Date(vnDayStartMs(days[0]) - 86_400_000).toISOString();
}

export function sleepHours(minutes: number): number {
  return Math.round(minutes / 6) / 10;
}

export function chartRows(
  stats: DayStat[],
  tab: StatsTab,
): { label: string; primary: number; secondary: number | null }[] {
  return stats.map((stat) => ({
    label: String(Number(stat.day.slice(8))),
    primary:
      tab === "sleep"
        ? sleepHours(stat.sleepMinutes)
        : tab === "feed"
          ? stat.feeds
          : tab === "pump"
            ? stat.pumpMl
            : tab === "tummy"
              ? stat.tummyMinutes
              : stat.wetDiapers,
    secondary: tab === "diaper" ? stat.dirtyDiapers : null,
  }));
}
