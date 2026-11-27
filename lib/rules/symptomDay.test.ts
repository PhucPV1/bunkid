import { describe, expect, it } from "vitest";
import {
  canDeleteDay,
  NOTE_TOO_LONG,
  symptomDay,
  symptomDayDelete,
  symptomDaySave,
  type SymptomLog,
} from "./symptomDay";

const vn = (text: string) => new Date(`${text.replace(" ", "T")}:00+07:00`);
const iso = (text: string) => vn(text).toISOString();

const log = (
  id: string,
  time: string,
  details: unknown,
  createdBy = "me",
): SymptomLog => ({
  id,
  type: "symptom",
  started_at: iso(time),
  ended_at: iso(time),
  details,
  note: null,
  created_by: createdBy,
});
const mine = (createdBy: string) => createdBy === "me";
const owner = () => true;
const NOW = vn("2026-11-27 15:30");
const TODAY = "2026-11-27";

// Spec 2026-11-27 §3.1.
describe("symptomDay", () => {
  const logs = [
    log("b", "2026-11-25 20:00", { codes: ["fussy", "cough"], note: "tối" }),
    log("a", "2026-11-25 08:00", { codes: ["cough", "runny_nose"] }),
    log("c", "2026-11-25 09:00", { codes: ["fever"], note: "bà ghi" }, "ba"),
    log("d", "2026-11-25 10:00", { codes: [] }), // not valid
    log("e", "2026-11-24 23:59", { codes: ["vomit"] }), // the day before
    { ...log("f", "2026-11-25 11:00", { celsius: 38 }), type: "temperature" },
  ];

  it("the valid symptom logs of the Vietnam day, oldest first", () => {
    const day = symptomDay(logs, "2026-11-25", mine);
    expect(day.day).toBe("2026-11-25");
    expect(day.logs.map((l) => l.id)).toEqual(["a", "c", "b"]);
  });

  it("a member: own logs, locked codes of the others, notes kept apart", () => {
    const day = symptomDay(logs, "2026-11-25", mine);
    expect(day.own.map((l) => l.id)).toEqual(["a", "b"]);
    expect(day.locked).toEqual(["fever"]);
    expect(day.codes).toEqual(["fever", "runny_nose", "cough", "fussy"]);
    expect(day.ownNote).toBe("tối");
    expect(day.otherNotes).toEqual(["bà ghi"]);
  });

  it("the owner modifies every log: nothing is locked", () => {
    const day = symptomDay(logs, "2026-11-25", owner);
    expect(day.own.map((l) => l.id)).toEqual(["a", "c", "b"]);
    expect(day.locked).toEqual([]);
    expect(day.ownNote).toBe("bà ghi · tối");
    expect(day.otherNotes).toEqual([]);
  });

  it("a code in both an own log and another's log is locked", () => {
    const both = [
      log("a", "2026-11-25 08:00", { codes: ["cough"] }),
      log("c", "2026-11-25 09:00", { codes: ["cough"] }, "ba"),
    ];
    expect(symptomDay(both, "2026-11-25", mine).locked).toEqual(["cough"]);
  });

  it("a day without symptom logs", () => {
    const day = symptomDay(logs, "2026-11-26", mine);
    expect(day).toEqual({
      day: "2026-11-26",
      logs: [],
      own: [],
      locked: [],
      codes: [],
      ownNote: "",
      otherNotes: [],
    });
  });
});

