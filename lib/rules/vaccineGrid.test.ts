import { describe, expect, it } from "vitest";
import type { VaccineDose, VaccineGroup } from "@/lib/content/vaccineSchema";
import { VACCINES } from "@/lib/content/vaccines";
import { doseCell, vaccineGrid } from "./vaccineGrid";
import { buildSchedule, type DoseState, type ScheduleItem } from "./vaccines";

const item = (
  code: string,
  doseNo: number,
  name: string,
  over: Partial<Omit<ScheduleItem, "dose">> & {
    dose?: Partial<VaccineDose>;
  } = {},
): ScheduleItem => {
  const { dose, ...rest } = over;
  return {
    dose: {
      code,
      doseNo,
      name,
      protects: ["X"],
      program: "tcmr",
      recommendedAgeDays: 0,
      minAgeDays: 0,
      source: "https://example.org",
      reviewedAt: "2026-11-14",
      ...dose,
    },
    due: "2026-11-20",
    state: "later",
    record: null,
    unchosen: false,
    pastMaxAge: false,
    ...rest,
  };
};

const groups: VaccineGroup[] = [
  {
    code: "dtp_combo",
    name: "Bạch hầu, ho gà, uốn ván",
    series: [
      { code: "6in1", name: "6 trong 1 (Hexaxim)", program: "dich_vu" },
      { code: "tcmr_5in1", name: "5 trong 1", program: "tcmr" },
    ],
  },
  {
    code: "measles_tcmr",
    name: "Sởi (Tiêm chủng mở rộng)",
    series: [
      {
        code: "tcmr_measles",
        name: "Sởi 9 tháng, Sởi – Rubella 18 tháng",
        program: "tcmr",
      },
    ],
  },
  {
    code: "rota",
    name: "Tiêu chảy do Rota",
    series: [
      { code: "rotarix", name: "Rotarix", program: "dich_vu" },
      { code: "rotateq", name: "RotaTeq", program: "dich_vu" },
    ],
  },
];

const six = { group: "dtp_combo", series: "6in1" };
const measles = { group: "measles_tcmr", series: "tcmr_measles" };
const rota = { group: "rota" };

