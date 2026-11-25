import { describe, expect, it } from "vitest";
import type { LmsRow } from "@/lib/content/who";
import { addDays } from "./days";
import {
  type GrowthMeasure,
  growthAlerts,
  type GrowthTables,
} from "./growthAlerts";
import {
  alertDots,
  chartView,
  defaultIndicator,
  formatChange,
  gaugePosition,
  indicatorSummaries,
} from "./growthView";

const DOB = "2026-01-01";
const day = (age: number) => addDays(DOB, age);
// z = value / 2 − 8 on every day (see growthAlerts.test.ts).
const FLAT: LmsRow[] = Array.from({ length: 1857 }, (_, d) => [
  d,
  1,
  16,
  0.125,
]);
const TABLES: GrowthTables = { wfa: FLAT, lhfa: FLAT, hcfa: FLAT };

const measure = (
  age: number,
  kg: number | null,
  cm: number | null = null,
  headCm: number | null = null,
): GrowthMeasure => ({
  measured_on: day(age),
  weight_g: kg === null ? null : Math.round(kg * 1000),
  length_cm: cm,
  head_cm: headCm,
});

const view = (rows: GrowthMeasure[], tables: GrowthTables = TABLES) => {
  const base = { rows, tables, dob: DOB, sex: "boys" as const };
  const alerts = growthAlerts({ ...base, babyName: "Bun" });
  return { alerts, summaries: indicatorSummaries({ ...base, alerts }) };
};

// Spec 2026-11-25 §5.3.
describe("gaugePosition", () => {
  it("maps z −3…+3 onto 0…100 and stops at the ends", () => {
    expect([-3, -2, 0, 2, 3].map(gaugePosition)).toEqual([
      0,
      (1 / 6) * 100,
      50,
      (5 / 6) * 100,
      100,
    ]);
    expect(gaugePosition(-4.2)).toBe(0);
    expect(gaugePosition(5)).toBe(100);
  });
});

describe("formatChange", () => {
  it("writes the sign, the amount and the unit", () => {
    expect(formatChange("wfa", 6.1 - 4.6)).toBe("+1,5 kg");
    expect(formatChange("lhfa", 61.5 - 55.2)).toBe("+6,3 cm");
    expect(formatChange("hcfa", 0)).toBe("+0 cm");
  });

  it("a drop takes a real minus sign", () => {
    expect(formatChange("wfa", -0.15)).toBe("−0,15 kg");
  });
});

describe("indicatorSummaries", () => {
  it("one entry per indicator that was ever measured, in weight, length, head order", () => {
    const { summaries } = view([
      measure(40, 16, 16),
      measure(10, null, null, 16),
    ]);
    expect(summaries.map((s) => [s.indicator, s.title, s.value])).toEqual([
      ["wfa", "Cân nặng", "16 kg"],
      ["lhfa", "Chiều dài", "16 cm"],
      ["hcfa", "Vòng đầu", "16 cm"],
    ]);
    expect(view([measure(40, 16)]).summaries.map((s) => s.indicator)).toEqual([
      "wfa",
    ]);
  });

  it("on the norm: Bình thường, the dot in the middle, the plain-words percentile", () => {
    const [weight] = view([measure(40, 16)]).summaries;
    expect(weight).toEqual({
      indicator: "wfa",
      title: "Cân nặng",
      value: "16 kg",
      chip: { text: "Bình thường", tone: "good" },
      position: 50,
      compare: "Nặng hơn 50 trong 100 bé trai cùng tuổi",
      change: null,
      measuredOn: day(40),
      ageDays: 40,
    });
  });

  it("the change is against the measurement of the same indicator just before", () => {
    const { summaries } = view([
      measure(86, 17.5, 16.3),
      measure(60, null, 16),
      measure(40, 16, 15),
    ]);
    expect(summaries.map((s) => s.change)).toEqual([
      "+1,5 kg sau 46 ngày",
      "+0,3 cm sau 26 ngày",
    ]);
  });

  it("a second row on the same day is not the measurement before", () => {
    const { summaries } = view([
      measure(40, 16),
      measure(40, 15),
      measure(20, 15.5),
    ]);
    expect(summaries[0].change).toBe("+0,5 kg sau 20 ngày");
  });

  it("an alert gives the chip its text and tone", () => {
    expect(view([measure(40, null, 11)]).summaries[0].chip).toEqual({
      text: "Thấp",
      tone: "warn",
    });
    expect(view([measure(40, null, 9)]).summaries[0].chip).toEqual({
      text: "Rất thấp",
      tone: "danger",
    });
  });

  it("falling and rising say where the baby stood before instead of the change", () => {
    const [length] = view([
      measure(54, null, 13.34),
      measure(40, null, 16),
    ]).summaries;
    expect(length.chip).toEqual({ text: "Tăng chậm", tone: "warn" });
    expect(length.change).toBe("trước đó là 50 trong 100");
    expect(length.compare).toBe("Dài hơn 9 trong 100 bé trai cùng tuổi");
  });

  it("an indicator whose table has not loaded is left out", () => {
    expect(
      view([measure(40, 16, 16)], { lhfa: FLAT }).summaries.map(
        (s) => s.indicator,
      ),
    ).toEqual(["lhfa"]);
  });

  it("a measurement the table cannot place is not the latest", () => {
    const [weight] = view([measure(1857, 20), measure(40, 16)]).summaries;
    expect(weight.value).toBe("16 kg");
  });
});