// Spec 2026-11-27 §3.2.
describe("symptomDaySave", () => {
  const save = (
    logs: SymptomLog[],
    day: string,
    picked: string[],
    note = "",
    canModify: (createdBy: string) => boolean = mine,
  ) =>
    symptomDaySave({
      day: symptomDay(logs, day, canModify),
      picked,
      note,
      today: TODAY,
      now: NOW,
    });

  it("a new day today: one insert at now, ended_at = started_at, no note column", () => {
    expect(save([], TODAY, ["runny_nose", "cough"], "  ho đêm ")).toEqual({
      ok: true,
      ops: [
        {
          op: "insert",
          patch: {
            started_at: NOW.toISOString(),
            ended_at: NOW.toISOString(),
            details: { codes: ["runny_nose", "cough"], note: "ho đêm" },
            note: null,
          },
        },
      ],
    });
  });

  it("a new past day: one insert at 12:00 Vietnam time, codes in the content's order", () => {
    expect(save([], "2026-11-25", ["fussy", "fever"])).toEqual({
      ok: true,
      ops: [
        {
          op: "insert",
          patch: {
            started_at: iso("2026-11-25 12:00"),
            ended_at: iso("2026-11-25 12:00"),
            details: { codes: ["fever", "fussy"] },
            note: null,
          },
        },
      ],
    });
  });

  it("a day with several own logs: update the oldest, keep its times and note column, delete the rest", () => {
    const first = {
      ...log("a", "2026-11-25 08:00", { codes: ["cough"] }),
      note: "cột cũ",
    };
    const logs = [
      first,
      log("b", "2026-11-25 20:00", { codes: ["fussy"], note: "tối" }),
    ];
    expect(
      save(logs, "2026-11-25", ["cough", "fussy", "vomit"], "tối"),
    ).toEqual({
      ok: true,
      ops: [
        {
          op: "update",
          id: "a",
          patch: {
            started_at: first.started_at,
            ended_at: first.ended_at,
            details: { codes: ["cough", "vomit", "fussy"], note: "tối" },
            note: "cột cũ",
          },
        },
        { op: "delete", id: "b" },
      ],
    });
  });

  it("locked codes stay out of what the member saves", () => {
    const logs = [log("c", "2026-11-25 09:00", { codes: ["fever"] }, "ba")];
    const result = save(logs, "2026-11-25", ["fever", "cough"]);
    expect(result.ok && result.ops[0]).toMatchObject({
      op: "insert",
      patch: { details: { codes: ["cough"] } },
    });
  });

  it("only locked chips left: the member's own logs are deleted", () => {
    const logs = [
      log("a", "2026-11-25 08:00", { codes: ["cough"] }),
      log("c", "2026-11-25 09:00", { codes: ["fever"] }, "ba"),
    ];
    expect(save(logs, "2026-11-25", ["fever"])).toEqual({
      ok: true,
      ops: [{ op: "delete", id: "a" }],
    });
  });

  it("nothing changed: no operation (codes compared as a set, locked codes left out)", () => {
    const logs = [
      log("a", "2026-11-25 08:00", {
        codes: ["fussy", "cough", "fever"],
        note: "tối",
      }),
      log("c", "2026-11-25 09:00", { codes: ["fever"] }, "ba"),
    ];
    expect(
      save(logs, "2026-11-25", ["cough", "fussy", "fever"], " tối "),
    ).toEqual({
      ok: true,
      ops: [],
    });
    expect(save([], "2026-11-25", [])).toEqual({ ok: true, ops: [] });
    const others = [log("c", "2026-11-25 09:00", { codes: ["fever"] }, "ba")];
    expect(save(others, "2026-11-25", ["fever"], "")).toEqual({
      ok: true,
      ops: [],
    });
  });

  it("spec §7: Lưu never empties a day; with no chip on and none locked it does nothing", () => {
    const logs = [
      log("a", "2026-11-25 08:00", { codes: ["cough"] }),
      log("b", "2026-11-25 20:00", { codes: ["fussy"] }),
    ];
    expect(save(logs, "2026-11-25", [])).toEqual({ ok: true, ops: [] });
    expect(save(logs, "2026-11-25", [], "", owner)).toEqual({
      ok: true,
      ops: [],
    });
  });

  it("a note longer than 200 characters is refused, not cut", () => {
    expect(save([], TODAY, ["cough"], "a".repeat(201))).toEqual({
      ok: false,
      message: NOTE_TOO_LONG,
    });
    expect(NOTE_TOO_LONG).toBe("Ghi chú dài quá 200 ký tự");
    expect(save([], TODAY, ["cough"], "a".repeat(200)).ok).toBe(true);
  });
});

// Spec 2026-11-27 §3.3 and §5.2.
describe("symptomDayDelete and canDeleteDay", () => {
  it("deletes every own log of the day", () => {
    const day = symptomDay(
      [
        log("a", "2026-11-25 08:00", { codes: ["cough"] }),
        log("b", "2026-11-25 20:00", { codes: ["fussy"] }),
      ],
      "2026-11-25",
      mine,
    );
    expect(symptomDayDelete(day)).toEqual([
      { op: "delete", id: "a" },
      { op: "delete", id: "b" },
    ]);
    expect(canDeleteDay(day)).toBe(true);
  });

  it("no delete without an own log, nor while another's codes are locked", () => {
    const others = [log("c", "2026-11-25 09:00", { codes: ["fever"] }, "ba")];
    expect(canDeleteDay(symptomDay(others, "2026-11-25", mine))).toBe(false);
    const mixed = [
      ...others,
      log("a", "2026-11-25 08:00", { codes: ["cough"] }),
    ];
    expect(canDeleteDay(symptomDay(mixed, "2026-11-25", mine))).toBe(false);
    expect(canDeleteDay(symptomDay([], "2026-11-25", mine))).toBe(false);
  });
});
