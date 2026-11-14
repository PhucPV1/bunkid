import type { LogLike } from "./describeLog";
import { feedDue } from "./status";

export type HeroState<T extends LogLike> =
  | { kind: "running"; log: T }
  | { kind: "overdue"; due: Date; lateMinutes: number }
  | { kind: "next"; due: Date; minutesLeft: number }
  | { kind: "empty" };

const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;

// Spec §7.2: which state the home hero card shows.
export function heroState<T extends LogLike>(input: {
  logs: T[];
  feedIntervalMin: number;
  now: Date;
}): HeroState<T> {
  const { logs, feedIntervalMin, now } = input;
  let running: T | null = null;
  for (const log of logs)
    if (
      log.ended_at === null &&
      (!running || Date.parse(log.started_at) > Date.parse(running.started_at))
    )
      running = log;
  if (running) return { kind: "running", log: running };
  const due = feedDue(logs, feedIntervalMin, now);
  if (!due) return { kind: "empty" };
  const diff = now.getTime() - due.getTime();
  return diff >= 0
    ? { kind: "overdue", due, lateMinutes: Math.floor(diff / MINUTE_MS) }
    : { kind: "next", due, minutesLeft: Math.ceil(-diff / MINUTE_MS) };
}

const TIMER_LABEL: Record<string, string> = {
  sleep: "Ngủ",
  pump: "Hút sữa",
  tummy: "Nằm sấp",
};

export function timerLabel(log: { type: string; details: unknown }): string {
  if (log.type === "breast") {
    const side = (log.details as { side?: unknown } | null)?.side;
    return side === "left" ? "Bú trái" : "Bú phải";
  }
  return TIMER_LABEL[log.type] ?? "Đang chạy";
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`
    : `${minutes}:${seconds}`;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} phút`;
  return `${Math.floor(minutes / 60)} giờ ${String(minutes % 60).padStart(2, "0")} phút`;
}

// The ring fills once every 60 minutes, then starts again.
export function ringProgress(ms: number): number {
  return (Math.max(0, ms) % HOUR_MS) / HOUR_MS;
}
