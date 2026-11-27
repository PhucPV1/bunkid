import { TRIAGE } from "@/lib/content/triage";
import type { LmsRow, WhoIndicator } from "@/lib/content/who";
import { addDays, formatDayShort, vnDayStartMs } from "./days";
import { assess } from "./growth";
import {
  formatGrowthValue,
  formatPercentile,
  indicatorValue,
  INDICATORS,
  type GrowthInput,
} from "./growthForm";
import { type EpisodeLike, episodeDayCount } from "./illness";
import { detailsSchemas } from "./logDetails";
import { symptomShorts } from "./symptomForm";
import { formatVnTime, vnDateString } from "./time";
import type { ScheduleItem } from "./vaccines";

export const REPORT_DAYS = [7, 14] as const;

type LogLike = { type: string; started_at: string; details: unknown };

const METHOD: Record<string, string> = {
  nach: "nách",
  tran: "trán",
  tai: "tai",
  hau_mon: "hậu môn",
};

const when = (iso: string) => {
  const at = new Date(iso);
  return `${formatDayShort(vnDateString(at))} ${formatVnTime(at)}`;
};

const decimal = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

// Spec §6.15: every temperature reading in the period, oldest first.
export function temperatureRows(
  logs: LogLike[],
  fromMs: number,
): { at: string; text: string; high: boolean }[] {
  return logs
    .filter((log) => log.type === "temperature")
    .filter((log) => Date.parse(log.started_at) >= fromMs)
    .sort((a, b) => a.started_at.localeCompare(b.started_at))
    .flatMap((log) => {
      const parsed = detailsSchemas.temperature.safeParse(log.details);
      if (!parsed.success) return [];
      const { celsius, method } = parsed.data;
      return [
        {
          at: when(log.started_at),
          text: `${decimal.format(celsius)}°C (${METHOD[method]})`,
          high: celsius >= 38,
        },
      ];
    });
}

// Spec §6.15: medicines given (time, name, amount), oldest first.
export function medicineRows(
  logs: LogLike[],
  fromMs: number,
): { at: string; name: string; amount: string }[] {
  return logs
    .filter((log) => log.type === "medicine")
    .filter((log) => Date.parse(log.started_at) >= fromMs)
    .sort((a, b) => a.started_at.localeCompare(b.started_at))
    .flatMap((log) => {
      const parsed = detailsSchemas.medicine.safeParse(log.details);
      if (!parsed.success) return [];
      const d = parsed.data;
      return [
        {
          at: when(log.started_at),
          name: d.antipyretic ? `${d.name} (hạ sốt)` : d.name,
          amount: `${decimal.format(d.amount)} ${d.unit}`,
        },
      ];
    });
}

// Spec 2026-11-26 §9: the symptom logs of the period, oldest first: the
// time, the short names in the content's order, the note. Codes the content
// no longer has are left out (spec §3.1).
export function symptomRows(
  logs: LogLike[],
  fromMs: number,
): { at: string; text: string; note: string }[] {
  return logs
    .filter((log) => log.type === "symptom")
    .filter((log) => Date.parse(log.started_at) >= fromMs)
    .sort((a, b) => a.started_at.localeCompare(b.started_at))
    .flatMap((log) => {
      const parsed = detailsSchemas.symptom.safeParse(log.details);
      if (!parsed.success) return [];
      return [
        {
          at: when(log.started_at),
          text: symptomShorts(parsed.data.codes, TRIAGE.symptoms).join(", "),
          note: parsed.data.note ?? "",
        },
      ];
    });
}

// Spec 2026-11-26 §9 from M5: the table "Lần khám" of the episode period, a
// row per visit in the order given; an empty field is an empty cell. No
// photo is printed.
export function visitRows(
  visits: {
    visited_at: string;
    place: string | null;
    conclusion: string | null;
    advice: string | null;
  }[],
): { at: string; place: string; conclusion: string; advice: string }[] {
  return visits.map((visit) => ({
    at: when(visit.visited_at),
    place: visit.place ?? "",
    conclusion: visit.conclusion ?? "",
    advice: visit.advice ?? "",
  }));
}

export type ReportPeriod = "7" | "14" | "dot";

