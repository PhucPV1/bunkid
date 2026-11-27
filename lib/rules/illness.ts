import { addDays, vnDayStartMs } from "./days";
import type { LogLike } from "./describeLog";
import { detailsSchemas } from "./logDetails";
import { vnDateString } from "./time";
import { hasFever } from "./triage";

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

const HOUR_MS = 3_600_000;
// Spec §5.2: the window of the home page's fever banner (temperatureAlert).
const FRESH_MS = 6 * HOUR_MS;
const HIGH_FEVER = 39;
const LOW_TEMPERATURE = 35.5;

export type FeverKind = "unmeasured" | "fever" | "stale" | "cleared" | "none";

export type FeverStatus = {
  kind: FeverKind;
  // The newest reading of the episode.
  latest: Reading | null;
  // The newest reading from 38,0.
  lastFever: Reading | null;
  // The highest reading; of equal ones, the later.
  peak: Reading | null;
};

// Spec §5.2. For a closed episode `kind` is worked out the same way, but the
// verdict card does not use it.
export function feverStatus(
  logs: LogLike[],
  episode: EpisodeLike,
  now: Date,
): FeverStatus {
  const readings = episodeReadings(logs, episode, now);
  const latest = readings.at(-1) ?? null;
  if (!latest)
    return { kind: "unmeasured", latest: null, lastFever: null, peak: null };
  let lastFever: Reading | null = null;
  let peak = readings[0];
  for (const reading of readings) {
    if (hasFever(reading.celsius)) lastFever = reading;
    if (reading.celsius >= peak.celsius) peak = reading;
  }
  const kind: FeverKind = hasFever(latest.celsius)
    ? now.getTime() - latest.at <= FRESH_MS
      ? "fever"
      : "stale"
    : lastFever
      ? "cleared"
      : "none";
  return { kind, latest, lastFever, peak };
}

// Spec §5.2 {khoảng}: under an hour; whole hours up to 48; then whole days.
export function sinceText(ms: number): string {
  if (ms < HOUR_MS) return "chưa đầy 1 giờ";
  if (ms < 48 * HOUR_MS) return `${Math.floor(ms / HOUR_MS)} giờ`;
  return `${Math.floor(ms / DAY_MS)} ngày`;
}

export type EpisodeTone = "good" | "warn" | "danger" | "neutral";

// The tone of an open episode's state (verdict card, chip on the list).
export function statusTone(status: FeverStatus): EpisodeTone {
  const { kind, latest } = status;
  if (kind === "unmeasured" || !latest) return "neutral";
  if (kind === "fever") return latest.celsius >= HIGH_FEVER ? "danger" : "warn";
  if (kind === "stale") return "warn";
  // A body temperature this low has its own red banner on Hôm nay: no green.
  return latest.celsius < LOW_TEMPERATURE ? "neutral" : "good";
}

export type Verdict = {
  title: string;
  tone: EpisodeTone;
  icon: "thermo" | "clock" | "check";
};

// Spec §5.2: the heading of the verdict card.
export function episodeVerdict(input: {
  episode: EpisodeLike;
  status: FeverStatus;
  babyName: string;
  now: Date;
}): Verdict {
  const { episode, status, babyName, now } = input;
  if (episode.ended_at)
    return {
      title: `Đã khỏi sau ${episodeDayCount(episode, now)} ngày`,
      tone: "good",
      icon: "check",
    };
  const { kind, latest, lastFever } = status;
  const tone = statusTone(status);
  if (kind === "unmeasured" || !latest)
    return { title: "Chưa đo nhiệt độ", tone, icon: "thermo" };
  if (kind === "fever")
    return {
      title: `${babyName} đang sốt ${formatCelsius(latest.celsius)}°C`,
      tone,
      icon: "thermo",
    };
  if (kind === "stale")
    return {
      title: `Chưa đo lại sau ${formatCelsius(latest.celsius)}°C`,
      tone,
      icon: "clock",
    };
  return {
    title:
      kind === "cleared" && lastFever
        ? `${babyName} đã hết sốt ${sinceText(now.getTime() - lastFever.at)}`
        : `${babyName} không sốt`,
    tone,
    icon: tone === "good" ? "check" : "thermo",
  };
}

export type DayLabel = {
  text: "Sốt cao" | "Sốt" | "Hết sốt" | "Không sốt";
  tone: "danger" | "warn" | "good";
};

export type EpisodeDayRow = {
  // "2026-11-25", a Vietnam calendar day.
  day: string;
  // Its number in the episode, from 1.
  n: number;
  // The highest reading of the day; null without a reading.
  peak: number | null;
  // Doses of fever medicine that day.
  doses: number;
  // Codes of the day's symptom logs, each once, sorted by code.
  codes: string[];
  // Spec §5.3; null on a day without a reading.
  label: DayLabel | null;
};

// Spec §5.3 and §6.3 item 4: one row per calendar day from the first day to
// the last (an open episode: today), newest first. Only logs that belong to
// the episode count, so the first and last day may be partial days.
export function episodeDays(
  logs: LogLike[],
  episode: EpisodeLike,
  now: Date,
): EpisodeDayRow[] {
  const dayOf = (ms: number) => vnDateString(new Date(ms));
  const firstDay = dayOf(Date.parse(episode.started_at));
  const count = episodeDayCount(episode, now);
  const readings = episodeReadings(logs, episode, now);
  const doses = antipyreticTimes(logs, episode, now);
  const symptoms = symptomEntries(logs, episode, now);
  const rows: EpisodeDayRow[] = [];
  let feverBefore = false;
  for (let index = 0; index < count; index += 1) {
    const day = addDays(firstDay, index);
    const temperatures = readings
      .filter((reading) => dayOf(reading.at) === day)
      .map((reading) => reading.celsius);
    const peak = temperatures.length > 0 ? Math.max(...temperatures) : null;
    let label: DayLabel | null = null;
    if (peak !== null) {
      if (peak >= HIGH_FEVER) label = { text: "Sốt cao", tone: "danger" };
      else if (hasFever(peak)) label = { text: "Sốt", tone: "warn" };
      else
        label = { text: feverBefore ? "Hết sốt" : "Không sốt", tone: "good" };
    }
    rows.push({
      day,
      n: index + 1,
      peak,
      doses: doses.filter((time) => dayOf(time) === day).length,
      codes: [
        ...new Set(
          symptoms
            .filter((entry) => dayOf(entry.at) === day)
            .flatMap((entry) => entry.codes),
        ),
      ].sort(),
      label,
    });
    if (hasFever(peak)) feverBefore = true;
  }
  return rows.reverse();
}
