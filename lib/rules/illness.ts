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
const hit = (a: Box, b: Box) =>
  a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
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

  // The highest reading keeps its label above the dot.
  const peakPoint = points.find(
    (point) => point.at === peak?.at && !point.latest,
  );
  if (peak && peakPoint && peak !== latest) {
    peakPoint.label = {
      text: formatCelsius(peak.celsius),
      anchor: anchorOf(peakPoint.x),
      place: "above",
    };
    boxes.push(labelBox(peakPoint.x, peakPoint.y, peakPoint.label));
  }
  // The newest label takes the first place that covers no other dot and not
  // the highest reading's label: above, beside on the right, under, beside on
  // the left. Nothing is ever drawn to the right of the newest dot, so that
  // side is free whenever it fits; near the right edge it does not fit, and
  // the left side is the last try (the line runs behind the label there, and
  // the halo keeps it readable).
  const newest = points.at(-1);
  if (newest) {
    const others = boxes.filter((_, index) => index !== points.length - 1);
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
    newest.label =
      options.find((option) => {
        const box = labelBox(newest.x, newest.y, option);
        return !others.some((other) => hit(box, other));
      }) ?? options[0];
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
    feverY: yOf(38),
    feverWord,
    points,
    doses,
    ariaLabel,
  };
}
