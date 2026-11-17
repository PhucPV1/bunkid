import { describe, expect, it } from "vitest";
import type { VaccineDose } from "@/lib/content/vaccineSchema";
import {
  ageDate,
  buildSchedule,
  dueDates,
  NOT_TAKING,
  visibleDoses,
  type DoseRecord,
} from "./vaccines";

const base = {
  protects: ["X"],
  source: "https://example.org",
  reviewedAt: "2026-11-14",
};
const dose = (
  code: string,
  doseNo: number,
  rec: number,
  extra: Partial<VaccineDose> = {},
): VaccineDose => ({
  ...base,
  code,
  doseNo,
  name: `${code} ${doseNo}`,
  program: "tcmr",
  recommendedAgeDays: rec,
  minAgeDays: rec,
  ...(doseNo > 1 ? { minIntervalDaysFromPrev: 28 } : {}),
  ...extra,
});

const six = { group: "dtp_combo", series: "6in1", program: "dich_vu" as const };
const five = { group: "dtp_combo", series: "tcmr_5in1" };
const doses: VaccineDose[] = [
  dose("bcg", 1, 0),
  dose("hexa", 1, 60, six),
  dose("hexa", 2, 90, six),
  dose("dpt", 1, 60, five),
];
const record = (
  code: string,
  doseNo: number,
  extra: Partial<DoseRecord>,
): DoseRecord => ({
  vaccine_code: code,
  dose_no: doseNo,
  status: "done",
  given_on: null,
  due_on_override: null,
  ...extra,
});

describe("visibleDoses", () => {
  it("shows every series of an unchosen or unknown choice, only the chosen series otherwise, nothing for 'none'", () => {
    const codes = (choices: Record<string, string>) =>
      visibleDoses(doses, choices).map(
        (v) => `${v.dose.code}${v.unchosen ? "?" : ""}`,
      );
    expect(codes({})).toEqual(["bcg", "hexa?", "hexa?", "dpt?"]);
    expect(codes({ dtp_combo: "6in1" })).toEqual(["bcg", "hexa", "hexa"]);
    expect(codes({ dtp_combo: NOT_TAKING })).toEqual(["bcg"]);
    expect(codes({ dtp_combo: "retired_series" })).toEqual([
      "bcg",
      "hexa?",
      "hexa?",
      "dpt?",
    ]);
  });
});

describe("dueDates (spec §6.8)", () => {
  const dob = "2026-09-14";
  const hexa = doses.filter((d) => d.code === "hexa");

  it("uses dob + recommended age when nothing is recorded", () => {
    const due = dueDates(hexa, dob, []);
    expect(due.get("hexa#1")).toBe("2026-11-14");
    expect(due.get("hexa#2")).toBe("2026-12-14");
  });

  it("counts whole months on the calendar and other ages in days", () => {
    // 360 = 12 months: the first birthday, not 5 days before it.
    expect(ageDate("2026-01-15", 360)).toBe("2027-01-15");
    expect(ageDate("2026-01-15", 540)).toBe("2027-07-15");
    expect(ageDate("2026-01-31", 30)).toBe("2026-02-28");
    // Weeks and day offsets stay day counts.
    expect(ageDate("2026-01-15", 42)).toBe("2026-02-26");
    expect(ageDate("2026-01-15", 367)).toBe("2027-01-17");
    expect(ageDate("2026-01-15", 0)).toBe("2026-01-15");
  });

  it("pushes a dose back to keep the minimum interval after a late previous dose", () => {
    const due = dueDates(hexa, dob, [
      record("hexa", 1, { given_on: "2026-12-01" }),
    ]);
    expect(due.get("hexa#2")).toBe("2026-12-29");
  });

  it("anchors on the previous due date when it was ticked done without a date", () => {
    const due = dueDates(hexa, dob, [record("hexa", 1, { given_on: null })]);
    expect(due.get("hexa#2")).toBe("2026-12-14");
  });

  it("anchors on the previous due date when the previous dose is still open", () => {
    const due = dueDates(hexa, dob, [
      record("hexa", 1, {
        status: "rescheduled",
        due_on_override: "2026-12-10",
      }),
    ]);
    expect(due.get("hexa#1")).toBe("2026-12-10");
    expect(due.get("hexa#2")).toBe("2027-01-07");
  });

  it("an override wins over everything", () => {
    const due = dueDates(hexa, dob, [
      record("hexa", 2, {
        status: "rescheduled",
        due_on_override: "2026-12-20",
      }),
    ]);
    expect(due.get("hexa#2")).toBe("2026-12-20");
  });
});

describe("buildSchedule", () => {
  it("sorts by due date and assigns overdue / upcoming / done / skipped / later", () => {
    const items = buildSchedule({
      doses: [...doses, dose("late", 1, 300), dose("skip", 1, 10)],
      choices: { dtp_combo: "6in1" },
      dob: "2026-09-14",
      records: [
        record("bcg", 1, { given_on: "2026-09-14" }),
        record("skip", 1, { status: "skipped" }),
      ],
      today: "2026-11-20",
    });
    expect(
      items.map((i) => `${i.dose.code}#${i.dose.doseNo}:${i.state}`),
    ).toEqual([
      "bcg#1:done",
      "skip#1:skipped",
      "hexa#1:overdue",
      "hexa#2:upcoming",
      "late#1:later",
    ]);
  });

  it("flags an open dose whose due date is past the product's age limit", () => {
    const rotarix = [
      dose("rotarix", 1, 60, { maxAgeDays: 168 }),
      dose("rotarix", 2, 90, { maxAgeDays: 168 }),
    ];
    const items = buildSchedule({
      doses: rotarix,
      choices: {},
      dob: "2026-05-01",
      records: [record("rotarix", 1, { given_on: "2026-10-10" })],
      today: "2026-11-14",
    });
    expect(items.map((i) => [i.state, i.pastMaxAge])).toEqual([
      ["done", false],
      ["overdue", true],
    ]);
  });

  it("flags a dose that was due inside the age limit but is still open after it", () => {
    const schedule = (today: string) =>
      buildSchedule({
        doses: [dose("rotateq", 1, 60, { maxAgeDays: 84 })],
        choices: {},
        dob: "2026-05-01",
        records: [],
        today,
      }).map((i) => [i.due, i.state, i.pastMaxAge]);
    // Day 84 is 24/07: still inside the limit that day, past it the day after.
    expect(schedule("2026-07-24")).toEqual([["2026-07-01", "overdue", false]]);
    expect(schedule("2026-07-25")).toEqual([["2026-07-01", "overdue", true]]);
  });
});
