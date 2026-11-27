import { vnDayStartMs } from "./days";
import type { LogLike } from "./describeLog";
import {
  FIRST_SCREEN_ROWS,
  type HistoryFilter,
  matchesFilter,
} from "./history";
import { groupFeedSessions } from "./ratings";
import { shortDuration } from "./summaryText";
import { vnDateString } from "./time";

// Spec 2026-11-27 (Nhật ký theo buổi) §3.1: the periods of a VN day, latest
// first, the order Nhật ký shows them in.
export type DayPeriodKey = "night" | "morning" | "afternoon" | "evening";

export const DAY_PERIODS: readonly {
  key: DayPeriodKey;
  label: string;
  fromHour: number;
}[] = [
  { key: "evening", label: "Tối · 18–24 giờ", fromHour: 18 },
  { key: "afternoon", label: "Chiều · 12–18 giờ", fromHour: 12 },
  { key: "morning", label: "Sáng · 6–12 giờ", fromHour: 6 },
  { key: "night", label: "Đêm · 0–6 giờ", fromHour: 0 },
];

const HOUR_MS = 3_600_000;
const PERIOD_MS = 6 * HOUR_MS;
const VN_OFFSET_MS = 7 * HOUR_MS; // Vietnam has no daylight saving time.

// The period a log belongs to: the VN hour it started.
export function periodOf(startedAt: string): DayPeriodKey {
  const hour = new Date(Date.parse(startedAt) + VN_OFFSET_MS).getUTCHours();
  if (hour < 6) return "night";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

// §3.2: "logs" when a log (not a symptom) started in the period; "sleepOnly"
// when none did but a sleep from before runs into it; "empty" otherwise.
export type PeriodKind = "logs" | "sleepOnly" | "empty";

export type DayPeriod<T> = {
  key: DayPeriodKey;
  label: string;
  summary: string;
  logs: T[];
  kind: PeriodKind;
};

// §3.3: "3 cữ · 2 tã · ngủ 2g 10p" without the parts that are 0; "N mục"
// when all three are.
export function periodSummary(input: {
  feeds: number;
  diapers: number;
  sleepMinutes: number;
  count: number;
}): string {
  const parts: string[] = [];
  if (input.feeds > 0) parts.push(`${input.feeds} cữ`);
  if (input.diapers > 0) parts.push(`${input.diapers} tã`);
  if (input.sleepMinutes > 0)
    parts.push(`ngủ ${shortDuration(input.sleepMinutes)}`);
  return parts.length > 0 ? parts.join(" · ") : `${input.count} mục`;
}

// Sleep inside [from, to), cut at both edges like daySummary cuts at midnight.
function sleepMs(all: LogLike[], from: number, to: number, now: Date): number {
  let total = 0;
  for (const log of all) {
    if (log.type !== "sleep") continue;
    const start = Math.max(Date.parse(log.started_at), from);
    const end = Math.min(
      log.ended_at ? Date.parse(log.ended_at) : now.getTime(),
      to,
    );
    if (end > start) total += end - start;
  }
  return total;
}

// §3.2–§3.4. `logs` are the logs that started on `day`, newest first (as
// groupByVnDay leaves them); `all` is every loaded log, where a sleep from the
// evening before comes from. Symptom logs are for the whole day and go above
// the periods.
export function dayPeriods<T extends LogLike>(input: {
  day: string;
  logs: T[];
  all: LogLike[];
  filter: HistoryFilter;
  now: Date;
}): { symptoms: T[]; periods: DayPeriod<T>[] } {
  const { day, logs, all, filter, now } = input;
  const dayStart = vnDayStartMs(day);
  const nowMs = now.getTime();
  const isToday = day === vnDateString(now);
  const symptoms = logs.filter(
    (log) => log.type === "symptom" && matchesFilter(log, filter),
  );
  const rest = logs.filter((log) => log.type !== "symptom");
  // Sessions of the whole day, so a feed across a boundary counts once.
  const sessions = groupFeedSessions(rest, now);
  const periods: DayPeriod<T>[] = [];
  for (const period of DAY_PERIODS) {
    const from = dayStart + period.fromHour * HOUR_MS;
    const to = from + PERIOD_MS;
    const own = rest.filter((log) => periodOf(log.started_at) === period.key);
    const sleepMinutes = Math.round(
      sleepMs(all, from, Math.min(to, nowMs), now) / 60_000,
    );
    const kind: PeriodKind =
      own.length > 0 ? "logs" : sleepMinutes > 0 ? "sleepOnly" : "empty";
    // Today stops at the period under way, but a log never disappears.
    if (isToday && from > nowMs && kind !== "logs") continue;
    const shown = own.filter((log) => matchesFilter(log, filter));
    if (filter !== "all" && shown.length === 0) continue;
    periods.push({
      key: period.key,
      label: period.label,
      logs: shown,
      kind,
      summary:
        kind === "empty"
          ? ""
          : periodSummary({
              feeds: sessions.filter((s) => s.start >= from && s.start < to)
                .length,
              diapers: own.filter((log) => log.type === "diaper").length,
              sleepMinutes,
              count: own.length,
            }),
    });
  }
  return { symptoms, periods };
}

export function periodOpenKey(day: string, key: DayPeriodKey): string {
  return `${day}|${key}`;
}

// §4.1: the id of the list of a period's rows, for aria-controls.
export function periodListId(day: string, key: DayPeriodKey): string {
  return `p-${day}-${key}`;
}

// §3.5: today's latest period with logs, the one Tất cả opens by itself.
export function defaultOpenPeriod(
  days: readonly {
    day: string;
    periods: readonly { key: DayPeriodKey; kind: PeriodKind }[];
  }[],
  now: Date,
): string | null {
  const today = days.find((d) => d.day === vnDateString(now));
  const period = today?.periods.find((p) => p.kind === "logs");
  return today && period ? periodOpenKey(today.day, period.key) : null;
}

export type PeriodDay<T> = {
  day: string;
  summary: string;
  symptoms: T[];
  periods: DayPeriod<T>[];
};
export type OpenDayPeriod<T> = DayPeriod<T> & { open: boolean };
export type OpenPeriodDay<T> = Omit<PeriodDay<T>, "periods"> & {
  periods: OpenDayPeriod<T>[];
};

// §3.5: a filter opens every period with logs; Tất cả opens the default one.
// A tap (`overrides`, by periodOpenKey) wins either way. Only "logs" periods
// open.
export function openPeriods<T>(
  days: PeriodDay<T>[],
  input: {
    filter: HistoryFilter;
    now: Date;
    overrides: Readonly<Record<string, boolean>>;
  },
): OpenPeriodDay<T>[] {
  const defaultKey =
    input.filter === "all" ? defaultOpenPeriod(days, input.now) : null;
  return days.map((d) => ({
    ...d,
    periods: d.periods.map((p) => {
      const key = periodOpenKey(d.day, p.key);
      const open =
        p.kind === "logs" &&
        (input.overrides[key] ??
          (input.filter !== "all" || key === defaultKey));
      return { ...p, open };
    }),
  }));
}

// §4.5: the rows a phone screen shows first. Only symptom rows and rows of
// open periods count; headers do not.
export function firstScreenDays<T>(
  days: OpenPeriodDay<T>[],
  rows = FIRST_SCREEN_ROWS,
): OpenPeriodDay<T>[] {
  const out: OpenPeriodDay<T>[] = [];
  let left = rows;
  for (const day of days) {
    if (left <= 0) break;
    const symptoms = day.symptoms.slice(0, left);
    left -= symptoms.length;
    let cut = symptoms.length < day.symptoms.length;
    const periods = day.periods.map((p) => {
      if (!p.open) return p;
      const logs = p.logs.slice(0, Math.max(left, 0));
      left -= logs.length;
      if (logs.length === p.logs.length) return p;
      cut = true;
      return { ...p, logs };
    });
    out.push(cut ? { ...day, symptoms, periods } : day);
  }
  return out;
}
