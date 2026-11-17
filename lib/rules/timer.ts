import type { LogType } from "./logDetails";

export type TimerButton =
  | { type: "breast"; side: "left" | "right" }
  | { type: "sleep" | "pump" | "tummy" };
export type RunningLog = {
  id: string;
  type: LogType;
  details: Record<string, unknown>;
};
export type TimerAction =
  | { kind: "stop"; id: string }
  | { kind: "start"; type: LogType; details: Record<string, unknown> };

function startAction(button: TimerButton): TimerAction {
  return {
    kind: "start",
    type: button.type,
    details: button.type === "breast" ? { side: button.side } : {},
  };
}

export function planTimerPress(
  running: RunningLog[],
  button: TimerButton,
): TimerAction[] {
  const current = running.find((log) => log.type === button.type);
  if (!current) return [startAction(button)];
  if (button.type === "breast" && current.details.side !== button.side) {
    return [{ kind: "stop", id: current.id }, startAction(button)];
  }
  return [{ kind: "stop", id: current.id }];
}

// Spec 2026-11-17 §4.3: minutes after which a running timer counts as forgotten.
export const TIMER_LIMIT_MIN = {
  breast: 60,
  pump: 60,
  tummy: 30,
  sleep: 840,
} as const;

type TimedLog = {
  type: string;
  started_at: string;
  ended_at: string | null;
  details: unknown;
};

const startMs = (log: TimedLog) => Date.parse(log.started_at);

function limitMs(type: string): number | null {
  return Object.hasOwn(TIMER_LIMIT_MIN, type)
    ? TIMER_LIMIT_MIN[type as keyof typeof TIMER_LIMIT_MIN] * 60_000
    : null;
}

// Spec §5.1: running timers at or past their limit, oldest first.
export function overdueTimers<T extends TimedLog>(logs: T[], now: Date): T[] {
  return logs
    .filter((log) => {
      const limit = limitMs(log.type);
      return (
        log.ended_at === null &&
        limit !== null &&
        now.getTime() - startMs(log) >= limit
      );
    })
    .sort((a, b) => startMs(a) - startMs(b));
}

export type BreastSide = "left" | "right";
export type NextSide = {
  suggest: BreastSide;
  last: BreastSide;
  lastAt: string;
};

const DAY_MS = 24 * 3_600_000;

function sideOf(log: TimedLog): BreastSide | null {
  const side = (log.details as { side?: unknown } | null)?.side;
  return side === "left" || side === "right" ? side : null;
}

// Spec §5.3: the side opposite to the latest finished breast log of the last
// 24 hours. Nothing while a breast timer runs: the hero card offers "Đổi bên".
export function nextBreastSide(logs: TimedLog[], now: Date): NextSide | null {
  const breast = logs.filter((log) => log.type === "breast");
  if (breast.some((log) => log.ended_at === null)) return null;
  const from = now.getTime() - DAY_MS;
  let latest: { at: number; side: BreastSide; log: TimedLog } | null = null;
  for (const log of breast) {
    const at = startMs(log);
    const side = sideOf(log);
    if (side === null || at < from || at > now.getTime()) continue;
    if (!latest || at > latest.at) latest = { at, side, log };
  }
  if (!latest) return null;
  return {
    suggest: latest.side === "left" ? "right" : "left",
    last: latest.side,
    lastAt: latest.log.started_at,
  };
}

// Spec §5.2: the pill shows the running timer that started last, plus how
// many others are running.
export function pillTimer<T extends TimedLog>(
  logs: T[],
): { log: T; more: number } | null {
  const running = logs
    .filter((log) => log.ended_at === null)
    .sort((a, b) => startMs(b) - startMs(a));
  return running.length > 0
    ? { log: running[0], more: running.length - 1 }
    : null;
}
