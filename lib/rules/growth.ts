import type { LmsRow } from "@/lib/content/who";

export type { LmsRow };
export type Lms = { l: number; m: number; s: number };
export type GrowthLevel = "green" | "yellow" | "red";

const DAY_MS = 86_400_000;

// Spec 2026-11-25 §5.4: the edges of the normal band and its median. The
// band ends where rateZ starts to warn.
export const BAND_LINES = [
  { label: "low", z: -2 },
  { label: "mid", z: 0 },
  { label: "high", z: 2 },
] as const;

export function lmsAt(rows: LmsRow[], day: number): Lms | null {
  const row = Number.isInteger(day) ? rows[day] : undefined;
  if (!row || row[0] !== day) return null;
  return { l: row[1], m: row[2], s: row[3] };
}

// z = ((X / M)^L − 1) / (L · S); when L = 0, z = ln(X / M) / S.
export function zScore(lms: Lms, x: number): number {
  if (lms.l === 0) return Math.log(x / lms.m) / lms.s;
  return ((x / lms.m) ** lms.l - 1) / (lms.l * lms.s);
}

// Inverse of zScore: the measurement at a given z (for the percentile lines).
export function valueAtZ(lms: Lms, z: number): number {
  if (lms.l === 0) return lms.m * Math.exp(lms.s * z);
  return lms.m * (1 + lms.l * lms.s * z) ** (1 / lms.l);
}

// Spec 2026-11-25 §5.6: the norm in numbers, on one day of age: the two edges
// of the normal band and its median.
export function standardRange(lms: Lms): {
  low: number;
  mid: number;
  high: number;
} {
  return { low: valueAtZ(lms, -2), mid: lms.m, high: valueAtZ(lms, 2) };
}

// Standard normal CDF via erf (Abramowitz & Stegun 7.1.26, error < 1.5e-7).
export function normalCdf(z: number): number {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const poly =
    t *
    (0.254829592 +
      t *
        (-0.284496736 +
          t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erf = 1 - poly * Math.exp(-x * x);
  return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

export function percentile(z: number): number {
  return normalCdf(z) * 100;
}

export function rateZ(z: number): { level: GrowthLevel; text: string | null } {
  const size = Math.abs(z);
  if (size <= 2) return { level: "green", text: null };
  if (size <= 3)
    return { level: "yellow", text: "Nên hỏi bác sĩ ở lần khám tới" };
  return { level: "red", text: "Nên cho bé đi khám" };
}

// Spec §7.3: the table is read at the age on the measurement day, not today.
export function ageOnDay(dob: string, day: string): number {
  return Math.round(
    (Date.parse(`${day}T00:00:00Z`) - Date.parse(`${dob}T00:00:00Z`)) / DAY_MS,
  );
}

export type Assessment = {
  ageDays: number;
  z: number;
  percentile: number;
  level: GrowthLevel;
  text: string | null;
};

export function assess(
  rows: LmsRow[],
  dob: string,
  measuredOn: string,
  value: number,
): Assessment | null {
  const days = ageOnDay(dob, measuredOn);
  const lms = lmsAt(rows, days);
  if (!lms || !(value > 0)) return null;
  const z = zScore(lms, value);
  return { ageDays: days, z, percentile: percentile(z), ...rateZ(z) };
}

export type CurvePoint = { day: number } & Record<
  (typeof BAND_LINES)[number]["label"],
  number
>;

export function curve(
  rows: LmsRow[],
  fromDay: number,
  toDay: number,
  step: number,
): CurvePoint[] {
  const points: CurvePoint[] = [];
  const every = Math.max(1, Math.floor(step));
  for (let day = Math.max(0, fromDay); day <= toDay; day += every) {
    const lms = lmsAt(rows, day);
    if (!lms) break;
    const point = { day } as CurvePoint;
    for (const line of BAND_LINES) point[line.label] = valueAtZ(lms, line.z);
    points.push(point);
  }
  return points;
}
