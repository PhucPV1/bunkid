import { describe, expect, it } from "vitest";
import type { VaccineDose, VaccineGroup } from "@/lib/content/vaccineSchema";
import {
  cleanChoices,
  formatDueDate,
  parseChoices,
  parseDoseForm,
  quickTickCandidates,
  toDoseRecords,
} from "./vaccineForm";
import { NOT_TAKING, type ScheduleItem } from "./vaccines";

const groups: VaccineGroup[] = [
  {
    code: "rota",
    name: "Rota",
    series: [
      { code: "rotarix", name: "Rotarix", program: "dich_vu" },
      { code: "rotavin", name: "Rotavin", program: "tcmr" },
    ],
  },
  {
    code: "flu",
    name: "Cúm",
    series: [{ code: "flu", name: "Cúm", program: "dich_vu" }],
  },
];

describe("parseChoices", () => {
  it("accepts a map of strings and treats anything else as nothing chosen", () => {
    expect(parseChoices({ rota: "rotarix" })).toEqual({ rota: "rotarix" });
    expect(parseChoices({ rota: 1 })).toEqual({});
    expect(parseChoices(null)).toEqual({});
    expect(parseChoices([])).toEqual({});
  });
});

describe("cleanChoices", () => {
  it("keeps known series and 'none', drops unset and unknown values", () => {
    expect(
      cleanChoices(groups, {
        rota: "rotarix",
        flu: "",
        old: "x",
      }),
    ).toEqual({ rota: "rotarix" });
    expect(cleanChoices(groups, { rota: "bogus", flu: NOT_TAKING })).toEqual({
      flu: NOT_TAKING,
    });
  });
});

describe("toDoseRecords", () => {
  it("keeps the schedule fields and drops rows with an unknown status", () => {
    const row = {
      id: "r1",
      vaccine_code: "bcg",
      dose_no: 1,
      given_on: null,
      due_on_override: null,
      place: "Trạm y tế",
    };
    expect(
      toDoseRecords([
        { ...row, status: "done" },
        { ...row, status: "weird" },
      ]),
    ).toEqual([
      {
        vaccine_code: "bcg",
        dose_no: 1,
        status: "done",
        given_on: null,
        due_on_override: null,
      },
    ]);
  });
});

describe("formatDueDate", () => {
  it("writes the weekday and the full date", () => {
    expect(formatDueDate("2026-11-16")).toBe("Thứ Hai, 16/11/2026");
    expect(formatDueDate("2026-11-15")).toBe("Chủ nhật, 15/11/2026");
  });
});

describe("quickTickCandidates", () => {
  const item = (
    code: string,
    state: ScheduleItem["state"],
    unchosen = false,
  ): ScheduleItem => ({
    dose: { code, doseNo: 1 } as VaccineDose,
    due: "2026-10-01",
    state,
    record: null,
    unchosen,
    pastMaxAge: false,
  });
  it("lists overdue doses of known series only", () => {
    const items = [
      item("bcg", "overdue"),
      item("rotarix", "overdue", true),
      item("opv", "upcoming"),
      item("hepb_birth", "done"),
    ];
    expect(quickTickCandidates(items).map((i) => i.dose.code)).toEqual(["bcg"]);
  });
});

describe("parseDoseForm", () => {
  const ctx = { dob: "2026-09-14", today: "2026-11-14" };
  const raw = { date: "", place: "", note: "" };

  it("done needs a date between birth and today, keeps place and note", () => {
    expect(parseDoseForm({ ...raw, action: "done" }, ctx)).toEqual({
      ok: false,
      message: "Chọn ngày tiêm.",
    });
    expect(
      parseDoseForm({ ...raw, action: "done", date: "2026-11-15" }, ctx),
    ).toEqual({
      ok: false,
      message: "Ngày tiêm phải từ ngày sinh đến hôm nay.",
    });
    expect(
      parseDoseForm({ ...raw, action: "done", date: "2026-09-13" }, ctx),
    ).toEqual({
      ok: false,
      message: "Ngày tiêm phải từ ngày sinh đến hôm nay.",
    });
    expect(
      parseDoseForm(
        {
          action: "done",
          date: "2026-11-14",
          place: "  VNVC  ",
          note: "",
        },
        ctx,
      ),
    ).toEqual({
      ok: true,
      value: {
        status: "done",
        given_on: "2026-11-14",
        due_on_override: null,
        place: "VNVC",
        note: null,
      },
    });
  });

  it("rescheduled needs a date from today on and clears given_on", () => {
    expect(parseDoseForm({ ...raw, action: "rescheduled" }, ctx)).toEqual({
      ok: false,
      message: "Chọn ngày hẹn mới.",
    });
    expect(
      parseDoseForm({ ...raw, action: "rescheduled", date: "2026-11-13" }, ctx),
    ).toEqual({ ok: false, message: "Ngày hẹn mới phải từ hôm nay trở đi." });
    expect(
      parseDoseForm({ ...raw, action: "rescheduled", date: "2026-11-14" }, ctx),
    ).toEqual({
      ok: true,
      value: {
        status: "rescheduled",
        given_on: null,
        due_on_override: "2026-11-14",
        place: null,
        note: null,
      },
    });
  });

  it("skipped ignores the date; place and note have length limits", () => {
    expect(
      parseDoseForm(
        { ...raw, action: "skipped", date: "bad", note: "sốt" },
        ctx,
      ),
    ).toEqual({
      ok: true,
      value: {
        status: "skipped",
        given_on: null,
        due_on_override: null,
        place: null,
        note: "sốt",
      },
    });
    expect(
      parseDoseForm({ ...raw, action: "skipped", place: "x".repeat(121) }, ctx),
    ).toEqual({ ok: false, message: "Nơi tiêm tối đa 120 ký tự." });
    expect(
      parseDoseForm({ ...raw, action: "skipped", note: "x".repeat(501) }, ctx),
    ).toEqual({ ok: false, message: "Ghi chú tối đa 500 ký tự." });
  });
});
