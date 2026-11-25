import type { WhoIndicator, WhoSex } from "@/lib/content/who";

export type GrowthFormRaw = {
  measuredOn: string;
  weightKg: string;
  lengthCm: string;
  headCm: string;
};

export type GrowthInput = {
  measured_on: string;
  weight_g: number | null;
  length_cm: number | null;
  head_cm: number | null;
};

type Errors = Partial<Record<keyof GrowthFormRaw, string>>;

// Vietnamese keyboards type "4,35"; both "," and "." are accepted.
function decimal(raw: string): number | null | "bad" {
  const text = raw.trim().replace(",", ".");
  if (text === "") return null;
  if (!/^\d+(\.\d+)?$/.test(text)) return "bad";
  return Number(text);
}

const RANGES = {
  weightKg: { min: 0.3, max: 40, message: "Cân nặng từ 0,3 đến 40 kg." },
  lengthCm: { min: 20, max: 130, message: "Chiều dài từ 20 đến 130 cm." },
  headCm: { min: 20, max: 60, message: "Vòng đầu từ 20 đến 60 cm." },
} as const;

export function parseGrowthForm(
  raw: GrowthFormRaw,
  ctx: { dob: string; today: string },
): { ok: true; value: GrowthInput } | { ok: false; errors: Errors } {
  const errors: Errors = {};
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(raw.measuredOn) ||
    raw.measuredOn < ctx.dob ||
    raw.measuredOn > ctx.today
  )
    errors.measuredOn = "Ngày đo phải từ ngày sinh đến hôm nay.";
  const values: Partial<Record<keyof typeof RANGES, number | null>> = {};
  for (const key of Object.keys(RANGES) as (keyof typeof RANGES)[]) {
    const n = decimal(raw[key]);
    const range = RANGES[key];
    if (n === "bad" || (n !== null && (n < range.min || n > range.max)))
      errors[key] = range.message;
    else values[key] = n;
  }
  if (
    !errors.weightKg &&
    !errors.lengthCm &&
    !errors.headCm &&
    values.weightKg == null &&
    values.lengthCm == null &&
    values.headCm == null
  )
    errors.weightKg = "Nhập ít nhất một số đo.";
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  const oneDecimal = (n: number | null | undefined) =>
    n == null ? null : Math.round(n * 10) / 10;
  return {
    ok: true,
    value: {
      measured_on: raw.measuredOn,
      weight_g:
        values.weightKg == null ? null : Math.round(values.weightKg * 1000),
      length_cm: oneDecimal(values.lengthCm),
      head_cm: oneDecimal(values.headCm),
    },
  };
}

const comma = (n: number) => String(n).replace(".", ",");

export function growthToRaw(row: GrowthInput): GrowthFormRaw {
  return {
    measuredOn: row.measured_on,
    weightKg: row.weight_g === null ? "" : comma(row.weight_g / 1000),
    lengthCm: row.length_cm === null ? "" : comma(row.length_cm),
    headCm: row.head_cm === null ? "" : comma(row.head_cm),
  };
}

const decimals = (digits: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: digits });

export function formatGrowthValue(
  indicator: WhoIndicator,
  value: number,
): string {
  return indicator === "wfa"
    ? `${decimals(2).format(value)} kg`
    : `${decimals(1).format(value)} cm`;
}

export function formatPercentile(p: number): string {
  if (p < 0.1) return "dưới P0,1";
  if (p > 99.9) return "trên P99,9";
  return `P${decimals(1).format(p)}`;
}

export const sexLabel = (sex: WhoSex) =>
  sex === "girls" ? "bé gái" : "bé trai";

export const INDICATORS: {
  key: WhoIndicator;
  title: string;
  column: "weight_g" | "length_cm" | "head_cm";
}[] = [
  { key: "wfa", title: "Cân nặng", column: "weight_g" },
  { key: "lhfa", title: "Chiều dài", column: "length_cm" },
  { key: "hcfa", title: "Vòng đầu", column: "head_cm" },
];

// The value the WHO table expects: kg for weight, cm for the others.
export function indicatorValue(
  row: GrowthInput,
  indicator: WhoIndicator,
): number | null {
  if (indicator === "wfa")
    return row.weight_g === null ? null : row.weight_g / 1000;
  return indicator === "lhfa" ? row.length_cm : row.head_cm;
}

export type LatestGrowth = {
  measuredOn: string;
  weightG: number | null;
  lengthCm: number | null;
  headCm: number | null;
};

// Spec 2026-11-25 §3.4: the day of the newest measurement and, for each
// indicator, its newest value. On the same day the first row wins.
export function latestGrowth(rows: GrowthInput[]): LatestGrowth | null {
  if (rows.length === 0) return null;
  const sorted = [...rows].sort((a, b) =>
    b.measured_on.localeCompare(a.measured_on),
  );
  const newest = (column: "weight_g" | "length_cm" | "head_cm") =>
    sorted.find((row) => row[column] !== null)?.[column] ?? null;
  return {
    measuredOn: sorted[0].measured_on,
    weightG: newest("weight_g"),
    lengthCm: newest("length_cm"),
    headCm: newest("head_cm"),
  };
}

export function latestWeightG(rows: GrowthInput[]): number | null {
  const withWeight = rows.filter((r) => r.weight_g !== null);
  withWeight.sort((a, b) => b.measured_on.localeCompare(a.measured_on));
  return withWeight[0]?.weight_g ?? null;
}

// Chart x range in days: at least the first year, and two months past today.
export function chartRange(ageNow: number): { to: number; step: number } {
  const to = Math.min(1856, Math.max(365, Math.ceil((ageNow + 60) / 30) * 30));
  return { to, step: to > 730 ? 30 : 7 };
}
