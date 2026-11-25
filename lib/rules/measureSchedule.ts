import { WHO_LAST_DAY } from "@/lib/content/who";
import { addDays, vnDayStartMs } from "./days";

const DAY_MS = 86_400_000;

// Whole days from one calendar day to another.
export function daysBetween(from: string, to: string): number {
  return Math.round((vnDayStartMs(to) - vnDayStartMs(from)) / DAY_MS);
}

// The greatest of the days given ("YYYY-MM-DD"), or null with none.
export function latestDay(days: string[]): string | null {
  return days.reduce<string | null>(
    (latest, day) => (latest === null || day > latest ? day : latest),
    null,
  );
}

export type MeasureDue = {
  // Days between two measurements at the baby's age today.
  interval: 30 | 90;
  due: string;
  measureDue: boolean;
};

// Spec 2026-11-25 §8.3: a baby under one year is measured every 30 days, an
// older child every 90, counted from the last measurement (from the day of
// birth when there is none). Past the last day of the WHO tables nothing is due.
export function nextMeasureDue(input: {
  dob: string;
  lastMeasuredOn: string | null;
  today: string;
}): MeasureDue {
  const age = daysBetween(input.dob, input.today);
  const interval = age < 365 ? 30 : 90;
  const due = addDays(input.lastMeasuredOn ?? input.dob, interval);
  return {
    interval,
    due,
    measureDue: input.today >= due && age <= WHO_LAST_DAY,
  };
}