describe("defaultIndicator and alertDots", () => {
  it("opens on weight when nothing is wrong", () => {
    expect(defaultIndicator([])).toBe("wfa");
    expect(alertDots([])).toEqual({});
  });

  it("opens on the first indicator, in screen order, that has an alert", () => {
    const { alerts } = view([measure(40, 16, 11, 23)]);
    expect(alerts.map((a) => a.indicator)).toEqual(["hcfa", "lhfa"]);
    expect(defaultIndicator(alerts)).toBe("lhfa");
    expect(alertDots(alerts)).toEqual({ lhfa: "warn", hcfa: "danger" });
  });
});

// Spec 2026-11-25 §5.4.
describe("chartView", () => {
  const chart = (
    rows: GrowthMeasure[],
    indicator: "wfa" | "lhfa" | "hcfa" = "wfa",
  ) => {
    const { alerts, summaries } = view(rows);
    return chartView({ indicator, rows, dob: DOB, alerts, summaries });
  };

  it("titles the chart and names the unit", () => {
    expect(chart([], "wfa")).toMatchObject({
      title: "Cân nặng theo tháng tuổi",
      unit: "kg",
    });
    expect(chart([], "lhfa")).toMatchObject({
      title: "Chiều dài theo tháng tuổi",
      unit: "cm",
    });
    expect(chart([], "hcfa").title).toBe("Vòng đầu theo tháng tuổi");
  });

  it("lists the measurements of the indicator oldest first, by day of age", () => {
    const { points } = chart([
      measure(86, 17.5),
      measure(60, null, 16),
      measure(40, 16),
    ]);
    expect(points).toEqual([
      { day: 40, value: 16 },
      { day: 86, value: 17.5 },
    ]);
  });

  it("the newest point carries its value as the label, in the accent colour", () => {
    expect(chart([measure(86, 17.5), measure(40, 16)]).last).toEqual({
      day: 86,
      value: 17.5,
      label: "17,5 kg",
      tone: "accent",
    });
  });

  it("with an alert the newest point takes the alert colour and the chip in its label", () => {
    const yellow = chart([measure(40, 11)]);
    expect(yellow.last).toEqual({
      day: 40,
      value: 11,
      label: "11 kg · Thấp",
      tone: "warn",
    });
    expect(yellow.alertTone).toBe("warn");
    expect(chart([measure(40, 9)]).last?.tone).toBe("danger");
    expect(chart([measure(40, 9)]).alertTone).toBe("danger");
  });

  it("an alert on another indicator leaves this chart alone", () => {
    const other = chart([measure(40, 16, 9)], "wfa");
    expect(other.last?.tone).toBe("accent");
    expect(other.alertTone).toBeNull();
  });

  it("shifted is set for falling and rising only", () => {
    expect(
      chart([measure(54, null, 13.34), measure(40, null, 16)], "lhfa").shifted,
    ).toBe(true);
    expect(chart([measure(40, null, 11)], "lhfa").shifted).toBe(false);
    expect(chart([measure(40, 16)]).shifted).toBe(false);
  });

  it("no measurement: no points and no newest point", () => {
    const empty = chart([measure(40, null, 16)], "wfa");
    expect(empty.points).toEqual([]);
    expect(empty.last).toBeNull();
    expect(empty.ariaLabel).toBe("Cân nặng theo tháng tuổi. Chưa có lần đo.");
  });

  it("describes itself: the indicator, how many measurements, the newest status", () => {
    expect(chart([measure(86, 17.5), measure(40, 16)]).ariaLabel).toBe(
      "Cân nặng theo tháng tuổi. 2 lần đo. Lần gần nhất: Bình thường.",
    );
    expect(chart([measure(40, 11)]).ariaLabel).toBe(
      "Cân nặng theo tháng tuổi. 1 lần đo. Lần gần nhất: Thấp.",
    );
  });

  it("a newest point the WHO table cannot place keeps the plain label", () => {
    const late = chart([measure(1857, 9), measure(40, 16)]);
    expect(late.last).toEqual({
      day: 1857,
      value: 9,
      label: "9 kg",
      tone: "accent",
    });
  });
});
