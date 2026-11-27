import { TRIAGE } from "@/lib/content/triage";
import { addDays, formatDayShort } from "./days";
import type { EpisodeLike } from "./illness";
import { detailsSchemas } from "./logDetails";
import type { LogPatch } from "./logForm";
import { joinCodes, parseCodes } from "./symptomForm";
import { vnDateString } from "./time";

// Spec 2026-11-27: symptoms are recorded per Vietnam day. A day has one
// symptom log per person who may change it; every reader merges by day.

// The fields of a log row these rules read (a LogRow fits).
export type SymptomLog = {
  id: string;
  type: string;
  started_at: string;
  ended_at: string | null;
  details: unknown;
  note: string | null;
  created_by: string;
};

export type SymptomDay = {
  // "YYYY-MM-DD", a Vietnam day.
  day: string;
  // The valid symptom logs of the day, oldest first.
  logs: SymptomLog[];
  // The part of `logs` the viewer may change.
  own: SymptomLog[];
  // Codes in a log the viewer may not change, in the content's order.
  locked: string[];
  // Every code of the day, once each, in the content's order.
  codes: string[];
  // The notes of `own`, joined by " · ", empty notes left out.
  ownNote: string;
  // The notes of the logs the viewer may not change.
  otherNotes: string[];
};

export type SymptomOp =
  | { op: "insert"; patch: LogPatch }
  | { op: "update"; id: string; patch: LogPatch }
  | { op: "delete"; id: string };

export const NOTE_TOO_LONG = "Ghi chú dài quá 200 ký tự";
// Same limit as detailsSchemas.symptom (zod counts UTF-16 units).
const NOTE_MAX = 200;

const ordered = (codes: readonly string[]) =>
  parseCodes(joinCodes(codes, TRIAGE.symptoms));

function parsed(log: SymptomLog) {
  if (log.type !== "symptom") return null;
  const result = detailsSchemas.symptom.safeParse(log.details);
  return result.success ? result.data : null;
}

// Spec §3.1. `canModify` says whether the viewer may change a log made by
// `createdBy` (canModifyLog: the owner every log, a member their own).
export function symptomDay(
  logs: readonly SymptomLog[],
  day: string,
  canModify: (createdBy: string) => boolean,
): SymptomDay {
  const valid = logs
    .filter((log) => parsed(log) !== null)
    .filter((log) => vnDateString(new Date(log.started_at)) === day)
    .sort(
      (a, b) =>
        Date.parse(a.started_at) - Date.parse(b.started_at) ||
        a.id.localeCompare(b.id),
    );
  const own = valid.filter((log) => canModify(log.created_by));
  const others = valid.filter((log) => !canModify(log.created_by));
  const codesOf = (log: SymptomLog) => parsed(log)?.codes ?? [];
  const noteOf = (log: SymptomLog) => parsed(log)?.note ?? "";
  return {
    day,
    logs: valid,
    own,
    locked: ordered(others.flatMap(codesOf)),
    codes: ordered(valid.flatMap(codesOf)),
    ownNote: own.map(noteOf).filter(Boolean).join(" · "),
    otherNotes: others.map(noteOf).filter(Boolean),
  };
}

const sameSet = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((code) => b.includes(code));

// Spec §3.2: what Lưu does to the day. `picked` is every chip switched on,
// locked ones included; `note` is the note field as typed.
export function symptomDaySave(input: {
  day: SymptomDay;
  picked: readonly string[];
  note: string;
  today: string;
  now: Date;
}): { ok: true; ops: SymptomOp[] } | { ok: false; message: string } {
  const { day, picked, today, now } = input;
  const note = input.note.trim();
  if (note.length > NOTE_MAX) return { ok: false, message: NOTE_TOO_LONG };
  const ownCodes = ordered(picked.filter((code) => !day.locked.includes(code)));
  const details = note ? { codes: ownCodes, note } : { codes: ownCodes };

  // Spec §7: Lưu never empties a day; that is the delete button's job (the
  // sheet keeps Lưu off without a chip on). Only another's locked chips left
  // on may take the viewer's own part away.
  if (picked.length === 0 && day.locked.length === 0)
    return { ok: true, ops: [] };
  if (ownCodes.length === 0 && day.own.length === 0)
    return { ok: true, ops: [] };
  if (day.own.length === 1) {
    const current = parsed(day.own[0]);
    const theirs = (current?.codes ?? []).filter(
      (code) => !day.locked.includes(code),
    );
    if (sameSet(theirs, ownCodes) && (current?.note ?? "") === note)
      return { ok: true, ops: [] };
  }
  if (ownCodes.length === 0) return { ok: true, ops: symptomDayDelete(day) };
  if (day.own.length === 0) {
    const at =
      day.day === today
        ? now.toISOString()
        : new Date(`${day.day}T12:00:00+07:00`).toISOString();
    return {
      ok: true,
      ops: [
        {
          op: "insert",
          patch: { started_at: at, ended_at: at, details, note: null },
        },
      ],
    };
  }
  const [first, ...rest] = day.own;
  return {
    ok: true,
    ops: [
      {
        op: "update",
        id: first.id,
        patch: {
          started_at: first.started_at,
          ended_at: first.ended_at,
          details,
          note: first.note,
        },
      },
      ...rest.map((log): SymptomOp => ({ op: "delete", id: log.id })),
    ],
  };
}

// Spec §3.3: "Xóa triệu chứng ngày này" deletes every own log of the day.
export function symptomDayDelete(day: SymptomDay): SymptomOp[] {
  return day.own.map((log) => ({ op: "delete", id: log.id }));
}

// Spec §5.2: the delete button shows only when the day has an own log and
// nothing of anyone else's, so the day is empty afterwards.
export function canDeleteDay(day: SymptomDay): boolean {
  return day.own.length > 0 && day.locked.length === 0;
}

export type StripDay = {
  day: string;
  // The bold line: "Ngày 2", "Hôm nay", "Hôm qua", "T2"…"T7", "CN".
  top: string;
  // "dd/MM".
  bottom: string;
};

const WEEKDAY_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const STRIP_DAYS = 7;

// Spec §4.3: the cells of the day strip, oldest first (today is the last
// cell, before "Khác"). `episode` is the baby's open episode, or null. No
// cell is before the day the baby was born.
export function dayStrip(input: {
  episode: EpisodeLike | null;
  today: string;
  dob: string;
}): { label: string; days: StripDay[] } {
  const { episode, today, dob } = input;
  const yesterday = addDays(today, -1);
  if (episode) {
    const first = vnDateString(new Date(episode.started_at));
    const days: StripDay[] = [];
    for (let n = 1, day = first; day <= today; n += 1, day = addDays(day, 1))
      if (day >= dob)
        days.push({
          day,
          top: day === today ? "Hôm nay" : `Ngày ${n}`,
          bottom: formatDayShort(day),
        });
    return { label: `Ngày nào? · đợt ốm từ ${formatDayShort(first)}`, days };
  }
  const days = Array.from({ length: STRIP_DAYS }, (_, i) =>
    addDays(today, i - STRIP_DAYS + 1),
  )
    .filter((day) => day >= dob)
    .map((day) => ({
      day,
      top:
        day === today
          ? "Hôm nay"
          : day === yesterday
            ? "Hôm qua"
            : WEEKDAY_SHORT[new Date(`${day}T00:00:00Z`).getUTCDay()],
      bottom: formatDayShort(day),
    }));
  return { label: "Ngày nào?", days };
}
