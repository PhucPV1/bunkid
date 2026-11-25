import type { LmsRow, WhoIndicator, WhoSex } from "@/lib/content/who";
import { formatDayShort } from "./days";
import { ageOnDay, lmsAt, percentile, zScore } from "./growth";
import {
  comparePhrase,
  formatGrowthValue,
  type GrowthInput,
  INDICATORS,
  indicatorValue,
  sexLabel,
} from "./growthForm";
import { formatAgeVi } from "./time";

// Spec 2026-11-25 §5.1.
export type GrowthAlertKind =
  "veryLow" | "veryHigh" | "loss" | "falling" | "rising" | "low" | "high";
export type GrowthAlertLevel = "yellow" | "red";

export type GrowthAlert = {
  indicator: WhoIndicator;
  kind: GrowthAlertKind;
  level: GrowthAlertLevel;
  title: string;
  body: string;
  advice: string;
  chip: string;
  // measured_on of the measurement the alert is about.
  measuredOn: string;
  // falling and rising: the percentile of the measurement it is compared with.
  previousPercentile: number | null;
};

// A table that has not loaded is left out: its indicator gives no alert.
export type GrowthTables = Partial<Record<WhoIndicator, LmsRow[]>>;
export type GrowthMeasure = GrowthInput & { created_at?: string | null };

// One measurement of one indicator, placed on its WHO table.
export type Reading = {
  day: string;
  ageDays: number;
  value: number;
  z: number;
  // The table's median on that day, in the table's unit.
  median: number;
};

// Two percentile bands (0,67 z each).
export const SHIFT_Z = 1.33;
export const COMPARE_MIN_DAYS = 14;
export const COMPARE_MAX_DAYS = 183;
export const LOSS_MIN_AGE_DAYS = 14;
// z comes out of floating-point division: 1.33 must not read as 1.3299999.
const EPSILON = 1e-9;

export const ALERT_CHIP: Record<GrowthAlertKind, string> = {
  veryLow: "Rất thấp",
  veryHigh: "Rất cao",
  loss: "Giảm cân",
  falling: "Tăng chậm",
  rising: "Tăng nhanh",
  low: "Thấp",
  high: "Cao",
};

const ASK = "Nên hỏi bác sĩ ở lần khám tới.";
const GO = "Nên cho bé đi khám.";

const TITLE = Object.fromEntries(
  INDICATORS.map((item) => [item.key, item.title]),
) as Record<WhoIndicator, string>;

const whole = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 1,
});
const tenth = (n: number) => Math.round(n * 10) / 10;

// The measurements of one indicator that fall inside the WHO table, newest
// first: by measured_on, then created_at; rows with neither keep their order.
export function readings(
  rows: GrowthMeasure[],
  table: LmsRow[],
  dob: string,
  indicator: WhoIndicator,
): Reading[] {
  return rows
    .map((row, index) => ({ row, index }))
    .sort(
      (a, b) =>
        b.row.measured_on.localeCompare(a.row.measured_on) ||
        (b.row.created_at ?? "").localeCompare(a.row.created_at ?? "") ||
        a.index - b.index,
    )
    .flatMap(({ row }): Reading[] => {
      const value = indicatorValue(row, indicator);
      if (value === null || !(value > 0)) return [];
      const ageDays = ageOnDay(dob, row.measured_on);
      const lms = lmsAt(table, ageDays);
      if (!lms) return [];
      return [
        {
          day: row.measured_on,
          ageDays,
          value,
          z: zScore(lms, value),
          median: lms.m,
        },
      ];
    });
}

// Where a z-score sits against the ±2 and ±3 lines; null inside ±2.
export function positionKind(
  z: number,
): "veryLow" | "low" | "high" | "veryHigh" | null {
  if (z < -3) return "veryLow";
  if (z > 3) return "veryHigh";
  if (z < -2) return "low";
  if (z > 2) return "high";
  return null;
}

type Found = { kind: GrowthAlertKind; compared: Reading | null };

function findAlert(indicator: WhoIndicator, list: Reading[]): Found | null {
  const [latest, ...older] = list;
  const position = positionKind(latest.z);
  if (position === "veryLow" || position === "veryHigh")
    return { kind: position, compared: null };

  const apart = (reading: Reading) => latest.ageDays - reading.ageDays;
  if (indicator === "wfa") {
    // `older` is newest first, so this is the nearest reading far enough back.
    const before = older.find(
      (reading) =>
        apart(reading) >= COMPARE_MIN_DAYS &&
        reading.ageDays >= LOSS_MIN_AGE_DAYS,
    );
    if (before && latest.value < before.value)
      return { kind: "loss", compared: before };
  }

  const window = older.filter(
    (reading) =>
      apart(reading) >= COMPARE_MIN_DAYS && apart(reading) <= COMPARE_MAX_DAYS,
  );
  // On equal z the newer reading stays: `window` is newest first.
  const highest = window.reduce<Reading | null>(
    (best, reading) => (best === null || reading.z > best.z ? reading : best),
    null,
  );
  if (highest && highest.z - latest.z >= SHIFT_Z - EPSILON)
    return { kind: "falling", compared: highest };
  if (indicator === "hcfa") {
    const lowest = window.reduce<Reading | null>(
      (best, reading) => (best === null || reading.z < best.z ? reading : best),
      null,
    );
    if (lowest && latest.z - lowest.z >= SHIFT_Z - EPSILON)
      return { kind: "rising", compared: lowest };
  }

  return position ? { kind: position, compared: null } : null;
}