// Spec 2026-11-19 §7.2.
describe("vaccineGrid", () => {
  it("one row per vaccine code, in order of first appearance, doses in their columns", () => {
    const items = [
      item("bcg", 1, "Vắc xin lao (BCG)"),
      item("hexa", 1, "6 trong 1 mũi 1", { dose: six }),
      item("opv", 1, "Uống bại liệt (OPV) lần 1"),
      item("hexa", 2, "6 trong 1 mũi 2", { dose: six }),
      item("opv", 3, "Uống bại liệt (OPV) lần 3"),
      item("hexa", 4, "6 trong 1 mũi 4 (nhắc)", { dose: six }),
    ];
    const grid = vaccineGrid(items, groups);
    expect(grid.columns).toBe(4);
    expect(grid.rows.map((row) => [row.kind, row.label])).toEqual([
      ["vaccine", "Vắc xin lao (BCG)"],
      ["vaccine", "6 trong 1"],
      ["vaccine", "Uống bại liệt (OPV)"],
    ]);
    const [bcg, hexa, opv] = grid.rows;
    if (
      bcg.kind !== "vaccine" ||
      hexa.kind !== "vaccine" ||
      opv.kind !== "vaccine"
    )
      throw new Error("vaccine rows expected");
    expect(bcg.cells).toEqual([items[0], null, null, null]);
    expect(hexa.cells).toEqual([items[1], items[3], null, items[5]]);
    expect(opv.cells).toEqual([items[2], null, items[4], null]);
  });

  it("labels come from the lowest dose number, whatever the due order", () => {
    const items = [
      item("flu", 2, "Cúm mùa mũi 2", { due: "2026-10-01" }),
      item("flu", 1, "Cúm mùa mũi 1", { due: "2026-11-01" }),
    ];
    expect(vaccineGrid(items, groups).rows[0].label).toBe("Cúm mùa");
  });

  it("falls back to the series name when the doses of a code disagree", () => {
    const items = [
      item("tcmr_measles", 1, "Sởi (9 tháng)", { dose: measles }),
      item("tcmr_measles", 2, "Sởi – Rubella (MR, 18 tháng)", {
        dose: measles,
      }),
    ];
    expect(vaccineGrid(items, groups).rows[0].label).toBe(
      "Sởi 9 tháng, Sởi – Rubella 18 tháng",
    );
  });

  it("keeps the lowest dose's name when its series holds other codes too", () => {
    const five = { group: "dtp_combo", series: "tcmr_5in1" };
    const items = [
      item("dpt_vgb_hib", 1, "DPT-VGB-Hib (5 trong 1) mũi 1", { dose: five }),
      item("opv", 1, "Uống bại liệt (OPV) lần 1", { dose: five }),
      item("dpt_vgb_hib", 4, "DPT nhắc lại (18 tháng)", { dose: five }),
    ];
    expect(vaccineGrid(items, groups).rows.map((row) => row.label)).toEqual([
      "DPT-VGB-Hib (5 trong 1)",
      "Uống bại liệt (OPV)",
    ]);
  });

  it("keeps the stripped name when the series is not found", () => {
    const items = [item("x", 1, "X mũi 1"), item("x", 2, "Y mũi 2")];
    expect(vaccineGrid(items, groups).rows[0].label).toBe("X");
  });

  it("one row per group with open unchosen doses, at the group's first dose, alternatives not listed", () => {
    const items = [
      item("bcg", 1, "Vắc xin lao (BCG)"),
      item("rotarix", 1, "Rotarix (uống) lần 1", {
        dose: rota,
        unchosen: true,
        state: "overdue",
      }),
      item("rotateq", 1, "RotaTeq (uống) lần 1", {
        dose: rota,
        unchosen: true,
        state: "overdue",
      }),
      item("pcv", 1, "Phế cầu mũi 1"),
      item("rotateq", 3, "RotaTeq (uống) lần 3", {
        dose: rota,
        unchosen: true,
      }),
    ];
    const grid = vaccineGrid(items, groups);
    expect(grid.rows.map((row) => [row.kind, row.label])).toEqual([
      ["vaccine", "Vắc xin lao (BCG)"],
      ["unchosen", "Tiêu chảy do Rota"],
      ["vaccine", "Phế cầu"],
    ]);
    // Unchosen doses do not widen the table.
    expect(grid.columns).toBe(1);
  });

  it("no unchosen row when none of the group's doses is still open", () => {
    const items = [
      item("rotarix", 1, "Rotarix (uống) lần 1", {
        dose: rota,
        unchosen: true,
        state: "done",
      }),
      item("rotarix", 2, "Rotarix (uống) lần 2", {
        dose: rota,
        unchosen: true,
        state: "skipped",
      }),
    ];
    expect(vaccineGrid(items, groups)).toEqual({ columns: 1, rows: [] });
  });

  it("an open dose keeps its group's row even after done ones", () => {
    const states: DoseState[] = ["done", "upcoming"];
    const items = states.map((state, i) =>
      item("rotarix", i + 1, `Rotarix (uống) lần ${i + 1}`, {
        dose: rota,
        unchosen: true,
        state,
      }),
    );
    expect(vaccineGrid(items, groups).rows).toEqual([
      { kind: "unchosen", key: "rota", label: "Tiêu chảy do Rota" },
    ]);
  });

  it("at least one column", () => {
    expect(vaccineGrid([], groups)).toEqual({ columns: 1, rows: [] });
  });

  describe("the real content", () => {
    const schedule = (choices: Record<string, string>) =>
      buildSchedule({
        doses: VACCINES.doses,
        choices,
        dob: "2026-09-14",
        records: [],
        today: "2026-11-20",
      });

    it("nothing chosen: the two birth doses and one row per group", () => {
      const grid = vaccineGrid(schedule({}), VACCINES.groups);
      expect(grid.columns).toBe(1);
      expect(grid.rows.map((row) => [row.kind, row.label])).toEqual([
        ["vaccine", "Vắc xin lao (BCG)"],
        ["vaccine", "Viêm gan B liều sơ sinh"],
        ["unchosen", "Não mô cầu nhóm B"],
        ["unchosen", "Bạch hầu, ho gà, uốn ván, bại liệt, Hib, viêm gan B"],
        ["unchosen", "Phế cầu"],
        ["unchosen", "Tiêu chảy do Rota"],
        ["unchosen", "Cúm mùa"],
        ["unchosen", "Viêm não Nhật Bản"],
        ["unchosen", "Sởi – Quai bị – Rubella (dịch vụ)"],
        ["unchosen", "Sởi, Sởi – Rubella (Tiêm chủng mở rộng)"],
        ["unchosen", "Thủy đậu"],
        ["unchosen", "Viêm gan A"],
      ]);
    });

    it("6 trong 1, Rotarix and Synflorix chosen", () => {
      const grid = vaccineGrid(
        schedule({ dtp_combo: "6in1", rota: "rotarix", pneumo: "synflorix" }),
        VACCINES.groups,
      );
      expect(grid.columns).toBe(4);
      expect(grid.rows.map((row) => [row.kind, row.label])).toEqual([
        ["vaccine", "Vắc xin lao (BCG)"],
        ["vaccine", "Viêm gan B liều sơ sinh"],
        ["unchosen", "Não mô cầu nhóm B"],
        ["vaccine", "6 trong 1"],
        ["vaccine", "Rotarix (uống)"],
        ["vaccine", "Synflorix"],
        ["unchosen", "Cúm mùa"],
        ["unchosen", "Viêm não Nhật Bản"],
        ["unchosen", "Sởi – Quai bị – Rubella (dịch vụ)"],
        ["unchosen", "Sởi, Sởi – Rubella (Tiêm chủng mở rộng)"],
        ["unchosen", "Thủy đậu"],
        ["unchosen", "Viêm gan A"],
      ]);
    });

    it("the 5 trong 1 series: three rows, the DPT row keeps its own name", () => {
      const grid = vaccineGrid(
        schedule({ dtp_combo: "tcmr_5in1" }),
        VACCINES.groups,
      );
      const labels = grid.rows
        .filter((row) => row.kind === "vaccine")
        .map((row) => row.label);
      expect(labels).toEqual([
        "Vắc xin lao (BCG)",
        "Viêm gan B liều sơ sinh",
        "DPT-VGB-Hib (5 trong 1)",
        "Uống bại liệt (OPV)",
        "Tiêm bại liệt (IPV)",
      ]);
      expect(grid.columns).toBe(4);
    });
  });
});

