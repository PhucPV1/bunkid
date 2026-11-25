import { type LmsRow, WHO_LAST_DAY, type WhoSex } from "@/lib/content/who";
import { formatDayShort } from "./days";
import { curve, type CurvePoint } from "./growth";
import { type GrowthMeasure, readings } from "./growthAlerts";
import { chartRange, formatGrowthValue, sexLabel } from "./growthForm";
import { type ChartView, chartView } from "./growthView";
import {
  formatCm,
  type GoalStatus,
  goalStatus,
  type HeightGoalRaw,
  type LengthVelocity,
  lengthVelocity,
  midParental,
  type ParentalRange,
  parseHeightGoal,
  targetCurve,
  targetVsRange,
  targetZ,
} from "./heightGoal";
import { ageDays, formatAgeVi } from "./time";

const oneDecimal = new Intl.NumberFormat("vi-VN", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

// Spec 2026-11-25 §6.3, item 3: the bar of the card "Di truyền dự kiến".
// `at` is a position along the bar, 0–100.
export type RangeBar = {
  low: { at: number; text: string };
  mid: { at: number; text: string };
  high: { at: number; text: string };
  // Null without a target. Outside the scale it is pinned to the end.
  target: { at: number; text: string } | null;
  // What the bar says to a screen reader.
  label: string;
};

// The scale leaves room either side of the range.
const SCALE_UNDER = 6;
const SCALE_OVER = 7;

export function rangeBar(
  range: ParentalRange,
  target: number | null,
): RangeBar {
  const from = range.low - SCALE_UNDER;
  const span = range.high + SCALE_OVER - from;
  const at = (cm: number) => Math.min(1, Math.max(0, (cm - from) / span)) * 100;
  const mid = oneDecimal.format(range.mid);
  return {
    low: { at: at(range.low), text: String(range.low) },
    mid: { at: at(range.mid), text: mid },
    high: { at: at(range.high), text: String(range.high) },
    target:
      target === null
        ? null
        : { at: at(target), text: `Mục tiêu ${formatCm(target)}` },
    label: `Khoảng dự kiến từ ${range.low} đến ${range.high} cm, giữa là ${mid} cm${
      target === null ? "" : `, mục tiêu ${formatCm(target)} cm`
    }.`,
  };
}

// Spec 2026-11-25 §6.3: everything the Chiều cao page writes, worked out from
// the profile, the measurements and the WHO length table of the baby's sex.
export type HeightView = {
  // Item 2. Null without a target.
  goal: {
    target: string;
    chip: GoalStatus["chip"];
    // "{Tên bé} dài {x} cm lúc {tuổi}. {trạng thái}."
    sentence: string;
  } | null;
  // Item 3. Null until both parents' heights are entered.
  parents: { line: string; bar: RangeBar; sentence: string } | null;
  // Item 4. Null without a target, and past the WHO table.
  path: {
    title: string;
    note: string;
    ariaLabel: string;
    to: number;
    band: CurvePoint[];
    target: { day: number; value: number }[];
    points: ChartView["points"];
    last: ChartView["last"];
  } | null;
  // Item 5. Null without two lengths far enough apart, and past the WHO table.
  velocity: {
    rate: string;
    line: string;
    chip: LengthVelocity["chip"];
  } | null;
  // The baby is older than the WHO table: items 4 and 5 give way to one line.
  beyondTable: boolean;
};

export function heightView(input: {
  baby: {
    name: string;
    dob: string;
    sex: WhoSex;
    father_height_cm: number | null;
    mother_height_cm: number | null;
    target_height_cm: number | null;
  };
  rows: GrowthMeasure[];
  // Length-for-age of the baby's sex.
  table: LmsRow[];
  today: Date;
}): HeightView {
  const { baby, rows, table } = input;
  const target = baby.target_height_cm;
  const ageNow = ageDays(baby.dob, input.today);
  const beyondTable = ageNow > WHO_LAST_DAY;
  const z = target === null ? null : targetZ(target, baby.sex);

  let goal: HeightView["goal"] = null;
  if (target !== null && z !== null) {
    const [reading] = readings(rows, table, baby.dob, "lhfa");
    const status = goalStatus({ reading: reading ?? null, z, table });
    goal = {
      target: formatCm(target),
      chip: status.chip,
      sentence: reading
        ? `${baby.name} dài ${formatGrowthValue("lhfa", reading.value)} lúc ${formatAgeVi(baby.dob, new Date(`${reading.day}T05:00:00Z`))}. ${status.text}.`
        : `${status.text}.`,
    };
  }

  let parents: HeightView["parents"] = null;
  if (baby.father_height_cm !== null && baby.mother_height_cm !== null) {
    const range = midParental(
      baby.father_height_cm,
      baby.mother_height_cm,
      baby.sex,
    );
    const span = `Khoảng dự kiến ${range.low}–${range.high} cm.`;
    parents = {
      line: `Bố ${formatCm(baby.father_height_cm)} cm · Mẹ ${formatCm(baby.mother_height_cm)} cm`,
      bar: rangeBar(range, target),
      sentence:
        target === null ? span : `${span} ${targetVsRange(target, range)}`,
    };
  }

  let path: HeightView["path"] = null;
  if (target !== null && z !== null && !beyondTable) {
    const range = chartRange(ageNow);
    const chart = chartView({
      indicator: "lhfa",
      rows,
      dob: baby.dob,
      alerts: [],
      summaries: [],
    });
    const title = `Đường tới ${formatCm(target)} cm`;
    path = {
      title,
      note: `Đường mục tiêu là chiều dài ở từng tháng tuổi của một ${sexLabel(baby.sex)} sẽ cao ${formatCm(target)} cm khi lớn, nếu giữ nguyên vị trí trên biểu đồ WHO. Dưới 2 tuổi vị trí này còn thay đổi nhiều.`,
      ariaLabel:
        chart.points.length === 0
          ? `${title}. Chưa có lần đo chiều dài.`
          : `${title}. ${chart.points.length} lần đo chiều dài.`,
      to: range.to,
      band: curve(table, 0, range.to, range.step),
      target: targetCurve(table, z, range.to, range.step),
      points: chart.points,
      last: chart.last,
    };
  }

  const speed = beyondTable ? null : lengthVelocity(rows, table, baby.dob);
  return {
    goal,
    parents,
    path,
    velocity: speed && {
      rate: `${speed.rate} cm mỗi tháng`,
      line: `Từ ${formatDayShort(speed.from)} đến ${formatDayShort(speed.to)} · bé cùng tuổi thường tăng khoảng ${speed.expected} cm mỗi tháng`,
      chip: speed.chip,
    },
    beyondTable,
  };
}

// Spec 2026-11-25 §6.5: the box the sheet shows while the heights are typed.
// Null until both parents' heights are valid; a target that is not a valid
// height is left out.
export function goalPreview(
  raw: HeightGoalRaw,
  sex: WhoSex,
): { range: string; target: string | null } | null {
  const parents = parseHeightGoal({ ...raw, target: "" });
  if (
    !parents.ok ||
    parents.value.father_height_cm === null ||
    parents.value.mother_height_cm === null
  )
    return null;
  const range = midParental(
    parents.value.father_height_cm,
    parents.value.mother_height_cm,
    sex,
  );
  const goal = parseHeightGoal({ father: "", mother: "", target: raw.target });
  const target = goal.ok ? goal.value.target_height_cm : null;
  return {
    range: `Khoảng dự kiến ${range.low}–${range.high} cm`,
    target: target === null ? null : targetVsRange(target, range),
  };
}

// Spec 2026-11-25 §6.4: the card on the Tăng trưởng page that opens Chiều cao.
export type GoalLink = {
  title: string;
  // Null while the status cannot be worked out yet.
  detail: string | null;
  // The detail is written in good: the baby is on the target line or above it.
  onTrack: boolean;
};

export function goalLink(input: {
  baby: Parameters<typeof heightView>[0]["baby"];
  // Undefined while they load.
  rows: GrowthMeasure[] | undefined;
  table: LmsRow[] | undefined;
}): GoalLink {
  const { baby, rows, table } = input;
  const target = baby.target_height_cm;
  if (target !== null) {
    const title = `Mục tiêu chiều cao ${formatCm(target)} cm`;
    if (!rows || !table) return { title, detail: null, onTrack: false };
    const [reading] = readings(rows, table, baby.dob, "lhfa");
    const status = goalStatus({
      reading: reading ?? null,
      z: targetZ(target, baby.sex),
      table,
    });
    return {
      title,
      detail: status.text,
      onTrack: status.chip?.tone === "good",
    };
  }
  const title = "Mục tiêu chiều cao";
  if (baby.father_height_cm === null || baby.mother_height_cm === null)
    return {
      title,
      detail: "Nhập chiều cao bố mẹ để xem khoảng dự kiến",
      onTrack: false,
    };
  const range = midParental(
    baby.father_height_cm,
    baby.mother_height_cm,
    baby.sex,
  );
  return {
    title,
    detail: `Chưa đặt mục tiêu · khoảng dự kiến ${range.low}–${range.high} cm`,
    onTrack: false,
  };
}
