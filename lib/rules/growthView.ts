import type { WhoIndicator } from "@/lib/content/who";
import { formatDayShort } from "./days";
import {
  ageOnDay,
  type CurvePoint,
  type Lms,
  lmsAt,
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
import { formatGrowthValue, INDICATORS, indicatorValue } from "./growthForm";
import { formatAgeVi } from "./time";

// Spec 2026-11-25 §5.3: one block of the verdict card.
export type IndicatorSummary = {
  indicator: WhoIndicator;
  title: string;
  value: string;
  chip: { text: string; tone: GrowthTone };
  // 0–100: where the dot sits on the position bar.
  position: number;
  // "+1,5 kg sau 46 ngày", or null when there is no earlier measurement.
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

// The tables are already those of the baby's sex, so the sex is not asked for.
export function indicatorSummaries(input: {
  rows: GrowthMeasure[];
  tables: GrowthTables;
  dob: string;
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
    const { standard, spoken, nearLine } = standardText(
      key,
      lms,
      latest.value,
      near,
    );
    const before = older.find((reading) => reading.day < latest.day);
    return [
      {
        indicator: key,
        title,
        value: formatGrowthValue(key, latest.value),
        chip,
        position: gaugePosition(latest.z),
        change: before
          ? `${formatChange(key, latest.value - before.value)} sau ${latest.ageDays - before.ageDays} ngày`
          : null,
        measuredOn: latest.day,
        ageDays: latest.ageDays,
        near,
        standard,
        barLabel: `${chip.text}. ${spoken}`,
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
  // Extra px between the point and its label. 0, except round a target line
  // that leaves no room next to the point (§6.3, item 4).
  away: number;
  // "Bình thường" inside the band, at its right end.
  normalCaption: boolean;
  // "Cao hơn chuẩn" in the top left corner.
  highCaption: boolean;
  // "Đường mục tiêu" at the right end of the target line (§6.3, item 4).
  targetCaption: boolean;
};

// Spec 2026-11-25 §6.3, item 4: what the label of the newest point keeps clear
// of on the chart of the Chiều cao page, where a second line crosses the plot.
export type LabelSurroundings = {
  // The newest value, and its label as written.
  value: number;
  label: string;
  // The baby's measurements, oldest first.
  points: { day: number; value: number }[];
  // The target line and the normal band, as drawn.
  target: { day: number; value: number }[];
  band: CurvePoint[];
};

// The plot as it is on the narrowest screen, 375 px: there a label takes the
// largest share of the axis. Its height is the same on every screen.
const PLOT = { width: 273, height: 222, headroom: 28 };
// The label is 13 px bold, about 8 px a character. It starts 9 px from the
// middle of its point and ends 24 px from it.
const LABEL = { char: 8, near: 9, far: 24 };
// "Đường mục tiêu": 87 px by 13 px, ending 6 px from the right edge of the
// plot and 2,5 px above the end of the line.
const CAPTION = { width: 87, height: 13, right: 6, above: 2.5 };
// How far a line stays from the text: the halo round it and half the line.
const CLEAR = 3;
// How much further from its point the label may go to find room.
const AWAY = [0, 4, 8, 12, 16, 20, 24];

type Spot = { x: number; y: number };
// Pixels from the top left corner of the plot.
type Box = { left: number; right: number; top: number; bottom: number };

// Whether the stretch from a to b passes through the box.
function crosses(a: Spot, b: Spot, box: Box): boolean {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  let from = 0;
  let until = 1;
  for (const [step, room] of [
    [-dx, a.x - box.left],
    [dx, box.right - a.x],
    [-dy, a.y - box.top],
    [dy, box.bottom - a.y],
  ]) {
    if (step === 0) {
      if (room < 0) return false;
    } else if (step < 0) from = Math.max(from, room / step);
    else until = Math.min(until, room / step);
  }
  return from <= until;
}

// The first of the four places round the point that lies inside the plot and
// that neither line nor the caption of the target line passes through: the
// usual place, the other side of the point, then the same two running the
// other way. With none free the same four are tried a little further from the
// point, up to 24 px. With no such place at all the label keeps the usual
// one; its halo keeps it readable there.
function clearPlace(input: {
  day: number;
  to: number;
  anchor: "start" | "end";
  side: "top" | "bottom";
  caption: boolean;
  around: LabelSurroundings;
}): Pick<ChartLabelPlace, "anchor" | "side" | "away"> {
  const { day, to, anchor, side } = input;
  const { value, label, points, target, band } = input.around;
  // The chart scales its value axis to everything it draws.
  const values = [
    ...band.flatMap((point) => [point.low, point.high]),
    ...points.map((point) => point.value),
    ...target.map((point) => point.value),
  ];
  const high = Math.max(...values);
  const span = high - Math.min(...values) || 1;
  const at = (point: { day: number; value: number }): Spot => ({
    x: (point.day / to) * PLOT.width,
    y: ((high - point.value) / span) * PLOT.height,
  });
  const dot = at({ day, value });
  const width = label.length * LABEL.char;
  const line = points.map(at);
  const goal = target.map(at);
  const end = goal.at(-1);
  const caption: Box | null =
    input.caption && end
      ? {
          left: PLOT.width - CAPTION.right - CAPTION.width,
          right: PLOT.width - CAPTION.right,
          top: end.y - CAPTION.above - CAPTION.height,
          bottom: end.y - CAPTION.above,
        }
      : null;
  const passes = (path: Spot[], box: Box) =>
    path.some((spot, i) => i > 0 && crosses(path[i - 1], spot, box));
  const free = (runs: "start" | "end", on: "top" | "bottom", away: number) => {
    const left = runs === "start" ? dot.x : dot.x - width;
    const top =
      on === "top" ? dot.y - LABEL.far - away : dot.y + LABEL.near + away;
    const bottom = top + LABEL.far - LABEL.near;
    if (
      left < 0 ||
      left + width > PLOT.width ||
      top < -PLOT.headroom ||
      bottom > PLOT.height
    )
      return false;
    // No margin on the side where the label starts: that is the middle of the
    // point, and a line there is under the point itself.
    const box: Box = {
      left: runs === "start" ? left : left - CLEAR,
      right: runs === "start" ? left + width + CLEAR : left + width,
      top: top - CLEAR,
      bottom: bottom + CLEAR,
    };
    if (
      caption &&
      box.left < caption.right &&
      caption.left < box.right &&
      box.top < caption.bottom &&
      caption.top < box.bottom
    )
      return false;
    return !passes(goal, box) && !passes(line, box);
  };
  const flip = anchor === "start" ? "end" : "start";
  const other = side === "top" ? "bottom" : "top";
  for (const away of AWAY)
    for (const [runs, on] of [
      [anchor, side],
      [anchor, other],
      [flip, side],
      [flip, other],
    ] as const)
      if (free(runs, on, away)) return { anchor: runs, side: on, away };
  return { anchor, side, away: 0 };
}

export function chartLabelPlace(input: {
  day: number;
  to: number;
  // The newest point carries an alert.
  alert: boolean;
  // The newest value minus the one before it; null with a single measurement.
  change: number | null;
  // Only on the chart with a target line.
  around?: LabelSurroundings;
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
  // The caption ends at the right edge and is about 85 px wide: past 60% of
  // the axis the newest point, or its label, would lie under it. The legend
  // below the chart still names the line.
  const targetCaption = day <= 0.6 * to;
  const place: Pick<ChartLabelPlace, "anchor" | "side" | "away"> = input.around
    ? clearPlace({
        day,
        to,
        anchor,
        side,
        caption: targetCaption,
        around: input.around,
      })
    : { anchor, side, away: 0 };
  return {
    ...place,
    // The caption sits in the right quarter of the plot: a point there, or
    // its label, would lie on it.
    normalCaption: day <= 0.7 * to,
    // An alert label is long enough to reach the corner caption.
    highCaption: !(alert && place.anchor === "end" && place.side === "top"),
    targetCaption,
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