// Spec 2026-11-26 §9: the period the report shows. `picked` is the choice
// made on the page (null until one is made), `address` the `dot` of
// /bao-cao?dot={id}, `episodes` every episode of the baby (undefined while
// they load). An address that names no episode counts as none; picking
// "Đợt ốm" by hand takes the open episode, else the one that started last.
// null: not known yet (the address names an episode and the list is loading).
export function reportSelection<T extends EpisodeLike>(input: {
  picked: ReportPeriod | null;
  address: string | null;
  episodes: T[] | undefined;
}): { period: ReportPeriod; episode: T | null } | null {
  const { picked, address, episodes } = input;
  if (picked === "7" || picked === "14")
    return { period: picked, episode: null };
  if (!episodes)
    return picked === null && address === null
      ? { period: "7", episode: null }
      : null;
  const episode =
    picked === null
      ? (episodes.find((item) => item.id === address) ?? null)
      : (episodes.find((item) => item.ended_at === null) ??
        [...episodes].sort((a, b) =>
          b.started_at.localeCompare(a.started_at),
        )[0] ??
        null);
  return episode ? { period: "dot", episode } : { period: "7", episode: null };
}

const REPORT_EPISODE_DAYS = 14;
const startIso = (day: string) => new Date(vnDayStartMs(day)).toISOString();

// Spec 2026-11-26 §9: the days of the "Đợt ốm" period, from the first day to
// the last (an open episode: today), the last 14 at most; the logs to read,
// from the start of the day before the first day shown (a sleep from the
// evening before still counts) to the start of the day after the last (an
// open episode: no upper bound); and the line under the baby's name.
export function episodeReport(
  episode: EpisodeLike,
  now: Date,
): {
  days: string[];
  truncated: boolean;
  from: string;
  to: string | null;
  line: string;
} {
  const firstDay = vnDateString(new Date(episode.started_at));
  // A start may be up to a minute ahead (spec §5.7), so just before midnight
  // an open episode can begin on tomorrow's date: it still has its first day.
  const count = Math.max(1, episodeDayCount(episode, now));
  const shown = Math.min(count, REPORT_EPISODE_DAYS);
  const days = Array.from({ length: shown }, (_, i) =>
    addDays(firstDay, count - shown + i),
  );
  const lastDay = days[days.length - 1];
  return {
    days,
    truncated: count > REPORT_EPISODE_DAYS,
    from: startIso(addDays(days[0], -1)),
    to: episode.ended_at ? startIso(addDays(lastDay, 1)) : null,
    line: episode.ended_at
      ? `Đợt ốm ${formatDayShort(firstDay)} – ${formatDayShort(lastDay)} · ${count} ngày`
      : `Đợt ốm từ ${formatDayShort(firstDay)} · ngày thứ ${count}`,
  };
}

// Spec §6.15: the latest measurement of each indicator, with its WHO percentile.
export function growthSummary(
  rows: (GrowthInput & { created_at?: string })[],
  tables: Partial<Record<WhoIndicator, LmsRow[]>>,
  dob: string,
): { title: string; value: string; day: string; percentile: string | null }[] {
  return INDICATORS.flatMap((indicator) => {
    const latest = [...rows]
      .filter((row) => indicatorValue(row, indicator.key) !== null)
      .sort((a, b) => b.measured_on.localeCompare(a.measured_on))[0];
    if (!latest) return [];
    const value = indicatorValue(latest, indicator.key) as number;
    const table = tables[indicator.key];
    const result = table ? assess(table, dob, latest.measured_on, value) : null;
    return [
      {
        title: indicator.title,
        value: formatGrowthValue(indicator.key, value),
        day: latest.measured_on.split("-").reverse().join("/"),
        percentile: result ? formatPercentile(result.percentile) : null,
      },
    ];
  });
}

// Spec §6.15: last dose given and the next one due.
export function vaccineSummary(items: ScheduleItem[]): {
  last: { name: string; day: string | null } | null;
  next: {
    name: string;
    day: string;
    overdue: boolean;
    pastMaxAge: boolean;
  } | null;
} {
  const done = items
    .filter((item) => item.state === "done")
    .sort((a, b) =>
      (b.record?.given_on ?? b.due).localeCompare(a.record?.given_on ?? a.due),
    )[0];
  const next = items
    .filter(
      (item) =>
        !item.unchosen && item.state !== "done" && item.state !== "skipped",
    )
    .sort((a, b) => a.due.localeCompare(b.due))[0];
  const dmy = (day: string) => day.split("-").reverse().join("/");
  return {
    last: done
      ? {
          name: done.dose.name,
          day: done.record?.given_on ? dmy(done.record.given_on) : null,
        }
      : null,
    next: next
      ? {
          name: next.dose.name,
          day: dmy(next.due),
          overdue: next.state === "overdue",
          pastMaxAge: next.pastMaxAge,
        }
      : null,
  };
}
