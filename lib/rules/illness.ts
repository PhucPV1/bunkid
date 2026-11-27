import { addDays, vnDayStartMs } from "./days";
import type { LogLike } from "./describeLog";
import { detailsSchemas } from "./logDetails";
import { vnDateString } from "./time";

const DAY_MS = 86_400_000;

// Spec 2026-11-26 §4–§6: an illness episode is a stretch of time. Logs belong
// to it by their time alone. Every rule here finds "newest", "last" and
// "earliest" by started_at: the array of logs may come in any order (§4.2),
// and it may hold logs from outside the episode.
export type EpisodeLike = {
  id: string;
  started_at: string;
  ended_at: string | null;
};

const dayNumber = (day: string) => Date.parse(`${day}T00:00:00Z`) / DAY_MS;

// Spec §5.1: day n = Vietnam calendar days from the day of started_at to the
// day of `at`, plus 1.
export function episodeDay(startedAt: string, at: Date): number {
  return (
    dayNumber(vnDateString(at)) -
    dayNumber(vnDateString(new Date(startedAt))) +
    1
  );
}

// The day an episode is on: today's for an open one; for a closed one the day
// of its end, which is also how many days it lasted.
export function episodeDayCount(episode: EpisodeLike, now: Date): number {
  return episodeDay(
    episode.started_at,
    episode.ended_at ? new Date(episode.ended_at) : now,
  );
}

// An open episode reaches a little past `now`. A screen's clock only moves
// once a minute, so a log saved a moment ago is dated after it; and the app
// itself lets a log be dated up to a minute ahead. Nothing can be logged
// further ahead than that.
const OPEN_SLACK_MS = 2 * 60_000;

const endMs = (episode: EpisodeLike, now: Date) =>
  episode.ended_at
    ? Date.parse(episode.ended_at)
    : now.getTime() + OPEN_SLACK_MS;

// Spec §4.3: a log belongs to the episode when it starts from the episode's
// start up to its end (an open episode: up to now, with the allowance
// above), both ends included.
export function belongsTo(
  episode: EpisodeLike,
  startedAt: string,
  now: Date,
): boolean {
  const at = Date.parse(startedAt);
  return at >= Date.parse(episode.started_at) && at <= endMs(episode, now);
}

export type Reading = { at: number; celsius: number };

// Spec §5.2: a reading is a temperature log that passes the schema and
// belongs to the episode. Oldest first; of two readings at the same moment
// the higher one sorts last, so it counts as the newer.
export function episodeReadings(
  logs: LogLike[],
  episode: EpisodeLike,
  now: Date,
): Reading[] {
  const readings: Reading[] = [];
  for (const log of logs) {
    if (log.type !== "temperature") continue;
    if (!belongsTo(episode, log.started_at, now)) continue;
    const parsed = detailsSchemas.temperature.safeParse(log.details);
    if (parsed.success)
      readings.push({
        at: Date.parse(log.started_at),
        celsius: parsed.data.celsius,
      });
  }
  return readings.sort((a, b) => a.at - b.at || a.celsius - b.celsius);
}

// Times of the fever medicine given during the episode, oldest first.
export function antipyreticTimes(
  logs: LogLike[],
  episode: EpisodeLike,
  now: Date,
): number[] {
  const times: number[] = [];
  for (const log of logs) {
    if (log.type !== "medicine") continue;
    if (!belongsTo(episode, log.started_at, now)) continue;
    const parsed = detailsSchemas.medicine.safeParse(log.details);
    if (parsed.success && parsed.data.antipyretic)
      times.push(Date.parse(log.started_at));
  }
  return times.sort((a, b) => a - b);
}

export type SymptomEntry = { at: number; codes: string[] };

// The symptom logs of the episode, oldest first.
export function symptomEntries(
  logs: LogLike[],
  episode: EpisodeLike,
  now: Date,
): SymptomEntry[] {
  const entries: SymptomEntry[] = [];
  for (const log of logs) {
    if (log.type !== "symptom") continue;
    if (!belongsTo(episode, log.started_at, now)) continue;
    const parsed = detailsSchemas.symptom.safeParse(log.details);
    if (parsed.success)
      entries.push({
        at: Date.parse(log.started_at),
        codes: parsed.data.codes,
      });
  }
  return entries.sort((a, b) => a.at - b.at);
}

const decimal = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

// "38,6": a comma and at most one decimal, like the doctor's report.
export function formatCelsius(celsius: number): string {
  return decimal.format(celsius);
}

const startOfDayIso = (day: string) =>
  new Date(vnDayStartMs(day)).toISOString();

// Spec §6.3: the logs the episode's page reads. From the start of the 8th day
// before the first day (seven days to compare with, and one more so a sleep
// that began the evening before still counts) to the start of the day after
// the last one; an open episode has no upper bound.
export function detailRange(episode: EpisodeLike): {
  from: string;
  to: string | null;
} {
  const firstDay = vnDateString(new Date(episode.started_at));
  return {
    from: startOfDayIso(addDays(firstDay, -8)),
    to: episode.ended_at
      ? startOfDayIso(addDays(vnDateString(new Date(episode.ended_at)), 1))
      : null,
  };
}
