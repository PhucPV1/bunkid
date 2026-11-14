import { z } from "zod";
import type { VaccineGroup } from "@/lib/content/vaccineSchema";
import { WEEKDAYS } from "./days";
import { NOT_TAKING, type DoseRecord, type ScheduleItem } from "./vaccines";

export const doseKey = (code: string, doseNo: number) => `${code}#${doseNo}`;

// babies.vaccine_choices is free-form jsonb: anything that is not a
// { group: series } map of strings counts as "nothing chosen yet".
export function parseChoices(value: unknown): Record<string, string> {
  const parsed = z.record(z.string(), z.string()).safeParse(value);
  return parsed.success ? parsed.data : {};
}

// Keeps only known groups with a known series (or NOT_TAKING); "" means unset.
export function cleanChoices(
  groups: VaccineGroup[],
  draft: Record<string, string>,
): Record<string, string> {
  const clean: Record<string, string> = {};
  for (const group of groups) {
    const value = draft[group.code];
    if (
      value === NOT_TAKING ||
      group.series.some((series) => series.code === value)
    )
      clean[group.code] = value;
  }
  return clean;
}

export function toDoseRecords(
  rows: {
    vaccine_code: string;
    dose_no: number;
    status: string;
    given_on: string | null;
    due_on_override: string | null;
  }[],
): DoseRecord[] {
  return rows.flatMap((row): DoseRecord[] =>
    row.status === "done" ||
    row.status === "skipped" ||
    row.status === "rescheduled"
      ? [
          {
            vaccine_code: row.vaccine_code,
            dose_no: row.dose_no,
            status: row.status,
            given_on: row.given_on,
            due_on_override: row.due_on_override,
          },
        ]
      : [],
  );
}

export function formatDueDate(day: string): string {
  const [year, month, date] = day.split("-");
  const weekday = WEEKDAYS[new Date(`${day}T00:00:00Z`).getUTCDay()];
  return `${weekday}, ${date}/${month}/${year}`;
}

// Spec §6.1: newborn doses are ticked by default in the quick-tick list.
export const DEFAULT_TICKED = ["bcg#1", "hepb_birth#1"];

// Doses already past due whose series is known: the ones a parent can tick as given.
export function quickTickCandidates(items: ScheduleItem[]): ScheduleItem[] {
  return items.filter((item) => item.state === "overdue" && !item.unchosen);
}

export type DoseAction = "done" | "skipped" | "rescheduled";

export type DoseFormRaw = {
  action: DoseAction;
  date: string;
  place: string;
  note: string;
};

export type DosePatch = {
  status: DoseAction;
  given_on: string | null;
  due_on_override: string | null;
  place: string | null;
  note: string | null;
};

export function parseDoseForm(
  raw: DoseFormRaw,
  ctx: { dob: string; today: string },
): { ok: true; value: DosePatch } | { ok: false; message: string } {
  const place = raw.place.trim();
  const note = raw.note.trim();
  if (place.length > 120)
    return { ok: false, message: "Nơi tiêm tối đa 120 ký tự." };
  if (note.length > 500)
    return { ok: false, message: "Ghi chú tối đa 500 ký tự." };
  const base = { place: place || null, note: note || null };
  if (raw.action === "skipped")
    return {
      ok: true,
      value: {
        status: "skipped",
        given_on: null,
        due_on_override: null,
        ...base,
      },
    };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw.date))
    return {
      ok: false,
      message: raw.action === "done" ? "Chọn ngày tiêm." : "Chọn ngày hẹn mới.",
    };
  if (raw.action === "done") {
    if (raw.date < ctx.dob || raw.date > ctx.today)
      return {
        ok: false,
        message: "Ngày tiêm phải từ ngày sinh đến hôm nay.",
      };
    return {
      ok: true,
      value: {
        status: "done",
        given_on: raw.date,
        due_on_override: null,
        ...base,
      },
    };
  }
  if (raw.date < ctx.today)
    return { ok: false, message: "Ngày hẹn mới phải từ hôm nay trở đi." };
  return {
    ok: true,
    value: {
      status: "rescheduled",
      given_on: null,
      due_on_override: raw.date,
      ...base,
    },
  };
}