function describe(
  indicator: WhoIndicator,
  found: Found,
  latest: Reading,
  ctx: { dob: string; sex: WhoSex; babyName: string },
): Pick<GrowthAlert, "title" | "body" | "advice"> {
  const name = TITLE[indicator];
  const value = formatGrowthValue(indicator, latest.value);
  const age = formatAgeVi(ctx.dob, new Date(`${latest.day}T05:00:00Z`));
  const plain = `${value} lúc ${age}.`;
  const { kind, compared } = found;

  if (kind === "veryLow" || kind === "veryHigh") {
    const side = kind === "veryLow" ? "thấp" : "cao";
    return {
      title: `${name} ${side} hơn chuẩn nhiều`,
      body: `${value} lúc ${age}, ${side} hơn gần như mọi ${sexLabel(ctx.sex)} cùng tuổi.`,
      advice: GO,
    };
  }
  if (kind === "low" || kind === "high")
    return {
      title: `${name} ${kind === "low" ? "thấp" : "cao"} hơn chuẩn`,
      body: `${plain} ${comparePhrase(indicator, percentile(latest.z), ctx.sex, latest.ageDays)}.`,
      advice: ASK,
    };
  if (kind === "loss" && compared)
    return {
      title: "Cân nặng giảm",
      body: `${ctx.babyName} nhẹ hơn ${whole.format(Math.round((compared.value - latest.value) * 1000))} g so với lần đo ${formatDayShort(compared.day)}.`,
      advice: ASK,
    };

  const title =
    kind === "rising" ? "Vòng đầu tăng nhanh" : `${name} tăng chậm lại`;
  if (!compared) return { title, body: plain, advice: ASK };
  const days = latest.ageDays - compared.ageDays;
  if (indicator === "wfa") {
    const gain = Math.round((latest.value - compared.value) * 1000);
    // The copy says "tăng": a measurement that did not go up has no such line.
    if (gain <= 0) return { title, body: plain, advice: ASK };
    const usual = Math.round(((latest.median - compared.median) * 1000) / days);
    return {
      title,
      body: `${ctx.babyName} tăng ${whole.format(gain)} g trong ${days} ngày, khoảng ${whole.format(Math.round(gain / days))} g mỗi ngày. Bé cùng tuổi thường tăng khoảng ${whole.format(usual)} g mỗi ngày.`,
      advice: ASK,
    };
  }
  const gain = tenth(latest.value - compared.value);
  if (gain <= 0) return { title, body: plain, advice: ASK };
  return {
    title,
    body: `${ctx.babyName} tăng ${oneDecimal.format(gain)} cm trong ${days} ngày. Bé cùng tuổi thường tăng khoảng ${oneDecimal.format(tenth(latest.median - compared.median))} cm trong cùng thời gian.`,
    advice: ASK,
  };
}

// At most one alert per indicator, for its newest measurement only. Red ones
// come first, then weight, length, head.
export function growthAlerts(input: {
  rows: GrowthMeasure[];
  tables: GrowthTables;
  dob: string;
  sex: WhoSex;
  babyName: string;
}): GrowthAlert[] {
  const alerts = INDICATORS.flatMap(({ key }): GrowthAlert[] => {
    const table = input.tables[key];
    if (!table) return [];
    const list = readings(input.rows, table, input.dob, key);
    if (list.length === 0) return [];
    const found = findAlert(key, list);
    if (!found) return [];
    const [latest] = list;
    return [
      {
        indicator: key,
        kind: found.kind,
        level:
          found.kind === "veryLow" || found.kind === "veryHigh"
            ? "red"
            : "yellow",
        ...describe(key, found, latest, input),
        chip: ALERT_CHIP[found.kind],
        measuredOn: latest.day,
        previousPercentile:
          (found.kind === "falling" || found.kind === "rising") &&
          found.compared
            ? percentile(found.compared.z)
            : null,
      },
    ];
  });
  return [
    ...alerts.filter((alert) => alert.level === "red"),
    ...alerts.filter((alert) => alert.level === "yellow"),
  ];
}

export type GrowthTone = "good" | "warn" | "danger";

export const alertTone = (level: GrowthAlertLevel): "warn" | "danger" =>
  level === "red" ? "danger" : "warn";

// Spec 2026-11-25 §3.4: the chip on the growth card of the Sức khỏe page.
export function growthStatus(alerts: GrowthAlert[]): {
  text: string;
  tone: GrowthTone;
} {
  if (alerts.some((alert) => alert.level === "red"))
    return { text: "Nên đi khám", tone: "danger" };
  if (alerts.length > 0) return { text: "Cần chú ý", tone: "warn" };
  return { text: "Lớn đều", tone: "good" };
}

const REASON_POSITION =
  "App so số đo của bé với chuẩn tăng trưởng của WHO cho trẻ cùng tuổi, cùng giới. Số đo này nằm ngoài vùng của 95 trong 100 bé khỏe mạnh. Có bé vẫn khỏe dù nằm ngoài vùng này, nên bác sĩ là người kết luận.";
const REASON_SHIFT =
  "App so vị trí của bé trên biểu đồ WHO giữa các lần đo trong 6 tháng gần đây. Vị trí đã đổi hai dải trở lên. Đo lệch tay cũng có thể gây ra điều này, nên hãy đo lại rồi hỏi bác sĩ.";
const REASON_LOSS =
  "Sau hai tuần đầu, cân nặng của bé thường chỉ tăng. Lần cân này thấp hơn lần trước. Cân khác nhau hoặc cân lúc bé vừa bú cũng có thể gây lệch, nên hãy cân lại rồi hỏi bác sĩ.";

// Spec 2026-11-25 §5.3: the one paragraph of the popup "Vì sao có cảnh báo này?".
export function alertReason(kind: GrowthAlertKind): string {
  if (kind === "loss") return REASON_LOSS;
  return kind === "falling" || kind === "rising"
    ? REASON_SHIFT
    : REASON_POSITION;
}
