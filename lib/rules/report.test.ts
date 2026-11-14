import { describe, expect, it } from "vitest";
import type { LmsRow } from "@/lib/content/who";
import type { VaccineDose } from "@/lib/content/vaccineSchema";
import {
  growthSummary,
  medicineRows,
  temperatureRows,
  vaccineSummary,
} from "./report";
import type { ScheduleItem } from "./vaccines";

const from = Date.parse("2026-11-08T17:00:00Z"); // 00:00 on 09/11 in VN
const log = (type: string, started_at: string, details: unknown) => ({
  type,
  started_at,
  details,
});

describe("temperatureRows and medicineRows (spec §6.15)", () => {
  const logs = [
    log("temperature", "2026-11-14T01:00:00Z", {
      celsius: 38.4,
      method: "nach",
    }),
    log("temperature", "2026-11-08T10:00:00Z", { celsius: 39, method: "tai" }),
    log("temperature", "2026-11-10T13:30:00Z", {
      celsius: 37.2,
      method: "tran",
    }),
    log("medicine", "2026-11-14T01:10:00Z", {
      name: "Paracetamol",
      amount: 2.5,
      unit: "ml",
      antipyretic: true,
    }),
    log("medicine", "2026-11-12T00:00:00Z", {
      name: "Vitamin D",
      amount: 1,
      unit: "giọt",
      antipyretic: false,
    }),
    log("medicine", "2026-11-12T01:00:00Z", { broken: true }),
  ];

  it("lists readings in the period, oldest first, with VN time", () => {
    expect(temperatureRows(logs, from)).toEqual([
      { at: "10/11 20:30", text: "37,2°C (trán)", high: false },
      { at: "14/11 08:00", text: "38,4°C (nách)", high: true },
    ]);
  });

  it("lists medicines with name and amount, marking fever medicine", () => {
    expect(medicineRows(logs, from)).toEqual([
      { at: "12/11 07:00", name: "Vitamin D", amount: "1 giọt" },
      { at: "14/11 08:10", name: "Paracetamol (hạ sốt)", amount: "2,5 ml" },
    ]);
  });
});

describe("growthSummary", () => {
  const table: LmsRow[] = Array.from({ length: 80 }, (_, d) => [d, 1, 5, 0.1]);
  const row = (
    measured_on: string,
    weight_g: number | null,
    head_cm: number | null,
  ) => ({
    measured_on,
    weight_g,
    length_cm: null,
    head_cm,
  });

  it("takes the latest measurement of each indicator with its percentile", () => {
    expect(
      growthSummary(
        [row("2026-11-01", 4300, 38), row("2026-11-14", 5000, null)],
        { wfa: table },
        "2026-09-14",
      ),
    ).toEqual([
      {
        title: "Cân nặng",
        value: "5 kg",
        day: "14/11/2026",
        percentile: "P50",
      },
      {
        title: "Vòng đầu",
        value: "38 cm",
        day: "01/11/2026",
        percentile: null,
      },
    ]);
  });
});

describe("vaccineSummary", () => {
  const item = (
    name: string,
    due: string,
    state: ScheduleItem["state"],
    given_on: string | null = null,
    unchosen = false,
  ): ScheduleItem => ({
    dose: { name } as VaccineDose,
    due,
    state,
    record:
      state === "done"
        ? {
            vaccine_code: name,
            dose_no: 1,
            status: "done",
            given_on,
            due_on_override: null,
          }
        : null,
    unchosen,
    pastMaxAge: false,
  });

  it("finds the last dose given and the next one due", () => {
    expect(
      vaccineSummary([
        item("BCG", "2026-09-14", "done", "2026-09-15"),
        item("6 trong 1 mũi 1", "2026-11-13", "done", "2026-11-13"),
        item("Rota", "2026-11-13", "overdue", null, true),
        item("6 trong 1 mũi 2", "2026-12-13", "later"),
        item("Phế cầu", "2026-12-01", "upcoming"),
      ]),
    ).toEqual({
      last: { name: "6 trong 1 mũi 1", day: "13/11/2026" },
      next: {
        name: "Phế cầu",
        day: "01/12/2026",
        overdue: false,
        pastMaxAge: false,
      },
    });
    expect(
      vaccineSummary([item("Rota", "2026-11-01", "overdue")]).next,
    ).toEqual({
      name: "Rota",
      day: "01/11/2026",
      overdue: true,
      pastMaxAge: false,
    });
    expect(vaccineSummary([])).toEqual({ last: null, next: null });
  });
});
