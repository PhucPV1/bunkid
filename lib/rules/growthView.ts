import type { WhoIndicator, WhoSex } from "@/lib/content/who";
import { formatDayShort } from "./days";
import {
  ageOnDay,
  type Lms,
  lmsAt,
  percentile,
  standardRange,
  zScore,
} from "./growth";
import {
  ALERT_CHIP,
  alertTone,
  type GrowthAlert,
  type GrowthMeasure,
  type GrowthTables,
  type GrowthTone,
  NEAR_CHIP,
  type NearKind,
  nearKind,
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
  // Spec §5.6: inside the norm but close to its edge. Null with an alert.
  near: NearKind | null;
  // The three labels under the position bar: "56,0 cm", "giữa 60,0", "64,0 cm".
  standard: { low: string; mid: string; high: string };
  // What the position bar says to a screen reader.
  barLabel: string;
  // "Cách mức thấp nhất của chuẩn 0,9 cm"; null when the value is not near.
  nearLine: string | null;
};

// The norm is always written with one decimal, "56,0" too, so the numbers on
// the screen line up and the reader can subtract them.
const oneDecimal = new Intl.NumberFormat("vi-VN", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const toTenths = (n: number) => Math.round(n * 10);
const fromTenths = (n: number) => oneDecimal.format(n / 10);
// The two edges are rounded inwards, the low one up and the high one down:
// the alerts read the exact edge, so a value the app calls low is then always
// below the lowest number on the screen, and one it calls high always above
// the highest. The margin keeps a product such as 3,9000000000000004 at 3,9.
const ROUNDING_MARGIN = 1e-6;
const tenthsUp = (n: number) => Math.ceil(n * 10 - ROUNDING_MARGIN);
const tenthsDown = (n: number) => Math.floor(n * 10 + ROUNDING_MARGIN);

// Spec 2026-11-25 §5.6: the norm on the day of one measurement, in words.
function standardText(
  indicator: WhoIndicator,
  lms: Lms,
  value: number,
  near: NearKind | null,
): Pick<IndicatorSummary, "standard" | "nearLine"> & { spoken: string } {
  const range = standardRange(lms);
  const low = tenthsUp(range.low);
  const mid = toTenths(range.mid);
  const high = tenthsDown(range.high);
  const unit = indicator === "wfa" ? "kg" : "cm";
  // Between the two numbers as the screen writes them. A value inside the
  // norm that reads at or just past the number shown is at the edge.
  const gap = Math.max(
    0,
    near === "nearLow"
      ? toTenths(value) - low
      : near === "nearHigh"
        ? high - toTenths(value)
        : 0,
  );
  const edge = near === "nearLow" ? "thấp" : "cao";
  return {
    standard: {
      low: `${fromTenths(low)} ${unit}`,
      mid: `giữa ${fromTenths(mid)}`,
      high: `${fromTenths(high)} ${unit}`,
    },
    spoken: `Chuẩn từ ${fromTenths(low)} đến ${fromTenths(high)} ${unit}, giữa ${fromTenths(mid)}.`,
    nearLine: !near
      ? null
      : gap === 0
        ? `Sát mức ${edge} nhất của chuẩn`
        : `Cách mức ${edge} nhất của chuẩn ${fromTenths(gap)} ${unit}`,
  };
}

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
    const lms = lmsAt(table, latest.ageDays);
    if (!lms) return [];
    const alert = input.alerts.find((item) => item.indicator === key);
    // An alert always wins: an indicator that has one is never "near".
    const near = alert ? null : nearKind(latest.z);
    const chip: IndicatorSummary["chip"] = alert
      ? { text: alert.chip, tone: alertTone(alert.level) }
      : near
        ? { text: NEAR_CHIP[near], tone: "warn" }
        : { text: "Bình thường", tone: "good" };
    const compare = comparePhrase(
      key,
      percentile(latest.z),
      input.sex,
      latest.ageDays,
    );
    const { standard, spoken, nearLine } = standardText(
      key,
      lms,
      latest.value,
      near,
    );
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
        chip,
        position: gaugePosition(latest.z),
        compare,
        change:
          shifted ??
          (before
            ? `${formatChange(key, latest.value - before.value)} sau ${latest.ageDays - before.ageDays} ngày`
            : null),
        measuredOn: latest.day,
        ageDays: latest.ageDays,
        near,
        standard,
        barLabel: `${chip.text}. ${compare}. ${spoken}`,
        nearLine,
      },
    ];
  });
}

// Spec 2026-11-25 §5.6: how the verdict card opens.
export type VerdictHead = {
  // Null with an alert: the alert cards above the verdict already say it.
  heading: string | null;
  // The strip about the indicators near the edge of the norm: one sentence in
  // bold for each edge, then the advice. Null when none is near.
  note: { strong: string[]; rest: string } | null;
};

const NEAR_REST =
  "Bé vẫn trong vùng bình thường; nên theo dõi ở các lần đo tới.";

// "Cân nặng, chiều dài và vòng đầu": only the first name keeps its capital.
function nameList(titles: string[]): string {
  const names = titles.map((title, index) =>
    index === 0 ? title : title.toLocaleLowerCase("vi"),
  );
  return names.length === 1
    ? names[0]
    : `${names.slice(0, -1).join(", ")} và ${names[names.length - 1]}`;
}

export function verdictHead(input: {
  babyName: string;
  alerts: GrowthAlert[];
  summaries: IndicatorSummary[];
}): VerdictHead {
  const titles = (kind: NearKind) =>
    input.summaries.filter((item) => item.near === kind).map((s) => s.title);
  const low = titles("nearLow");
  const high = titles("nearHigh");
  const near = low.length + high.length > 0;
  return {
    heading:
      input.alerts.length > 0
        ? null
        : `${input.babyName} ${near ? "phát triển bình thường" : "đang lớn đều"}`,
    note: near
      ? {
          strong: [
            ...(low.length > 0
              ? [`${nameList(low)} đang gần mức thấp của chuẩn.`]
              : []),
            ...(high.length > 0
              ? [`${nameList(high)} đang gần mức cao của chuẩn.`]
              : []),
          ],
          rest: NEAR_REST,
        }
      : null,
  };
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
    // Spec §5.6: the first indicator, in screen order, near the edge.
    let near: NearKind | null = null;
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
      const z = zScore(lms, value);
      const kind = positionKind(z);
      if (kind === "veryLow" || kind === "veryHigh") red ??= ALERT_CHIP[kind];
      else if (kind) yellow ??= ALERT_CHIP[kind];
      else near ??= nearKind(z);
    }
    const alert = alertOf.get(row);
    const chip: GrowthListItem<T>["chip"] = alert
      ? { text: alert.chip, tone: alertTone(alert.level) }
      : red
        ? { text: red, tone: "danger" }
        : yellow
          ? { text: yellow, tone: "warn" }
          : near
            ? { text: NEAR_CHIP[near], tone: "warn" }
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
