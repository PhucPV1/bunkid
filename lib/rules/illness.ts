import { bannerReading } from "./alerts";
import { dailyStats } from "./dailyStats";
import { addDays, formatDayShort, vnDayStartMs } from "./days";
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

// Spec §5.4: one day of the episode against the baby's usual days.
export type UsualKey = "feeds" | "wetDiapers" | "sleepMinutes";
export type UsualVerdict = "less" | "usual" | "more";
export type UsualRow = {
  key: UsualKey;
  // The day compared: feeds, wet diapers, or minutes of sleep.
  value: number;
  // The average of the days before the episode, not rounded.
  base: number;
  verdict: UsualVerdict;
};
export type UsualComparison =
  | { kind: "no-day" }
  | { kind: "no-base" }
  | { kind: "rows"; day: string; rows: UsualRow[] };

const USUAL_KEYS: UsualKey[] = ["feeds", "wetDiapers", "sleepMinutes"];
const BASE_DAYS = 7;
const BASE_MIN_DAYS = 3;
// A day counts towards the usual only when something of the routine was
// logged that day.
const ROUTINE = new Set(["breast", "bottle", "sleep", "diaper"]);

// Spec §5.4: the day compared is yesterday for an open episode and the day
// before the last day for a closed one; it may not be before the first day.
// The usual is the average of the 7 calendar days before the first day,
// counting only the days with a feed, a sleep or a diaper (at least 3).
// `logs` must reach back to the 8th day before the first day (detailRange),
// so a sleep from the evening before still counts. A measure that is 0 on
// average has no row; with no row left there is nothing to compare.
// Every value is a whole number and the average is a sum over a count, so the
// thresholds 0.75 and 1.25 are checked on whole numbers, exactly.
export function usualComparison(
  logs: LogLike[],
  episode: EpisodeLike,
  now: Date,
): UsualComparison {
  const firstDay = vnDateString(new Date(episode.started_at));
  const lastDay = vnDateString(
    episode.ended_at ? new Date(episode.ended_at) : now,
  );
  const day = addDays(lastDay, -1);
  if (day < firstDay) return { kind: "no-day" };
  const logged = new Set(
    logs
      .filter((log) => ROUTINE.has(log.type))
      .map((log) => vnDateString(new Date(log.started_at))),
  );
  const baseDays = Array.from({ length: BASE_DAYS }, (_, i) =>
    addDays(firstDay, i - BASE_DAYS),
  ).filter((baseDay) => logged.has(baseDay));
  if (baseDays.length < BASE_MIN_DAYS) return { kind: "no-base" };
  const [target, ...base] = dailyStats(logs, [day, ...baseDays], now);
  const count = base.length;
  const rows = USUAL_KEYS.flatMap((key): UsualRow[] => {
    const sum = base.reduce((total, stat) => total + stat[key], 0);
    if (sum === 0) return [];
    const value = target[key];
    // value / (sum / count) <= 0.75, and >= 1.25 for sleep.
    const verdict: UsualVerdict =
      value * count * 4 <= sum * 3
        ? "less"
        : key === "sleepMinutes" && value * count * 4 >= sum * 5
          ? "more"
          : "usual";
    return [{ key, value, base: sum / count, verdict }];
  });
  return rows.length > 0 ? { kind: "rows", day, rows } : { kind: "no-base" };
}

const MINUTE_MS = 60_000;
const OVERLAP = "Trùng thời gian với một đợt ốm khác.";

export type EpisodeErrors = { started_at?: string; ended_at?: string };

const startOf = (episode: { started_at: string }) =>
  Date.parse(episode.started_at);
const endOf = (episode: { ended_at: string | null }) =>
  episode.ended_at === null ? Infinity : Date.parse(episode.ended_at);

