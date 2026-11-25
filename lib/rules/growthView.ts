import type { WhoIndicator, WhoSex } from "@/lib/content/who";
import { formatDayShort } from "./days";
import { ageOnDay, lmsAt, percentile, zScore } from "./growth";
import {
  ALERT_CHIP,
  alertTone,
  type GrowthAlert,
  type GrowthMeasure,
  type GrowthTables,
  type GrowthTone,
  newestFirst,
  positionKind,
  readings,
} from "./growthAlerts";
import {
  comparePhrase,
  formatGrowthValue,
  INDICATORS,
  indicatorValue,
  outOf100,
} from "./growthForm";
import { formatAgeVi } from "./time";

// Spec 2026-11-25 §5.3: one block of the verdict card.
export type IndicatorSummary = {
  indicator: WhoIndicator;
  title: string;
  value: string;
  chip: { text: string; tone: GrowthTone };
  // 0–100: where the dot sits on the position bar.
  position: number;
  compare: string;
  // "+1,5 kg sau 46 ngày", "trước đó là 45 trong 100", or null when there is
  // no earlier measurement.
  change: string | null;
  measuredOn: string;
  ageDays: number;
};

// z −3…+3 across the bar; anything beyond sits at the end.
export function gaugePosition(z: number): number {
  return Math.min(1, Math.max(0, (z + 3) / 6)) * 100;
}

// "+1,5 kg", "−0,2 cm": the difference between two values of one indicator.
export function formatChange(indicator: WhoIndicator, delta: number): string {
  return `${delta < 0 ? "−" : "+"}${formatGrowthValue(indicator, Math.abs(delta))}`;
}

export function indicatorSummaries(input: {
  rows: GrowthMeasure[];
  tables: GrowthTables;
  dob: string;
  sex: WhoSex;
  alerts: GrowthAlert[];
}): IndicatorSummary[] {
  return INDICATORS.flatMap(({ key, title }): IndicatorSummary[] => {
    const table = input.tables[key];
    if (!table) return [];
    const [latest, ...older] = readings(input.rows, table, input.dob, key);
    if (!latest) return [];
    const alert = input.alerts.find((item) => item.indicator === key);
    const before = older.find((reading) => reading.day < latest.day);
    const shifted =
      alert && alert.previousPercentile !== null
        ? `trước đó là ${outOf100(alert.previousPercentile)} trong 100`
        : null;
    return [
      {
        indicator: key,
        title,
        value: formatGrowthValue(key, latest.value),
        chip: alert
          ? { text: alert.chip, tone: alertTone(alert.level) }
          : { text: "Bình thường", tone: "good" },
        position: gaugePosition(latest.z),
        compare: comparePhrase(
          key,
          percentile(latest.z),
          input.sex,
          latest.ageDays,
        ),
        change:
          shifted ??
          (before
            ? `${formatChange(key, latest.value - before.value)} sau ${latest.ageDays - before.ageDays} ngày`
            : null),
        measuredOn: latest.day,
        ageDays: latest.ageDays,
      },
    ];
  });
}

// The indicator the page opens on: the first one, in screen order, with an alert.
export function defaultIndicator(alerts: GrowthAlert[]): WhoIndicator {
  return (
    INDICATORS.find((item) =>
      alerts.some((alert) => alert.indicator === item.key),
    )?.key ?? "wfa"
  );
}

// The dot next to an indicator's name in the picker.
export function alertDots(
  alerts: GrowthAlert[],
): Partial<Record<WhoIndicator, "warn" | "danger">> {
  return Object.fromEntries(
    alerts.map((alert) => [alert.indicator, alertTone(alert.level)]),
  );
}

// Spec 2026-11-25 §5.4: which way the label of the newest point runs. It runs
// towards the wider side of the plot, so it never crosses an axis or the right
// edge; running right it is also clear of the baby's line, which always
// arrives from the left.
export function chartLabelAnchor(day: number, to: number): "start" | "end" {
  return day * 2 <= to ? "start" : "end";
}

// Where the label of the newest point goes, and which fixed captions of the
// chart make way for it.
export type ChartLabelPlace = {
  anchor: "start" | "end";
  side: "top" | "bottom";
  // "Bình thường" inside the band, at its right end.
  normalCaption: boolean;
  // "Cao hơn chuẩn" in the top left corner.
  highCaption: boolean;
};

export function chartLabelPlace(input: {
  day: number;
  to: number;
  // The newest point carries an alert.
  alert: boolean;
  // The newest value minus the one before it; null with a single measurement.
  change: number | null;
}): ChartLabelPlace {
  const { day, to, alert, change } = input;
  const anchor = chartLabelAnchor(day, to);
  // Spec §5.4: above the point, or below it with an alert.
  const usual = alert ? "bottom" : "top";
  // Running left the label lies over the stretch the line comes through, so
  // it takes the side the line does not come from.
  const side =
    anchor === "end" && change !== null && change !== 0
      ? change > 0
        ? "top"
        : "bottom"
      : usual;
  return {
    anchor,
    side,
    // The caption sits in the right quarter of the plot: a point there, or
    // its label, would lie on it.
    normalCaption: day <= 0.7 * to,
    // An alert label is long enough to reach the corner caption.
    highCaption: !(alert && anchor === "end" && side === "top"),
  };
}

