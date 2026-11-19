import type { LogLike } from "./describeLog";
import { detailsSchemas } from "./logDetails";
import { WINDOW_MS } from "./ratings";
import { shortDuration } from "./summaryText";
import { formatDuration, formatVnTime } from "./time";

const MINUTE_MS = 60_000;
const STALE_MS = 12 * 3_600_000;
const ms = (iso: string) => Date.parse(iso);

function latestBy(
  logs: LogLike[],
  key: (log: LogLike) => number,
): LogLike | null {
  let best: LogLike | null = null;
  for (const log of logs) if (!best || key(log) > key(best)) best = log;
  return best;
}

// When the next feed is expected: last feed start (breast or bottle) plus the interval.
// null when there is no feed in the last 12 hours.
export function feedDue(
  logs: LogLike[],
  feedIntervalMin: number,
  now: Date,
): Date | null {
  const feeds = logs.filter((l) => l.type === "breast" || l.type === "bottle");
  const last = latestBy(feeds, (l) => ms(l.started_at));
  if (!last || now.getTime() - ms(last.started_at) > STALE_MS) return null;
  return new Date(ms(last.started_at) + feedIntervalMin * 60_000);
}

function feedLine(
  logs: LogLike[],
  feedIntervalMin: number,
  now: Date,
): string | null {
  if (logs.some((l) => l.type === "breast" && l.ended_at === null))
    return "Đang bú";
  const due = feedDue(logs, feedIntervalMin, now);
  if (!due) return null;
  return now.getTime() >= due.getTime()
    ? `Đã đến giờ bú (từ ${formatVnTime(due)})`
    : `Cữ bú tiếp theo khoảng ${formatVnTime(due)}`;
}

export function sleepStatusLine(logs: LogLike[], now: Date): string | null {
  const sleeps = logs.filter((l) => l.type === "sleep");
  const running = sleeps.find((l) => l.ended_at === null);
  if (running)
    return `Bé đang ngủ ${formatDuration(now.getTime() - ms(running.started_at))}`;
  const last = latestBy(sleeps, (l) => ms(l.ended_at as string));
  if (!last || now.getTime() - ms(last.ended_at as string) > STALE_MS)
    return null;
  return `Bé đã thức ${formatDuration(now.getTime() - ms(last.ended_at as string))}`;
}

export function homeStatusLines(input: {
  logs: LogLike[];
  feedIntervalMin: number;
  now: Date;
}): string[] {
  const { logs, feedIntervalMin, now } = input;
  return [
    feedLine(logs, feedIntervalMin, now),
    sleepStatusLine(logs, now),
  ].filter((line): line is string => line !== null);
}

export type StatusTile = {
  label: string;
  value: string;
  note: string;
  tone: "good" | "warn" | "muted";
};

function blankTile(label: string, note: string): StatusTile {
  return { label, value: "—", note, tone: "muted" };
}

function nextFeedTile(
  logs: LogLike[],
  feedIntervalMin: number,
  now: Date,
): StatusTile {
  const label = "Cữ bú tiếp";
  const feeding = latestBy(
    logs.filter((l) => l.type === "breast" && l.ended_at === null),
    (l) => ms(l.started_at),
  );
  if (feeding)
    return {
      label,
      value: "Đang bú",
      note: `từ ${formatVnTime(new Date(feeding.started_at))}`,
      tone: "muted",
    };
  const due = feedDue(logs, feedIntervalMin, now);
  if (!due) return blankTile(label, "chưa ghi");
  // Rounded like heroState, so the hero card and this tile agree.
  const late = now.getTime() - due.getTime();
  return late >= 0
    ? {
        label,
        value: formatVnTime(due),
        note: `trễ ${shortDuration(Math.floor(late / MINUTE_MS))}`,
        tone: "warn",
      }
    : {
        label,
        value: formatVnTime(due),
        note: `còn ${shortDuration(Math.ceil(-late / MINUTE_MS))}`,
        tone: "good",
      };
}

// The note of a feed, or null for another type or details that are not valid.
function feedNote(log: LogLike): string | null {
  if (log.type === "bottle") {
    const bottle = detailsSchemas.bottle.safeParse(log.details);
    return bottle.success ? `bình · ${bottle.data.ml} ml` : null;
  }
  if (log.type !== "breast") return null;
  const breast = detailsSchemas.breast.safeParse(log.details);
  if (!breast.success) return null;
  const side = breast.data.side === "left" ? "trái" : "phải";
  if (log.ended_at === null) return `đang bú ${side}`;
  // Whole minutes, the way describeLog counts them for the same record.
  const minutes = Math.floor(
    (ms(log.ended_at) - ms(log.started_at)) / MINUTE_MS,
  );
  return `${side} · ${shortDuration(minutes)}`;
}

function diaperNote(log: LogLike): string | null {
  if (log.type !== "diaper") return null;
  const diaper = detailsSchemas.diaper.safeParse(log.details);
  if (!diaper.success) return null;
  return [diaper.data.wet && "ướt", diaper.data.dirty && "bẩn"]
    .filter(Boolean)
    .join(" + ");
}

// The record that started last among those `noteOf` describes. Only the last
// 24 hours count; older records leave the tile blank with "hơn 24 giờ".
function lastTile(
  label: string,
  logs: LogLike[],
  now: Date,
  noteOf: (log: LogLike) => string | null,
): StatusTile {
  let last: { at: number; note: string } | null = null;
  for (const log of logs) {
    const note = noteOf(log);
    const at = ms(log.started_at);
    if (note !== null && (!last || at > last.at)) last = { at, note };
  }
  if (!last) return blankTile(label, "chưa ghi");
  if (now.getTime() - last.at > WINDOW_MS)
    return blankTile(label, "hơn 24 giờ");
  return {
    label,
    value: formatVnTime(new Date(last.at)),
    note: last.note,
    tone: "muted",
  };
}

// Spec 2026-11-19 §3.3: the three tiles under the hero card, in this order.
export function statusTiles(input: {
  logs: LogLike[];
  feedIntervalMin: number;
  now: Date;
}): StatusTile[] {
  const { logs, feedIntervalMin, now } = input;
  return [
    nextFeedTile(logs, feedIntervalMin, now),
    lastTile("Bú gần nhất", logs, now, feedNote),
    lastTile("Tã gần nhất", logs, now, diaperNote),
  ];
}