describe("doseCell", () => {
  const done = (given_on: string | null) =>
    item("bcg", 1, "BCG", {
      state: "done",
      record: {
        vaccine_code: "bcg",
        dose_no: 1,
        status: "done",
        given_on,
        due_on_override: null,
      },
    });

  it("done: the day it was given, if known", () => {
    expect(doseCell(done("2026-10-29"))).toEqual({
      label: "Đã tiêm",
      date: "2026-10-29",
      tone: "done",
    });
    expect(doseCell(done(null))).toEqual({
      label: "Đã tiêm",
      date: null,
      tone: "done",
    });
  });

  it("skipped: no date", () => {
    expect(doseCell(item("bcg", 1, "BCG", { state: "skipped" }))).toEqual({
      label: "Bỏ qua",
      date: null,
      tone: "skipped",
    });
  });

  it("past the age limit wins over overdue and upcoming", () => {
    for (const state of ["overdue", "upcoming", "later"] as const)
      expect(
        doseCell(item("rotarix", 1, "R", { state, pastMaxAge: true })),
      ).toEqual({ label: "Quá tuổi", date: "2026-11-20", tone: "late" });
  });

  it("overdue, upcoming and later: the due date", () => {
    expect(doseCell(item("a", 1, "A", { state: "overdue" }))).toEqual({
      label: "Trễ hẹn",
      date: "2026-11-20",
      tone: "late",
    });
    expect(doseCell(item("a", 1, "A", { state: "upcoming" }))).toEqual({
      label: "Sắp tới",
      date: "2026-11-20",
      tone: "soon",
    });
    expect(doseCell(item("a", 1, "A", { state: "later" }))).toEqual({
      label: "Chưa tiêm",
      date: "2026-11-20",
      tone: "open",
    });
  });
});