// Spec §5.7: the checks before an episode is saved, one sentence per field.
// `episodes` is every episode of the baby (useEpisodes); `id` is the episode
// being changed, or null for a new one. An empty result means it may be saved.
// Two ranges [start, end) overlap unless one starts where the other ends,
// like the constraint on the server, which still has the last word.
export function checkEpisode(input: {
  id: string | null;
  started_at: string;
  ended_at: string | null;
  episodes: EpisodeLike[];
  now: Date;
}): EpisodeErrors {
  const { id, episodes } = input;
  const start = startOf(input);
  const end = endOf(input);
  const limit = input.now.getTime() + MINUTE_MS;
  const errors: EpisodeErrors = {};
  if (start > limit) errors.started_at = "Giờ bắt đầu ở tương lai.";
  if (end <= start) errors.ended_at = "Giờ kết thúc phải sau giờ bắt đầu.";
  else if (end !== Infinity && end > limit)
    errors.ended_at = "Giờ kết thúc ở tương lai.";
  for (const other of episodes) {
    if (other.id === id) continue;
    const otherStart = startOf(other);
    const otherEnd = endOf(other);
    if (!(start < otherEnd && otherStart < end)) continue;
    // Under the start when the start itself falls inside the other episode,
    // and always for an open episode, which has no end field.
    if (end === Infinity || (start >= otherStart && start < otherEnd))
      errors.started_at ??= OVERLAP;
    else errors.ended_at ??= OVERLAP;
  }
  return errors;
}

// The sentence for a toast, for the one-tap actions that have no field.
export function episodeError(errors: EpisodeErrors): string | null {
  return errors.started_at ?? errors.ended_at ?? null;
}

// Spec §6.4: "Mở lại đợt ốm" is offered for a closed episode, while the baby
// has no open one, and only for the episode with the latest start.
export function canReopen(
  episode: EpisodeLike,
  episodes: EpisodeLike[],
): boolean {
  if (episode.ended_at === null) return false;
  if (episodes.some((other) => other.ended_at === null)) return false;
  return episodes.every((other) => startOf(other) <= startOf(episode));
}

const CHART_DAYS = 7;

// The chart's geometry, in fractions of the plot (about 288 × 128 px at
// 375 px wide), so the model can keep the texts apart.
type Box = { x0: number; x1: number; y0: number; y1: number };
// How much of each other two boxes cover; 0 when they are apart.
const covered = (a: Box, b: Box) =>
  Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) *
  Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
const hit = (a: Box, b: Box) => covered(a, b) > 0;
// A dot, with a little air round it.
const DOT_X = 0.025;
const DOT_Y = 0.055;
// A value label such as "38,6", halo included.
const LABEL_W = 0.11;
// A label nearer than this to the left or right edge is anchored inwards.
const LABEL_EDGE = 0.1;
// The newest label may sit beside its dot up to here, under it from here up.
const SIDE_MAX_X = 0.85;
const BELOW_MIN_Y = 0.2;
// The word "Sốt" in the top band of the plot: right, left, then middle.
const WORD_Y0 = 0.87;
const WORD_BOXES: { at: "start" | "middle" | "end"; x0: number; x1: number }[] =
  [
    { at: "end", x0: 0.9, x1: 1 },
    { at: "start", x0: 0, x1: 0.1 },
    { at: "middle", x0: 0.45, x1: 0.55 },
  ];

export type FeverChartLabel = {
  // "38,6", without the unit.
  text: string;
  // Which end of the text sits on the point, so it stays inside the plot.
  anchor: "start" | "middle" | "end";
  // Above the dot; or, where that would cover another dot or label, beside
  // it or under it. Beside is to the right with anchor "start" and to the
  // left with anchor "end".
  place: "above" | "side" | "below";
};

export type FeverChartPoint = {
  at: number;
  celsius: number;
  // 0 = left edge of the plot, 1 = right edge.
  x: number;
  // 0 = lowest degree of the scale, 1 = highest.
  y: number;
  latest: boolean;
  label: FeverChartLabel | null;
};

export type FeverChart = {
  // The episode is longer than 7 days: only its last 7 are drawn.
  truncated: boolean;
  // One per day; x is the middle of the day.
  days: { day: string; label: string; x: number }[];
  // The day borders inside the plot.
  dividers: number[];
  // One per whole degree, lowest first.
  ticks: { celsius: number; y: number }[];
  // Where 38,0 sits on the scale.
  feverY: number;
  // Where in the top band of the fever zone the word "Sốt" sits: the first
  // of right, left, middle that no dot and no label reaches.
  feverWord: "start" | "middle" | "end";
  // Oldest first.
  points: FeverChartPoint[];
  doses: { at: number; x: number }[];
  ariaLabel: string;
};

