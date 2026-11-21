import type { StatsTab } from "./dailyStats";
import type { LogLike } from "./describeLog";
import { detailsSchemas } from "./logDetails";
import { TIMER_LIMIT_MIN } from "./timer";

export type Rating = "green" | "yellow" | "red";
export type MetricResult =
  | { status: "rated"; rating: Rating; value: number; explain: string }
  | { status: "not-rated"; value: number }
  | { status: "no-data" };
export type DayRatings = {
  sleepMinutes: MetricResult;
  feeds: MetricResult;
  wetDiapers: MetricResult;
};

const HOUR_MS = 3_600_000;
export const WINDOW_MS = 24 * HOUR_MS;
const SAME_FEED_GAP_MS = 30 * 60_000;
// A breast timer still running after this long is taken as forgotten: it no
// longer merges later feeds into itself or holds back the feed reminder.
export const FORGOTTEN_BREAST_MS = TIMER_LIMIT_MIN.breast * 60_000;

const ms = (iso: string) => Date.parse(iso);
const endMs = (log: LogLike, now: Date) =>
  log.ended_at ? ms(log.ended_at) : now.getTime();
const isFeed = (log: LogLike) => log.type === "breast" || log.type === "bottle";

function startsInWindow(log: LogLike, now: Date): boolean {
  const start = ms(log.started_at);
  return start >= now.getTime() - WINDOW_MS && start <= now.getTime();
}

function overlapsWindow(log: LogLike, now: Date): boolean {
  return (
    endMs(log, now) >= now.getTime() - WINDOW_MS &&
    ms(log.started_at) <= now.getTime()
  );
}

export function groupFeedSessions(
  logs: LogLike[],
  now: Date,
): { start: number; end: number }[] {
  const feeds = logs
    .filter(isFeed)
    .sort((a, b) => ms(a.started_at) - ms(b.started_at));
  const sessions: { start: number; end: number }[] = [];
  for (const log of feeds) {
    const start = ms(log.started_at);
    // A timer nobody stopped must not stretch to "now" and absorb every later feed.
    const end = log.ended_at
      ? ms(log.ended_at)
      : Math.min(now.getTime(), start + FORGOTTEN_BREAST_MS);
    const last = sessions.at(-1);
    if (last && start <= last.end + SAME_FEED_GAP_MS)
      last.end = Math.max(last.end, end);
    else sessions.push({ start, end });
  }
  return sessions;
}

export function countFeedsInWindow(logs: LogLike[], now: Date): number {
  const from = now.getTime() - WINDOW_MS;
  return groupFeedSessions(logs, now).filter(
    (s) => s.start >= from && s.start <= now.getTime(),
  ).length;
}

export function sleepMinutesInWindow(logs: LogLike[], now: Date): number {
  const from = now.getTime() - WINDOW_MS;
  let total = 0;
  for (const log of logs) {
    if (log.type !== "sleep") continue;
    const start = Math.max(ms(log.started_at), from);
    const end = Math.min(endMs(log, now), now.getTime());
    if (end > start) total += end - start;
  }
  return Math.round(total / 60_000);
}

function diaperDetails(log: LogLike) {
  const parsed = detailsSchemas.diaper.safeParse(log.details);
  return parsed.success ? parsed.data : null;
}

export function wetDiapersInWindow(logs: LogLike[], now: Date): number {
  return logs.filter(
    (log) =>
      log.type === "diaper" &&
      startsInWindow(log, now) &&
      diaperDetails(log)?.wet === true,
  ).length;
}

export function windowTotals(
  logs: LogLike[],
  now: Date,
): { bottleMl: number; dirtyDiapers: number } {
  let bottleMl = 0;
  let dirtyDiapers = 0;
  for (const log of logs) {
    if (!startsInWindow(log, now)) continue;
    if (log.type === "bottle") {
      const parsed = detailsSchemas.bottle.safeParse(log.details);
      if (parsed.success) bottleMl += parsed.data.ml;
    }
    if (log.type === "diaper" && diaperDetails(log)?.dirty === true)
      dirtyDiapers += 1;
  }
  return { bottleMl, dirtyDiapers };
}

const SLEEP_BANDS = [
  { maxAge: 90, min: 14, max: 17 },
  { maxAge: 364, min: 12, max: 15 },
  { maxAge: 729, min: 11, max: 14 },
  { maxAge: Number.POSITIVE_INFINITY, min: 10, max: 13 },
];