// Spec 2026-11-25 §5.4: what the chart of one indicator draws besides the band.
export type ChartView = {
  title: string;
  unit: "kg" | "cm";
  // Oldest first; `day` is the age in days.
  points: { day: number; value: number }[];
  last: {
    day: number;
    value: number;
    label: string;
    tone: "accent" | "warn" | "danger";
  } | null;
  ariaLabel: string;
  alertTone: "warn" | "danger" | null;
  // A falling or rising alert: the caption adds a sentence about direction.
  shifted: boolean;
};

export function chartView(input: {
  indicator: WhoIndicator;
  rows: GrowthMeasure[];
  dob: string;
  alerts: GrowthAlert[];
  summaries: IndicatorSummary[];
}): ChartView {
  const { indicator } = input;
  const name = INDICATORS.find((item) => item.key === indicator)!.title;
  const title = `${name} theo tháng tuổi`;
  const measured = newestFirst(input.rows).flatMap((row) => {
    const value = indicatorValue(row, indicator);
    return value === null
      ? []
      : [
          {
            on: row.measured_on,
            day: ageOnDay(input.dob, row.measured_on),
            value,
          },
        ];
  });
  const [newest] = measured;
  // An alert is about the newest measurement the WHO table can place; a newer
  // one outside the table is drawn plainly.
  const alert = input.alerts.find(
    (item) => item.indicator === indicator && item.measuredOn === newest?.on,
  );
  const summary = input.summaries.find((item) => item.indicator === indicator);
  const tone = alert ? alertTone(alert.level) : null;
  const value = newest ? formatGrowthValue(indicator, newest.value) : "";
  return {
    title,
    unit: indicator === "wfa" ? "kg" : "cm",
    points: measured.map(({ day, value: v }) => ({ day, value: v })).reverse(),
    last: newest
      ? {
          day: newest.day,
          value: newest.value,
          label: alert ? `${value} · ${alert.chip}` : value,
          tone: tone ?? "accent",
        }
      : null,
    ariaLabel:
      measured.length === 0
        ? `${title}. Chưa có lần đo.`
        : `${title}. ${measured.length} lần đo.${summary ? ` Lần gần nhất: ${summary.chip.text}.` : ""}`,
    alertTone: tone,
    shifted: alert?.kind === "falling" || alert?.kind === "rising",
  };
}

// Spec 2026-11-25 §5.5: one row of "Các lần đo".
export type GrowthListItem<T> = {
  row: T;
  title: string;
  values: string;
  delta: string | null;
  // null: not assessed, either outside the WHO table or its tables not loaded.
  chip: { text: string; tone: GrowthTone } | null;
  outside: boolean;
};

const withName = (indicator: WhoIndicator, text: string) =>
  indicator === "hcfa" ? `vòng đầu ${text}` : text;

export function listRows<T extends GrowthMeasure>(input: {
  rows: T[];
  tables: GrowthTables;
  dob: string;
  alerts: GrowthAlert[];
}): GrowthListItem<T>[] {
  const sorted = newestFirst(input.rows);
  // The row an alert is about: the first one, newest first, of its day that
  // has the indicator. A row with two alerts keeps the one listed first.
  const alertOf = new Map<T, GrowthAlert>();
  for (const alert of input.alerts) {
    const row = sorted.find(
      (item) =>
        item.measured_on === alert.measuredOn &&
        indicatorValue(item, alert.indicator) !== null,
    );
    if (row && !alertOf.has(row)) alertOf.set(row, alert);
  }

  return sorted.map((row, index): GrowthListItem<T> => {
    const below = sorted[index + 1];
    const age = ageOnDay(input.dob, row.measured_on);
    const values: string[] = [];
    const changes: string[] = [];
    let red: string | null = null;
    let yellow: string | null = null;
    let assessed = 0;
    let outside = false;
    for (const { key } of INDICATORS) {
      const value = indicatorValue(row, key);
      if (value === null) continue;
      values.push(withName(key, formatGrowthValue(key, value)));
      const before = below ? indicatorValue(below, key) : null;
      if (before !== null && before !== undefined)
        changes.push(withName(key, formatChange(key, value - before)));
      const table = input.tables[key];
      if (!table) continue;
      const lms = lmsAt(table, age);
      if (!lms) {
        outside = true;
        continue;
      }
      assessed += 1;
      const kind = positionKind(zScore(lms, value));
      if (kind === "veryLow" || kind === "veryHigh") red ??= ALERT_CHIP[kind];
      else if (kind) yellow ??= ALERT_CHIP[kind];
    }
    const alert = alertOf.get(row);
    const chip: GrowthListItem<T>["chip"] = alert
      ? { text: alert.chip, tone: alertTone(alert.level) }
      : red
        ? { text: red, tone: "danger" }
        : yellow
          ? { text: yellow, tone: "warn" }
          : assessed > 0
            ? { text: "Bình thường", tone: "good" }
            : null;
    return {
      row,
      title: `${formatDayShort(row.measured_on)} · ${
        row.measured_on === input.dob
          ? "lúc sinh"
          : formatAgeVi(input.dob, new Date(`${row.measured_on}T05:00:00Z`))
      }`,
      values: values.join(" · "),
      delta:
        changes.length > 0 ? `${changes.join(" · ")} so với lần trước` : null,
      chip,
      outside: chip === null && outside,
    };
  });
}
