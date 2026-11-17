import { addDays, vnDayStartMs } from "./days";
import { vnDateString } from "./time";
import type { LogLike } from "./describeLog";
import { groupFeedSessions } from "./ratings";
import { shortDuration } from "./summaryText";

export type HistoryFilter =
  "all" | "feed" | "sleep" | "diaper" | "medicine" | "temperature";

export const HISTORY_FILTERS: { value: HistoryFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "feed", label: "Bú" },
  { value: "sleep", label: "Ngủ" },
  { value: "diaper", label: "Tã" },
  { value: "medicine", label: "Thuốc" },
  { value: "temperature", label: "Nhiệt độ" },
];

const FILTER_TYPES: Record<Exclude<HistoryFilter, "all">, readonly string[]> = {
  feed: ["breast", "bottle"],
  sleep: ["sleep"],
  diaper: ["diaper"],
  medicine: ["medicine"],
  temperature: ["temperature"],
};

export function matchesFilter(
  log: { type: string },
  filter: HistoryFilter,
): boolean {
  return filter === "all" || FILTER_TYPES[filter].includes(log.type);
}

export function groupByVnDay<T extends { started_at: string }>(
  logs: T[],
): { day: string; logs: T[] }[] {
  const sorted = [...logs].sort(
    (a, b) => Date.parse(b.started_at) - Date.parse(a.started_at),
  );
  const groups: { day: string; logs: T[] }[] = [];
  for (const log of sorted) {
    const day = vnDateString(new Date(log.started_at));
    const last = groups.at(-1);
    if (last && last.day === day) last.logs.push(log);
    else groups.push({ day, logs: [log] });
  }
  return groups;
}

export const HISTORY_PAGE_DAYS = 7;

export function historyPageRange(
  now: Date,
  page: number,
): { fromDay: string; from: string; to: string } {
  const today = vnDateString(now);
  const fromDay = addDays(today, -HISTORY_PAGE_DAYS * page - 6);
  const toDay = addDays(today, -HISTORY_PAGE_DAYS * page + 1);
  return {
    fromDay,
    from: new Date(vnDayStartMs(fromDay)).toISOString(),
    to: new Date(vnDayStartMs(toDay)).toISOString(),
  };
}

export function nextHistoryPage(
  dob: string,
  now: Date,
  loadedPages: number,
): number | undefined {
  return historyPageRange(now, loadedPages - 1).fromDay > dob
    ? loadedPages
    : undefined;
}

export function canModifyLog(
  viewer: { role: string; user_id: string | null },
  createdBy: string,
): boolean {
  return (
    viewer.role === "owner" ||
    (viewer.user_id !== null && viewer.user_id === createdBy)
  );
}

// Spec §9 Nhật ký: "N cữ · N tã · ngủ Xg Yp" for one VN day. `logs` are the logs
// that started that day. Sleep is cut at midnight like Thống kê does, so a night
// of sleep is shared between the two days; `all` is every loaded log, which is
// where a sleep that started the evening before comes from.
export function daySummary(input: {
  day: string;
  logs: LogLike[];
  all: LogLike[];
  now: Date;
}): string {
  const { day, logs, all, now } = input;
  const feeds = groupFeedSessions(logs, now).length;
  const diapers = logs.filter((log) => log.type === "diaper").length;
  const from = vnDayStartMs(day);
  const to = Math.min(vnDayStartMs(addDays(day, 1)), now.getTime());
  let sleepMs = 0;
  for (const log of all) {
    if (log.type !== "sleep") continue;
    const start = Math.max(Date.parse(log.started_at), from);
    const end = Math.min(
      log.ended_at ? Date.parse(log.ended_at) : now.getTime(),
      to,
    );
    if (end > start) sleepMs += end - start;
  }
  return `${feeds} cữ · ${diapers} tã · ngủ ${shortDuration(Math.round(sleepMs / 60_000))}`;
}
