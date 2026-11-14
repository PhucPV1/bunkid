import type { LogLike } from "./describeLog";
import { formatDuration, formatVnTime } from "./time";

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