const dotBox = (x: number, y: number): Box => ({
  x0: x - DOT_X,
  x1: x + DOT_X,
  y0: y - DOT_Y,
  y1: y + DOT_Y,
});

function labelBox(x: number, y: number, label: FeverChartLabel): Box {
  if (label.place === "side") {
    const left = label.anchor === "end" ? x - 0.035 - LABEL_W : x + 0.035;
    return { x0: left, x1: left + LABEL_W, y0: y - 0.06, y1: y + 0.06 };
  }
  const x0 =
    label.anchor === "start"
      ? x - 0.01
      : label.anchor === "end"
        ? x + 0.01 - LABEL_W
        : x - LABEL_W / 2;
  return label.place === "above"
    ? { x0, x1: x0 + LABEL_W, y0: y + 0.07, y1: y + 0.21 }
    : { x0, x1: x0 + LABEL_W, y0: y - 0.19, y1: y - 0.06 };
}

// Spec §6.5: everything the fever chart draws, as fractions of the plot; the
// component only turns them into pixels. null when the episode has no reading
// at all (the card then says so).
export function feverChartModel(
  logs: LogLike[],
  episode: EpisodeLike,
  now: Date,
): FeverChart | null {
  const readings = episodeReadings(logs, episode, now);
  if (readings.length === 0) return null;

  const today = vnDateString(now);
  const count = episodeDayCount(episode, now);
  const shown = Math.min(count, CHART_DAYS);
  const lastDay = addDays(
    vnDateString(new Date(episode.started_at)),
    count - 1,
  );
  const firstDay = addDays(lastDay, 1 - shown);
  const from = vnDayStartMs(firstDay);
  const span = shown * DAY_MS;
  const xOf = (at: number) => (at - from) / span;
  const inWindow = (at: number) => at >= from && at < from + span;

  const drawn = readings.filter((reading) => inWindow(reading.at));
  const degrees = drawn.map((reading) => reading.celsius);
  const yMin = Math.min(36, Math.floor(Math.min(...degrees, 36)));
  const yMax = Math.max(40, Math.ceil(Math.max(...degrees, 40)));
  const yOf = (celsius: number) => (celsius - yMin) / (yMax - yMin);

  const latest = drawn.at(-1) ?? null;
  let peak: Reading | null = null;
  for (const reading of drawn)
    if (hasFever(reading.celsius) && (!peak || reading.celsius >= peak.celsius))
      peak = reading;

  const points = drawn.map((reading): FeverChartPoint => ({
    at: reading.at,
    celsius: reading.celsius,
    x: xOf(reading.at),
    y: yOf(reading.celsius),
    latest: reading === latest,
    label: null,
  }));
  const anchorOf = (x: number) =>
    x < LABEL_EDGE ? "start" : x > 1 - LABEL_EDGE ? "end" : "middle";
  const boxes: Box[] = points.map((point) => dotBox(point.x, point.y));

  // The highest reading keeps its label above the dot. Its point is found by
  // position, not by time: two readings may carry the same minute.
  const peakPoint = peak ? points[drawn.indexOf(peak)] : undefined;
  let peakLabel: Box | null = null;
  if (peak && peakPoint && peak !== latest) {
    peakPoint.label = {
      text: formatCelsius(peak.celsius),
      anchor: anchorOf(peakPoint.x),
      place: "above",
    };
    peakLabel = labelBox(peakPoint.x, peakPoint.y, peakPoint.label);
    boxes.push(peakLabel);
  }
  // The newest label takes the first place that covers no other dot, not the
  // highest reading's label and not the 38 line: above, beside on the right,
  // under, beside on the left. Nothing is ever drawn to the right of the
  // newest dot, so that side is free whenever it fits; near the right edge it
  // does not fit, and the left side is the last try (the line runs behind the
  // label there, and the halo keeps it readable). Where no place is free
  // (readings a few pixels apart, as on a week's axis), it takes the place
  // that covers least of the other dots, and never one that reaches the other
  // label or sits on the 38 line while another place does neither: two
  // numbers on each other cannot be read, and a dash of the line showing
  // behind a number reads as part of it; a dot partly under a number can be
  // read. For one dot the three heights never sit on the line together.
  const newest = points.at(-1);
  const feverY = yOf(38);
  if (newest) {
    const dots = boxes.slice(0, points.length - 1);
    const text = formatCelsius(newest.celsius);
    const options: FeverChartLabel[] = [
      { text, anchor: anchorOf(newest.x), place: "above" },
      ...(newest.x <= SIDE_MAX_X
        ? [{ text, anchor: "start", place: "side" } as const]
        : []),
      ...(newest.y >= BELOW_MIN_Y
        ? [{ text, anchor: anchorOf(newest.x), place: "below" } as const]
        : []),
      ...(newest.x > SIDE_MAX_X
        ? [{ text, anchor: "end", place: "side" } as const]
        : []),
    ];
    const placed = options.map((option) => {
      const box = labelBox(newest.x, newest.y, option);
      return {
        option,
        onLabel: peakLabel !== null && hit(box, peakLabel),
        onLine: box.y0 < feverY && feverY < box.y1,
        onDots: dots.reduce((sum, dot) => sum + covered(box, dot), 0),
      };
    });
    // Above or under always clears the other label: that label is above the
    // highest dot, and the newest dot is never higher than it.
    const offLabel = placed.filter((place) => !place.onLabel);
    const clear = offLabel.length > 0 ? offLabel : placed;
    const offLine = clear.filter((place) => !place.onLine);
    newest.label = (offLine.length > 0 ? offLine : clear).reduce(
      (best, place) => (place.onDots < best.onDots ? place : best),
    ).option;
    boxes.push(labelBox(newest.x, newest.y, newest.label));
  }
  const feverWord =
    WORD_BOXES.find(
      (word) =>
        !boxes.some((box) => hit(box, { ...word, y0: WORD_Y0, y1: 1.05 })),
    )?.at ?? "end";

  const doses = antipyreticTimes(logs, episode, now)
    .filter(inWindow)
    .map((at) => ({ at, x: xOf(at) }));

  const highest = degrees.length > 0 ? Math.max(...degrees) : null;
  const ariaLabel = [
    `Biểu đồ nhiệt độ${count > CHART_DAYS ? ", 7 ngày gần nhất" : ""}: ${drawn.length} lần đo`,
    ...(highest === null ? [] : [`cao nhất ${formatCelsius(highest)}°C`]),
    `${doses.length} liều hạ sốt.`,
  ].join(", ");

  return {
    truncated: count > CHART_DAYS,
    days: Array.from({ length: shown }, (_, index) => {
      const day = addDays(firstDay, index);
      return {
        day,
        label: day === today ? "Hôm nay" : formatDayShort(day),
        x: (index + 0.5) / shown,
      };
    }),
    dividers: Array.from(
      { length: shown - 1 },
      (_, index) => (index + 1) / shown,
    ),
    ticks: Array.from({ length: yMax - yMin + 1 }, (_, index) => ({
      celsius: yMin + index,
      y: index / (yMax - yMin),
    })),
    feverY,
    feverWord,
    points,
    doses,
    ariaLabel,
  };
}

