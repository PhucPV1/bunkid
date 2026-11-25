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
  chartLabelAnchor,
  chartLabelPlace,
  chartView,
  defaultIndicator,
  formatChange,
  gaugePosition,
  indicatorSummaries,
  listRows,
  verdictHead,
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

  it("on the norm: Bình thường, the dot in the middle, the norm in numbers", () => {
    const [weight] = view([measure(40, 16)]).summaries;
    expect(weight).toEqual({
      indicator: "wfa",
      title: "Cân nặng",
      value: "16 kg",
      chip: { text: "Bình thường", tone: "good" },
      position: 50,
      change: null,
      measuredOn: day(40),
      ageDays: 40,
      near: null,
      standard: { low: "12,0 kg", mid: "giữa 16,0", high: "20,0 kg" },
      barLabel: "Bình thường. Chuẩn từ 12,0 đến 20,0 kg, giữa 16,0.",
      nearLine: null,
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

  // Spec §5.3 as changed on 2026-11-25: no "trước đó là … trong 100".
  it("falling and rising keep the plain change since the measurement before", () => {
    const [length] = view([
      measure(54, null, 13.34),
      measure(40, null, 16),
    ]).summaries;
    expect(length.chip).toEqual({ text: "Tăng chậm", tone: "warn" });
    expect(length.change).toBe("−2,7 cm sau 14 ngày");
    expect(length).not.toHaveProperty("compare");
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

// Spec 2026-11-25 §5.6. On the flat table the norm runs from 12 to 20, and a
// value is near an edge from 12 up to 14 and above 18 up to 20.
describe("indicatorSummaries: near the edge of the norm", () => {
  it("near the low edge: the chip, the distance to the lowest value of the norm", () => {
    const [length] = view([measure(40, null, 12.9)]).summaries;
    expect(length.near).toBe("nearLow");
    expect(length.chip).toEqual({ text: "Gần mức thấp", tone: "warn" });
    expect(length.standard).toEqual({
      low: "12,0 cm",
      mid: "giữa 16,0",
      high: "20,0 cm",
    });
    expect(length.nearLine).toBe("Cách mức thấp nhất của chuẩn 0,9 cm");
    expect(length.barLabel).toBe(
      "Gần mức thấp. Chuẩn từ 12,0 đến 20,0 cm, giữa 16,0.",
    );
  });

  it("near the high edge: the chip, the distance to the highest value of the norm", () => {
    const [weight] = view([measure(40, 18.5)]).summaries;
    expect(weight.near).toBe("nearHigh");
    expect(weight.chip).toEqual({ text: "Gần mức cao", tone: "warn" });
    expect(weight.nearLine).toBe("Cách mức cao nhất của chuẩn 1,5 kg");
  });

  it("the limits: z −2 and +2 are near, z −1 and +1 are not", () => {
    const near = (kg: number) => view([measure(40, kg)]).summaries[0].near;
    expect([12, 13.99, 14, 16, 18, 18.01, 20].map(near)).toEqual([
      "nearLow",
      "nearLow",
      null,
      null,
      null,
      "nearHigh",
      "nearHigh",
    ]);
  });

  it("the distance is taken between the two numbers as written, with one decimal", () => {
    // 12,34 reads 12,3 on the screen: 12,3 − 12,0.
    expect(view([measure(40, null, 12.34)]).summaries[0].nearLine).toBe(
      "Cách mức thấp nhất của chuẩn 0,3 cm",
    );
    // 19,96 reads 20,0, the same as the edge.
    expect(view([measure(40, null, 19.96)]).summaries[0].nearLine).toBe(
      "Sát mức cao nhất của chuẩn",
    );
    expect(view([measure(40, 12.04)]).summaries[0].nearLine).toBe(
      "Sát mức thấp nhất của chuẩn",
    );
  });

  // The alert reads the exact edge, the screen a rounded one. Rounded to the
  // nearest tenth, 12,0975 would read "12,1" for a value of 12,1 (fine) but
  // 12,04 would read "12,0" while 12,0 is already an alert.
  it("the edges are rounded inwards: a value the app calls low is always below the lowest number shown", () => {
    // M = 16,13: the norm runs from 12,0975 to 20,1625.
    const table: LmsRow[] = Array.from({ length: 1857 }, (_, d) => [
      d,
      1,
      16.13,
      0.125,
    ]);
    const at = (cm: number) =>
      view([measure(40, null, cm)], { lhfa: table }).summaries[0];
    expect(at(16).standard).toEqual({
      low: "12,1 cm",
      mid: "giữa 16,1",
      high: "20,1 cm",
    });
    expect(at(12).chip.text).toBe("Thấp");
    expect(at(12.1).chip.text).toBe("Gần mức thấp");
    expect(at(12.1).nearLine).toBe("Sát mức thấp nhất của chuẩn");
    expect(at(20.1).nearLine).toBe("Sát mức cao nhất của chuẩn");
    expect(at(20.2).chip.text).toBe("Cao");
  });

  it("a weight inside the norm that reads just past the number shown is at the edge, never a distance beyond it", () => {
    // M = 16,02: the norm runs from 12,015 to 20,025, written 12,1 and 20,0.
    const table: LmsRow[] = Array.from({ length: 1857 }, (_, d) => [
      d,
      1,
      16.02,
      0.125,
    ]);
    const at = (kg: number) =>
      view([measure(40, kg)], { wfa: table }).summaries[0];
    expect(at(12.02).standard.low).toBe("12,1 kg");
    expect(at(12.02).nearLine).toBe("Sát mức thấp nhất của chuẩn");
    expect(at(20.02).standard.high).toBe("20,0 kg");
    expect(at(20.02).nearLine).toBe("Sát mức cao nhất của chuẩn");
  });

  it("an indicator with an alert is never near the edge", () => {
    // z −1,33 is in the near range, but the fall from z 0 is an alert.
    const [length] = view([
      measure(54, null, 13.34),
      measure(40, null, 16),
    ]).summaries;
    expect(length.chip).toEqual({ text: "Tăng chậm", tone: "warn" });
    expect(length.near).toBeNull();
    expect(length.nearLine).toBeNull();
  });

  it("every indicator carries the norm, with or without an alert", () => {
    const [weight] = view([measure(40, 11)]).summaries;
    expect(weight.chip.text).toBe("Thấp");
    expect(weight.standard).toEqual({
      low: "12,0 kg",
      mid: "giữa 16,0",
      high: "20,0 kg",
    });
    expect(weight.barLabel).toBe("Thấp. Chuẩn từ 12,0 đến 20,0 kg, giữa 16,0.");
  });

  it("the norm is read on the day of the newest measurement of that indicator", () => {
    // The median grows 0,03 a day from 4: 5,2 on day 40, 6,4 on day 80.
    const growing: LmsRow[] = Array.from({ length: 1857 }, (_, d) => [
      d,
      1,
      4 + 0.03 * d,
      0.125,
    ]);
    const { summaries } = view([measure(80, 6.4), measure(40, null, 5.2)], {
      wfa: growing,
      lhfa: growing,
    });
    expect(summaries.map((s) => s.standard)).toEqual([
      { low: "4,8 kg", mid: "giữa 6,4", high: "8,0 kg" },
      { low: "3,9 cm", mid: "giữa 5,2", high: "6,5 cm" },
    ]);
  });
});

describe("verdictHead", () => {
  const head = (rows: GrowthMeasure[]) => {
    const { alerts, summaries } = view(rows);
    return verdictHead({ babyName: "Bun", alerts, summaries });
  };
  const REST = "Bé vẫn trong vùng bình thường; nên theo dõi ở các lần đo tới.";

  it("nothing wrong and nothing near: the calm heading, no note", () => {
    expect(head([measure(40, 16, 16, 16)])).toEqual({
      heading: "Bun đang lớn đều",
      note: null,
    });
  });

  it("one indicator near the low edge: a heading that still says normal, and the note", () => {
    expect(head([measure(40, 16, 12.9, 16)])).toEqual({
      heading: "Bun phát triển bình thường",
      note: {
        strong: ["Chiều dài đang gần mức thấp của chuẩn."],
        rest: REST,
      },
    });
  });

  it("two and three indicators: listed in screen order, only the first word capitalised", () => {
    expect(head([measure(40, 13, 12.9, 16)]).note?.strong).toEqual([
      "Cân nặng và chiều dài đang gần mức thấp của chuẩn.",
    ]);
    expect(head([measure(40, 19, 19, 19)]).note?.strong).toEqual([
      "Cân nặng, chiều dài và vòng đầu đang gần mức cao của chuẩn.",
    ]);
  });

  it("some near the low edge and some near the high one: a sentence each, low first", () => {
    expect(head([measure(40, 19, 13, 19)]).note).toEqual({
      strong: [
        "Chiều dài đang gần mức thấp của chuẩn.",
        "Cân nặng và vòng đầu đang gần mức cao của chuẩn.",
      ],
      rest: REST,
    });
  });

  it("with an alert there is no heading, but the note about another indicator stays", () => {
    expect(head([measure(40, 11, 13)])).toEqual({
      heading: null,
      note: {
        strong: ["Chiều dài đang gần mức thấp của chuẩn."],
        rest: REST,
      },
    });
    expect(head([measure(40, 11, 16)])).toEqual({ heading: null, note: null });
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

// Spec 2026-11-25 §5.4: which way the label of the newest point runs.
describe("chartLabelAnchor", () => {
  it("in the left half of the plot the label starts at the point and runs right", () => {
    expect(chartLabelAnchor(0, 365)).toBe("start");
    expect(chartLabelAnchor(76, 365)).toBe("start");
    expect(chartLabelAnchor(182, 365)).toBe("start");
  });

  it("in the right half it ends at the point and runs left", () => {
    expect(chartLabelAnchor(183, 365)).toBe("end");
    expect(chartLabelAnchor(1000, 1080)).toBe("end");
    expect(chartLabelAnchor(1857, 1856)).toBe("end");
  });
});

// Spec 2026-11-25 §5.4: where the label of the newest point goes, and which
// fixed captions of the chart make way for it.
describe("chartLabelPlace", () => {
  const place = (
    day: number,
    alert: boolean,
    change: number | null,
    to = 365,
  ) => chartLabelPlace({ day, to, alert, change });

  it("in the left half the label runs right: above the point, or below it with an alert", () => {
    expect(place(76, false, 1.5)).toMatchObject({
      anchor: "start",
      side: "top",
    });
    expect(place(76, true, 3.3)).toMatchObject({
      anchor: "start",
      side: "bottom",
    });
    expect(place(76, true, -0.2)).toMatchObject({
      anchor: "start",
      side: "bottom",
    });
  });

  it("in the right half it runs left, on the side the line does not come from", () => {
    expect(place(300, true, 4.4)).toMatchObject({ anchor: "end", side: "top" });
    expect(place(300, false, 1.7)).toMatchObject({
      anchor: "end",
      side: "top",
    });
    expect(place(300, true, -0.4)).toMatchObject({
      anchor: "end",
      side: "bottom",
    });
    expect(place(300, false, -0.4)).toMatchObject({
      anchor: "end",
      side: "bottom",
    });
  });

  it("a level line or a single measurement keeps the usual side", () => {
    expect(place(300, true, 0).side).toBe("bottom");
    expect(place(300, false, 0).side).toBe("top");
    expect(place(300, true, null).side).toBe("bottom");
    expect(place(300, false, null).side).toBe("top");
  });

  it("the caption inside the band makes way once the point is in the right 30%", () => {
    expect(place(255, false, 1).normalCaption).toBe(true);
    expect(place(256, false, 1).normalCaption).toBe(false);
    expect(place(1700, false, 1, 1770).normalCaption).toBe(false);
    expect(place(76, true, 1).normalCaption).toBe(true);
  });

  // Spec 2026-11-25 §6.3, item 4: the chart of the Chiều cao page.
  it("the caption of the target line makes way once the point is past 60% of the axis", () => {
    // The caption ends at the right edge and is about 85 px wide; the newest
    // point of an older baby sits right under it.
    expect(place(219, false, 1).targetCaption).toBe(true);
    expect(place(220, false, 1).targetCaption).toBe(false);
    expect(place(76, false, 1).targetCaption).toBe(true);
    expect(place(1700, false, 1, 1770).targetCaption).toBe(false);
  });

  it("the caption above the band makes way for an alert label that runs left above its point", () => {
    expect(place(300, true, 4.4).highCaption).toBe(false);
    expect(place(300, false, 1.7).highCaption).toBe(true);
    expect(place(300, true, -0.4).highCaption).toBe(true);
    expect(place(76, true, 3.3).highCaption).toBe(true);
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

// Spec 2026-11-25 §5.5.
describe("listRows", () => {
  const list = (rows: GrowthMeasure[], tables: GrowthTables = TABLES) =>
    listRows({
      rows,
      tables,
      dob: DOB,
      alerts: growthAlerts({
        rows,
        tables,
        dob: DOB,
        sex: "boys",
        babyName: "Bun",
      }),
    });

  it("lists every measurement newest first and keeps the row it came from", () => {
    const old = measure(10, 15);
    const recent = measure(40, 16);
    const items = list([old, recent]);
    expect(items.map((item) => item.row)).toEqual([recent, old]);
  });

  it("titles a row with its day and the age, and the birth day with lúc sinh", () => {
    const items = list([measure(40, 16), measure(0, 16)]);
    expect(items.map((item) => item.title)).toEqual([
      "10/02 · 1 tháng 9 ngày",
      "01/01 · lúc sinh",
    ]);
  });

  it("writes the values that were measured, the head with its name", () => {
    expect(list([measure(40, 16, 16.5, 17)])[0].values).toBe(
      "16 kg · 16,5 cm · vòng đầu 17 cm",
    );
    expect(list([measure(40, null, 16.5)])[0].values).toBe("16,5 cm");
    expect(list([measure(40, null, null, 17)])[0].values).toBe(
      "vòng đầu 17 cm",
    );
  });

  it("the change is against the row just below, for the indicators both rows have", () => {
    const items = list([
      measure(86, 17.5, 16.3, 17),
      measure(40, 16, 16, 16),
      measure(10, null, 15.5),
    ]);
    expect(items.map((item) => item.delta)).toEqual([
      "+1,5 kg · +0,3 cm · vòng đầu +1 cm so với lần trước",
      "+0,5 cm so với lần trước",
      null,
    ]);
  });

  it("no indicator in common with the row below: no change line", () => {
    expect(list([measure(40, 16), measure(10, null, 16)])[0].delta).toBeNull();
  });

  it("a drop is written with a minus sign", () => {
    expect(list([measure(40, 15.85), measure(10, 16)])[0].delta).toBe(
      "−0,15 kg so với lần trước",
    );
  });

  it("chips an older row by where its values sit: normal, low or high, very low or very high", () => {
    const items = list([
      // Far enough from the others that it is compared with none of them.
      measure(300, 16, 16),
      measure(50, 16, 21),
      measure(40, 9.5, 21),
      measure(30, 16, 16),
    ]);
    expect(items.map((item) => item.chip)).toEqual([
      { text: "Bình thường", tone: "good" },
      { text: "Cao", tone: "warn" },
      { text: "Rất thấp", tone: "danger" },
      { text: "Bình thường", tone: "good" },
    ]);
  });

  // Spec 2026-11-25 §5.6: every row is judged by its own values, old ones too.
  it("a row inside the norm but near its edge says which edge", () => {
    // More than 183 days apart, and no weight on the newest row, so no row
    // raises an alert against another.
    const items = list([
      measure(700, null, 12.9),
      measure(400, 18.5, 16),
      measure(100, 16, 16),
    ]);
    expect(items.map((item) => item.chip)).toEqual([
      { text: "Gần mức thấp", tone: "warn" },
      { text: "Gần mức cao", tone: "warn" },
      { text: "Bình thường", tone: "good" },
    ]);
  });

  it("near both edges in one row: the first indicator in weight, length, head order", () => {
    expect(list([measure(40, 19, 13)])[0].chip?.text).toBe("Gần mức cao");
    expect(list([measure(40, 16, 13, 19)])[0].chip?.text).toBe("Gần mức thấp");
  });

  it("outside the norm beats near the edge, whichever indicator comes first", () => {
    // The older row carries no alert: its weight is near the low edge, its
    // length above the norm.
    const [, older] = list([measure(700, null, 16), measure(40, 13, 21)]);
    expect(older.chip).toEqual({ text: "Cao", tone: "warn" });
  });

  it("the newest row of an indicator with an alert takes the alert's chip", () => {
    const items = list([measure(54, null, 13.34), measure(40, null, 16)]);
    expect(items.map((item) => item.chip)).toEqual([
      { text: "Tăng chậm", tone: "warn" },
      { text: "Bình thường", tone: "good" },
    ]);
  });

  it("two alerts on one row: the chip of the one growthAlerts lists first", () => {
    // Weight is low (yellow), length very high (red): red comes first.
    expect(list([measure(40, 11, 23)])[0].chip).toEqual({
      text: "Rất cao",
      tone: "danger",
    });
  });

  it("two rows on one day are chipped each by its own values, the newer one first", () => {
    const newer = { ...measure(40, 16), created_at: "2026-02-10T02:00:00Z" };
    const older = { ...measure(40, 11), created_at: "2026-02-10T01:00:00Z" };
    expect(list([older, newer]).map((item) => item.chip?.text)).toEqual([
      "Bình thường",
      "Thấp",
    ]);
  });

  it("a row outside the WHO table has no chip and says so", () => {
    const [late] = list([measure(1857, 20), measure(40, 16)]);
    expect(late.chip).toBeNull();
    expect(late.outside).toBe(true);
  });

  it("while a table is loading the row has no chip and is not called outside", () => {
    const [row] = list([measure(40, 16)], {});
    expect(row.chip).toBeNull();
    expect(row.outside).toBe(false);
  });
});