function rateSleep(
  logs: LogLike[],
  ageDays: number,
  enoughHistory: boolean,
  now: Date,
): MetricResult {
  if (
    !enoughHistory ||
    !logs.some((l) => l.type === "sleep" && overlapsWindow(l, now))
  )
    return { status: "no-data" };
  const value = sleepMinutesInWindow(logs, now);
  const band =
    SLEEP_BANDS.find((b) => ageDays <= b.maxAge) ??
    SLEEP_BANDS[SLEEP_BANDS.length - 1];
  const range = `${band.min}–${band.max} giờ`;
  if (value < band.min * 60)
    return {
      status: "rated",
      rating: "yellow",
      value,
      explain: `Bé ngủ ít hơn chuẩn (${range})`,
    };
  if (value > band.max * 60)
    return {
      status: "rated",
      rating: "yellow",
      value,
      explain: `Bé ngủ nhiều hơn chuẩn (${range})`,
    };
  return {
    status: "rated",
    rating: "green",
    value,
    explain: `Bé ngủ đủ (chuẩn ${range})`,
  };
}

function rateFeeds(
  logs: LogLike[],
  ageDays: number,
  enoughHistory: boolean,
  now: Date,
): MetricResult {
  const value = countFeedsInWindow(logs, now);
  if (ageDays > 180) return { status: "not-rated", value };
  if (!enoughHistory || !logs.some((l) => isFeed(l) && overlapsWindow(l, now)))
    return { status: "no-data" };
  const min = ageDays <= 30 ? 8 : 6;
  if (value >= min)
    return {
      status: "rated",
      rating: "green",
      value,
      explain: `Đủ cữ bú (chuẩn từ ${min} cữ)`,
    };
  return {
    status: "rated",
    rating: "yellow",
    value,
    explain: `Ít cữ bú hơn chuẩn (từ ${min} cữ)`,
  };
}

function rateWet(
  logs: LogLike[],
  ageDays: number,
  enoughHistory: boolean,
  now: Date,
): MetricResult {
  const value = wetDiapersInWindow(logs, now);
  if (ageDays <= 5) return { status: "not-rated", value };
  if (
    !enoughHistory ||
    !logs.some((l) => l.type === "diaper" && startsInWindow(l, now))
  )
    return { status: "no-data" };
  if (value >= 6)
    return {
      status: "rated",
      rating: "green",
      value,
      explain: "Đủ tã ướt (chuẩn từ 6 tã)",
    };
  if (value >= 4)
    return {
      status: "rated",
      rating: "yellow",
      value,
      explain: "Hơi ít tã ướt (chuẩn từ 6 tã)",
    };
  return {
    status: "rated",
    rating: "red",
    value,
    explain: "Rất ít tã ướt: nguy cơ mất nước",
  };
}

export function rateLast24h(input: {
  logs: LogLike[];
  ageDays: number;
  firstLogAt: string | null;
  now: Date;
}): DayRatings {
  const { logs, ageDays, firstLogAt, now } = input;
  const enoughHistory =
    firstLogAt !== null && now.getTime() - ms(firstLogAt) >= WINDOW_MS;
  return {
    sleepMinutes: rateSleep(logs, ageDays, enoughHistory, now),
    feeds: rateFeeds(logs, ageDays, enoughHistory, now),
    wetDiapers: rateWet(logs, ageDays, enoughHistory, now),
  };
}

export type DailyNorm = { min: number; max?: number };

// Spec 2026-11-19 §8: the norm the Thống kê chart draws for one day, from the
// same thresholds as the ratings above. Sleep is in hours; feeds and wet
// diapers are counts.
export function dailyNorm(tab: StatsTab, ageDays: number): DailyNorm | null {
  if (tab === "sleep") {
    const band =
      SLEEP_BANDS.find((b) => ageDays <= b.maxAge) ??
      SLEEP_BANDS[SLEEP_BANDS.length - 1];
    return { min: band.min, max: band.max };
  }
  if (tab === "feed") {
    if (ageDays > 180) return null;
    return { min: ageDays <= 30 ? 8 : 6 };
  }
  if (tab === "diaper") return ageDays > 5 ? { min: 6 } : null;
  return null;
}