// Spec §5.5: the fever banners of the home page that carry the invite.
const INVITE_ALERTS = ["fever", "fever-infant", "fever-high"];
// A "not now" on this device holds for a day.
const REST_MS = 24 * HOUR_MS;
const LOOK_BACK_MS = 48 * HOUR_MS;

// Is a "not now" given at `at` still in force? The tap is stamped with the
// real time, which can be a moment after the page's clock, so a stamp a little
// ahead of `now` holds too; one a day or more ahead (the clock was wrong when
// it was written) does not.
function resting(at: number | null, now: Date): boolean {
  return at !== null && Math.abs(now.getTime() - at) < REST_MS;
}

// The latest end among the baby's episodes; -Infinity when none has ended.
function latestEnd(episodes: EpisodeLike[]): number {
  let latest = -Infinity;
  for (const episode of episodes)
    if (episode.ended_at)
      latest = Math.max(latest, Date.parse(episode.ended_at));
  return latest;
}

// Spec §5.5: the invite to start an episode. It shows when the baby has no
// open episode, the home page has a fever banner, the reading behind that
// banner was taken after the latest end of the baby's episodes (so the invite
// does not come straight back after "Bé đã khỏi"), and "Không" was not
// answered on this device in the last 24 hours. Returns the key of the banner
// that carries the invite, or null.
//   episodes     every episode of the baby (useEpisodes)
//   alerts       what homeAlerts returned for the same logs and the same now
//   logs         the recent logs (useRecentLogs)
//   dismissedAt  when "Không" was last answered on this device, in ms; or null
export function inviteAlert(input: {
  episodes: EpisodeLike[];
  alerts: { key: string }[];
  logs: LogLike[];
  dismissedAt: number | null;
  now: Date;
}): string | null {
  const { episodes, alerts, logs, dismissedAt, now } = input;
  if (episodes.some((episode) => episode.ended_at === null)) return null;
  const alert = alerts.find((item) => INVITE_ALERTS.includes(item.key));
  if (!alert) return null;
  const reading = bannerReading(logs, now);
  if (!reading || reading.at <= latestEnd(episodes)) return null;
  if (resting(dismissedAt, now)) return null;
  return alert.key;
}

