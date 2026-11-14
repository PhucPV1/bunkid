import type { LmsRow, WhoIndicator } from "@/lib/content/who";
import { formatDayShort } from "./days";
import { assess } from "./growth";
import {
  formatGrowthValue,
  formatPercentile,
  indicatorValue,
  INDICATORS,
  type GrowthInput,
} from "./growthForm";
import { detailsSchemas } from "./logDetails";
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
