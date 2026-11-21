import type { VaccineDose } from "@/lib/content/vaccineSchema";
import { addDays, addMonths, vnDayStartMs } from "./days";

// vaccine_choices[group] = series code, or NOT_TAKING when the family skips that group.
export const NOT_TAKING = "none";

export type DoseRecord = {
  vaccine_code: string;
  dose_no: number;
  status: "done" | "skipped" | "rescheduled";
  given_on: string | null;
  due_on_override: string | null;
};

export type DoseState = "overdue" | "upcoming" | "done" | "skipped" | "later";

export type ScheduleItem = {
  dose: VaccineDose;
  due: string;
  state: DoseState;
  record: DoseRecord | null;
  // Group has no chosen series yet: listed with "Chưa chọn loại", never reminded.
  unchosen: boolean;
  // Still open after the product's age limit (e.g. rotavirus): ask a doctor.
  pastMaxAge: boolean;
};

export const UPCOMING_DAYS = 30;

export const STATE_SECTIONS: { state: DoseState; title: string }[] = [
  { state: "overdue", title: "Quá hạn" },
  { state: "upcoming", title: "Sắp tới (≤ 30 ngày)" },
  { state: "done", title: "Đã tiêm" },
  { state: "skipped", title: "Đã bỏ qua" },
  { state: "later", title: "Sau này" },
];

export function visibleDoses(
  doses: VaccineDose[],
  choices: Record<string, string>,
): { dose: VaccineDose; unchosen: boolean }[] {
  const known = new Set(doses.map((d) => `${d.group}/${d.series}`));
  return doses.flatMap((dose): { dose: VaccineDose; unchosen: boolean }[] => {
    if (!dose.group) return [{ dose, unchosen: false }];
    const chosen = choices[dose.group];
    // A stored choice that names no known series (old content) counts as unchosen.
    if (
      chosen === undefined ||
      (chosen !== NOT_TAKING && !known.has(`${dose.group}/${chosen}`))
    )
      return [{ dose, unchosen: true }];
    return chosen === dose.series ? [{ dose, unchosen: false }] : [];
  });
}

const key = (code: string, doseNo: number) => `${code}#${doseNo}`;
const later = (a: string, b: string) => (a > b ? a : b);

// Ages in vaccines.vi.json are written with 30-day months (60 = 2 months, 360 =
// 12 months). Whole months are applied on the calendar, so a 12-month dose falls
// on the first birthday rather than 5 days before it; any other value (weeks, or
// a few days past a birthday) stays a day count.
export function ageDate(dob: string, days: number): string {
  return days > 0 && days % 30 === 0
    ? addMonths(dob, days / 30)
    : addDays(dob, days);
}

// Spec §6.8: due = override, else max(dob + recommended age, P + min interval),
// where P is the previous dose's given_on when it was given on a known day,
// otherwise the previous dose's own due date.
export function dueDates(
  doses: VaccineDose[],
  dob: string,
  records: DoseRecord[],
): Map<string, string> {
  const byKey = new Map(
    records.map((r) => [key(r.vaccine_code, r.dose_no), r]),
  );
  const sorted = [...doses].sort(
    (a, b) => a.code.localeCompare(b.code) || a.doseNo - b.doseNo,
  );
  const due = new Map<string, string>();
  for (const dose of sorted) {
    const record = byKey.get(key(dose.code, dose.doseNo));
    if (record?.due_on_override) {
      due.set(key(dose.code, dose.doseNo), record.due_on_override);
      continue;
    }
    let date = ageDate(dob, dose.recommendedAgeDays);
    const prevKey = key(dose.code, dose.doseNo - 1);
    const prevDue = due.get(prevKey);
    if (dose.minIntervalDaysFromPrev !== undefined && prevDue !== undefined) {
      const prev = byKey.get(prevKey);
      const anchor =
        prev?.status === "done" && prev.given_on ? prev.given_on : prevDue;
      date = later(date, addDays(anchor, dose.minIntervalDaysFromPrev));
    }
    due.set(key(dose.code, dose.doseNo), date);
  }
  return due;
}

export function buildSchedule(input: {
  doses: VaccineDose[];
  choices: Record<string, string>;
  dob: string;
  records: DoseRecord[];
  today: string;
}): ScheduleItem[] {
  const { doses, choices, dob, records, today } = input;
  const visible = visibleDoses(doses, choices);
  const due = dueDates(
    visible.map((v) => v.dose),
    dob,
    records,
  );
  const byKey = new Map(
    records.map((r) => [key(r.vaccine_code, r.dose_no), r]),
  );
  const soon = addDays(today, UPCOMING_DAYS);
  return visible
    .map(({ dose, unchosen }) => {
      const record = byKey.get(key(dose.code, dose.doseNo)) ?? null;
      const date = due.get(key(dose.code, dose.doseNo)) as string;
      const state: DoseState =
        record?.status === "done"
          ? "done"
          : record?.status === "skipped"
            ? "skipped"
            : date < today
              ? "overdue"
              : date <= soon
                ? "upcoming"
                : "later";
      const open = state !== "done" && state !== "skipped";
      // An overdue dose is given today at the earliest, so today counts too: a dose
      // that was due inside the limit but is still open after it is flagged as well.
      const pastMaxAge =
        open &&
        dose.maxAgeDays !== undefined &&
        later(date, today) > ageDate(dob, dose.maxAgeDays);
      return { dose, due: date, state, record, unchosen, pastMaxAge };
    })
    .sort(
      (a, b) =>
        a.due.localeCompare(b.due) ||
        a.dose.code.localeCompare(b.dose.code) ||
        a.dose.doseNo - b.dose.doseNo,
    );
}

// Spec 2026-11-19 §7: the dose to deal with first. `items` comes sorted by due
// date, so this is the first open dose of a chosen series. A dose past the
// product's age limit is passed over, as in pushSelection.ts.
export function nextDose(items: ScheduleItem[]): ScheduleItem | null {
  return (
    items.find(
      (item) =>
        !item.unchosen &&
        !item.pastMaxAge &&
        (item.state === "overdue" ||
          item.state === "upcoming" ||
          item.state === "later"),
    ) ?? null
  );
}

const DAY_MS = 86_400_000;

// Spec 2026-11-19 §7: the label of the "cần làm trước" card. The count is the
// calendar days between `due` and `today`, both Vietnam days.
export function nextDoseLabel(
  item: ScheduleItem,
  today: string,
): { text: string; overdue: boolean } {
  const days = Math.round(
    Math.abs(vnDayStartMs(item.due) - vnDayStartMs(today)) / DAY_MS,
  );
  if (item.state === "overdue")
    return { text: `Quá hạn ${days} ngày`, overdue: true };
  if (item.state === "upcoming")
    return {
      text: days === 0 ? "Sắp tới · hôm nay" : `Sắp tới · còn ${days} ngày`,
      overdue: false,
    };
  return { text: "Mũi tiếp theo", overdue: false };
}