// Spec §5.5 "Bắt đầu đợt ốm": the new episode starts at the earliest reading
// from 38,0 of the last 48 hours, counting only readings after the latest end
// of the baby's episodes; without such a reading it starts now.
export function inviteStartedAt(
  logs: LogLike[],
  episodes: EpisodeLike[],
  now: Date,
): string {
  const after = Math.max(latestEnd(episodes), now.getTime() - LOOK_BACK_MS - 1);
  let earliest = now.getTime();
  for (const log of logs) {
    if (log.type !== "temperature") continue;
    const at = Date.parse(log.started_at);
    if (at <= after || at >= earliest) continue;
    const parsed = detailsSchemas.temperature.safeParse(log.details);
    if (parsed.success && hasFever(parsed.data.celsius)) earliest = at;
  }
  return new Date(earliest).toISOString();
}

// Spec §5.6: an open episode with nothing new for this long may be over.
const CLOSE_AFTER_MS = 48 * HOUR_MS;

export type CloseCase = "no-fever" | "unchecked" | "quiet";

// Spec §5.6: the reminder to close an open episode. Each case has its own
// last mark; the reminder shows once that mark is 48 hours old, unless
// "Chưa" was answered on this device in the last 24 hours.
//   no-fever   the fever is over (cleared): the last reading from 38,0
//   unchecked  the newest reading is still from 38,0: that reading
//   quiet      no fever on record: the latest of the start, the last symptom
//              log and the last dose of fever medicine
// So it never says the fever is over while the newest reading is a fever.
//   logs       the logs of the episode (useRangeLogs)
//   snoozedAt  when "Chưa" was last answered on this device, in ms; or null
export function closeReminder(input: {
  episode: EpisodeLike;
  logs: LogLike[];
  snoozedAt: number | null;
  now: Date;
}): CloseCase | null {
  const { episode, logs, snoozedAt, now } = input;
  if (episode.ended_at !== null) return null;
  const { kind, latest, lastFever } = feverStatus(logs, episode, now);
  let result: CloseCase;
  let mark: number;
  if (kind === "cleared" && lastFever) {
    result = "no-fever";
    mark = lastFever.at;
  } else if ((kind === "fever" || kind === "stale") && latest) {
    result = "unchecked";
    mark = latest.at;
  } else {
    result = "quiet";
    mark = Math.max(
      Date.parse(episode.started_at),
      symptomEntries(logs, episode, now).at(-1)?.at ?? -Infinity,
      antipyreticTimes(logs, episode, now).at(-1) ?? -Infinity,
    );
  }
  if (now.getTime() - mark < CLOSE_AFTER_MS) return null;
  return resting(snoozedAt, now) ? null : result;
}
