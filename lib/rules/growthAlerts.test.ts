import { describe, expect, it } from "vitest";
import type { LmsRow } from "@/lib/content/who";
import { addDays } from "./days";
import {
  ALERT_CHIP,
  alertReason,
  type GrowthMeasure,
  type GrowthTables,
  growthAlerts,
  growthStatus,
  NEAR_CHIP,
  nearKind,
  positionKind,
  readings,
} from "./growthAlerts";

const DOB = "2026-01-01";
const day = (age: number) => addDays(DOB, age);

// L = 1, M = 16, S = 1/8 on every day, so z = value / 2 − 8 exactly:
// 16 → 0, 12 → −2, 10 → −3, 20 → +2, 22 → +3.
const FLAT: LmsRow[] = Array.from({ length: 1857 }, (_, d) => [
  d,
  1,
  16,
  0.125,
]);
// The median grows 0,03 a day from 4, so "bé cùng tuổi thường tăng" is not zero.
const GROWING: LmsRow[] = Array.from({ length: 1857 }, (_, d) => [
  d,
  1,
  4 + 0.03 * d,
  0.125,
]);

const weight = (
  age: number,
  kg: number,
  created_at?: string,
): GrowthMeasure => ({
  measured_on: day(age),
  weight_g: Math.round(kg * 1000),
  length_cm: null,
  head_cm: null,
  created_at,
});
const length = (age: number, cm: number): GrowthMeasure => ({
  measured_on: day(age),
  weight_g: null,
  length_cm: cm,
  head_cm: null,
});
const head = (age: number, cm: number): GrowthMeasure => ({
  measured_on: day(age),
  weight_g: null,
  length_cm: null,
  head_cm: cm,
});

const run = (
  rows: GrowthMeasure[],
  tables: GrowthTables = { wfa: FLAT, lhfa: FLAT, hcfa: FLAT },
) => growthAlerts({ rows, tables, dob: DOB, sex: "boys", babyName: "Bun" });
const kinds = (rows: GrowthMeasure[]) =>
  run(rows).map((alert) => `${alert.indicator}:${alert.kind}`);

describe("positionKind", () => {
  it("is null from −2 to +2, low or high up to ±3, very low or very high beyond", () => {
    expect(
      [-3.01, -3, -2.01, -2, 0, 2, 2.01, 3, 3.01].map(positionKind),
    ).toEqual([
      "veryLow",
      "low",
      "low",
      null,
      null,
      null,
      "high",
      "high",
      "veryHigh",
    ]);
  });
});

describe("readings", () => {
  it("lists one indicator newest first and leaves out what the table cannot place", () => {
    const list = readings(
      [
        length(10, 16),
        weight(40, 16),
        length(40, 12),
        length(1857, 16),
        length(-1, 16),
      ],
      FLAT,
      DOB,
      "lhfa",
    );
    expect(list).toEqual([
      { day: day(40), ageDays: 40, value: 12, z: -2, median: 16 },
      { day: day(10), ageDays: 10, value: 16, z: 0, median: 16 },
    ]);
  });

  it("on one day the row created last comes first; without created_at the given order stays", () => {
    const early = weight(40, 16, "2026-02-10T01:00:00Z");
    const late = weight(40, 12, "2026-02-10T02:00:00Z");
    expect(readings([early, late], FLAT, DOB, "wfa")[0].value).toBe(12);
    expect(readings([late, early], FLAT, DOB, "wfa")[0].value).toBe(12);
    expect(
      readings([weight(40, 16), weight(40, 12)], FLAT, DOB, "wfa")[0].value,
    ).toBe(16);
  });
});

// Spec 2026-11-25 §5.1.
describe("growthAlerts: position", () => {
  it("nothing from z −2 to z +2", () => {
    expect(kinds([length(40, 12)])).toEqual([]);
    expect(kinds([length(40, 16)])).toEqual([]);
    expect(kinds([length(40, 20)])).toEqual([]);
  });

  it("yellow below −2 down to −3 and above +2 up to +3", () => {
    expect(kinds([length(40, 11.98)])).toEqual(["lhfa:low"]);
    expect(kinds([length(40, 10)])).toEqual(["lhfa:low"]);
    expect(kinds([length(40, 20.02)])).toEqual(["lhfa:high"]);
    expect(kinds([length(40, 22)])).toEqual(["lhfa:high"]);
    expect(run([length(40, 10)])[0].level).toBe("yellow");
  });

  it("red beyond ±3", () => {
    expect(kinds([length(40, 9.98)])).toEqual(["lhfa:veryLow"]);
    expect(kinds([length(40, 22.02)])).toEqual(["lhfa:veryHigh"]);
    expect(run([length(40, 9.98)])[0].level).toBe("red");
  });

  it("only the newest measurement of an indicator can raise an alert", () => {
    expect(kinds([length(10, 9), length(40, 16)])).toEqual([]);
  });

  it("an indicator whose table has not loaded gives no alert", () => {
    expect(run([length(40, 9), weight(40, 9)], { wfa: FLAT })).toHaveLength(1);
  });

  it("a measurement outside days 0–1856 is passed over, also as the newest", () => {
    expect(kinds([length(1857, 9), length(40, 16)])).toEqual([]);
    expect(kinds([length(1857, 16), length(40, 9)])).toEqual(["lhfa:veryLow"]);
  });
});

describe("growthAlerts: falling and rising", () => {
  it("falling when z is 1,33 below the highest z of the last 14 to 183 days", () => {
    // 13,34 → z −1,33; 13,36 → z −1,32.
    expect(kinds([length(40, 16), length(54, 13.34)])).toEqual([
      "lhfa:falling",
    ]);
    expect(kinds([length(40, 16), length(54, 13.36)])).toEqual([]);
  });

  it("the window takes day 14 and day 183 and leaves out day 13 and day 184", () => {
    expect(kinds([length(41, 16), length(54, 13.34)])).toEqual([]);
    expect(kinds([length(40, 16), length(223, 13.34)])).toEqual([
      "lhfa:falling",
    ]);
    expect(kinds([length(40, 16), length(224, 13.34)])).toEqual([]);
  });

  it("compares with the highest reading in the window, not the nearest", () => {
    const [alert] = run([length(10, 16), length(40, 14), length(60, 13.34)]);
    // 13,34 after 14 is no fall; only against the 16 of day 10 is it one.
    expect(alert.kind).toBe("falling");
  });

  it("weight falls the same way while it still goes up", () => {
    // Day 86: median 6,58 kg, so 5,45 kg is z −1,37 after z 0 on day 40.
    expect(
      run([weight(40, 5.2), weight(86, 5.45)], { wfa: GROWING }).map(
        (alert) => alert.kind,
      ),
    ).toEqual(["falling"]);
  });

  it("rising is for the head only", () => {
    expect(kinds([length(40, 16), length(54, 18.66)])).toEqual([]);
    expect(kinds([head(40, 16), head(54, 18.66)])).toEqual(["hcfa:rising"]);
    expect(kinds([head(40, 16), head(54, 18.64)])).toEqual([]);
  });

  it("a head that both fell and rose inside the window is falling", () => {
    expect(kinds([head(10, 13), head(30, 19), head(50, 16.34)])).toEqual([
      "hcfa:falling",
    ]);
  });
});

describe("growthAlerts: weight loss", () => {
  it("lighter than the nearest weighing at least 14 days back", () => {
    expect(kinds([weight(20, 16), weight(34, 15.9)])).toEqual(["wfa:loss"]);
    expect(kinds([weight(20, 16), weight(34, 16)])).toEqual([]);
  });

  it("not when the two weighings are 13 days apart", () => {
    expect(kinds([weight(20, 16), weight(33, 15.9)])).toEqual([]);
  });

  it("never against a weighing from the first two weeks of life", () => {
    expect(kinds([weight(0, 16), weight(30, 15.9)])).toEqual([]);
    expect(kinds([weight(13, 16), weight(30, 15.9)])).toEqual([]);
    expect(kinds([weight(14, 16), weight(30, 15.9)])).toEqual(["wfa:loss"]);
  });

  it("takes the nearest weighing that is far enough back", () => {
    // 20 days back the baby was lighter, 40 days back heavier: no loss.
    expect(kinds([weight(20, 16.5), weight(40, 15.5), weight(60, 16)])).toEqual(
      [],
    );
  });
});

describe("growthAlerts: one alert per indicator, by priority", () => {
  it("very low beats loss and falling", () => {
    expect(kinds([weight(20, 16), weight(40, 9.9)])).toEqual(["wfa:veryLow"]);
  });

  it("loss beats falling", () => {
    expect(kinds([weight(20, 16), weight(40, 13)])).toEqual(["wfa:loss"]);
  });

  it("falling beats low", () => {
    expect(kinds([length(20, 14.8), length(40, 11.9)])).toEqual([
      "lhfa:falling",
    ]);
  });

  it("red alerts first, then weight, length, head", () => {
    expect(
      kinds([weight(40, 11), length(40, 23), head(40, 21), weight(20, 12)]),
    ).toEqual(["lhfa:veryHigh", "wfa:loss", "hcfa:high"]);
  });
});

describe("growthAlerts: wording", () => {
  const text = (
    rows: GrowthMeasure[],
    tables: GrowthTables = { wfa: FLAT, lhfa: FLAT, hcfa: FLAT },
  ) => {
    const [{ title, body, advice, chip }] = run(rows, tables);
    return { title, body, advice, chip };
  };

  it("very low and very high", () => {
    expect(text([length(40, 9.9)])).toEqual({
      title: "Chiều dài thấp hơn chuẩn nhiều",
      body: "9,9 cm lúc 1 tháng 9 ngày, thấp hơn gần như mọi bé trai cùng tuổi.",
      advice: "Nên cho bé đi khám.",
      chip: "Rất thấp",
    });
    expect(text([weight(40, 22.5)])).toEqual({
      title: "Cân nặng cao hơn chuẩn nhiều",
      body: "22,5 kg lúc 1 tháng 9 ngày, cao hơn gần như mọi bé trai cùng tuổi.",
      advice: "Nên cho bé đi khám.",
      chip: "Rất cao",
    });
  });

  // Spec §5.1 as changed on 2026-11-25: no "… trong 100 bé" sentence.
  it("low and high say the value and the age, nothing more", () => {
    expect(text([head(40, 11)])).toEqual({
      title: "Vòng đầu thấp hơn chuẩn",
      body: "11 cm lúc 1 tháng 9 ngày.",
      advice: "Nên hỏi bác sĩ ở lần khám tới.",
      chip: "Thấp",
    });
    expect(text([length(40, 21)])).toEqual({
      title: "Chiều dài cao hơn chuẩn",
      body: "21 cm lúc 1 tháng 9 ngày.",
      advice: "Nên hỏi bác sĩ ở lần khám tới.",
      chip: "Cao",
    });
  });

  it("loss names the grams and the day of the earlier weighing", () => {
    expect(text([weight(20, 16), weight(34, 15.85)])).toEqual({
      title: "Cân nặng giảm",
      body: "Bun nhẹ hơn 150 g so với lần đo 21/01.",
      advice: "Nên hỏi bác sĩ ở lần khám tới.",
      chip: "Giảm cân",
    });
  });

  it("falling weight: the gain, the days, grams a day and what is usual", () => {
    // Medians: 5,2 kg on day 40 and 6,58 kg on day 86, so 30 g a day is usual.
    expect(text([weight(40, 5.2), weight(86, 5.45)], { wfa: GROWING })).toEqual(
      {
        title: "Cân nặng tăng chậm lại",
        body: "Bun tăng 250 g trong 46 ngày, khoảng 5 g mỗi ngày. Bé cùng tuổi thường tăng khoảng 30 g mỗi ngày.",
        advice: "Nên hỏi bác sĩ ở lần khám tới.",
        chip: "Tăng chậm",
      },
    );
  });

  it("falling length and rising head: the gain in cm and what is usual over the same days", () => {
    expect(text([length(40, 5.2), length(86, 5.4)], { lhfa: GROWING })).toEqual(
      {
        title: "Chiều dài tăng chậm lại",
        body: "Bun tăng 0,2 cm trong 46 ngày. Bé cùng tuổi thường tăng khoảng 1,4 cm trong cùng thời gian.",
        advice: "Nên hỏi bác sĩ ở lần khám tới.",
        chip: "Tăng chậm",
      },
    );
    expect(text([head(40, 5.2), head(86, 7.9)], { hcfa: GROWING })).toEqual({
      title: "Vòng đầu tăng nhanh",
      body: "Bun tăng 2,7 cm trong 46 ngày. Bé cùng tuổi thường tăng khoảng 1,4 cm trong cùng thời gian.",
      advice: "Nên hỏi bác sĩ ở lần khám tới.",
      chip: "Tăng nhanh",
    });
  });

  it("falling without a gain to speak of says only the value and the age", () => {
    expect(text([length(40, 16), length(54, 13.34)]).body).toBe(
      "13,3 cm lúc 1 tháng 23 ngày.",
    );
    // The same length 46 days later, while the median grew: no gain at all.
    expect(
      text([length(40, 5.2), length(86, 5.2)], { lhfa: GROWING }).body,
    ).toBe("5,2 cm lúc 2 tháng 27 ngày.");
  });

  it("every kind has its chip", () => {
    expect(ALERT_CHIP).toEqual({
      veryLow: "Rất thấp",
      veryHigh: "Rất cao",
      loss: "Giảm cân",
      falling: "Tăng chậm",
      rising: "Tăng nhanh",
      low: "Thấp",
      high: "Cao",
    });
  });
});

describe("growthAlerts: what the screens need besides the text", () => {
  it("names the day of the measurement, and nothing about a percentile", () => {
    const [falling] = run([length(40, 16), length(54, 13.34)]);
    expect(falling.measuredOn).toBe(day(54));
    expect(falling).not.toHaveProperty("previousPercentile");
    const [low] = run([length(40, 11)]);
    expect(low.measuredOn).toBe(day(40));
  });
});

// Spec 2026-11-25 §3.4: the chip on the growth card of the Sức khỏe page.
describe("growthStatus", () => {
  it("no alert: Lớn đều", () => {
    expect(growthStatus([])).toEqual({ text: "Lớn đều", tone: "good" });
  });

  it("only yellow alerts: Cần chú ý", () => {
    expect(growthStatus(run([length(40, 11)]))).toEqual({
      text: "Cần chú ý",
      tone: "warn",
    });
  });

  it("any red alert: Nên đi khám", () => {
    expect(growthStatus(run([length(40, 11), weight(40, 9)]))).toEqual({
      text: "Nên đi khám",
      tone: "danger",
    });
  });

  // Spec 2026-11-25 §5.6: with no alert, the indicators near the edge speak.
  it("no alert, near the low edge only: Gần mức thấp", () => {
    expect(growthStatus([], ["nearLow", null, "nearLow"])).toEqual({
      text: "Gần mức thấp",
      tone: "warn",
    });
  });

  it("no alert, near the high edge only: Gần mức cao", () => {
    expect(growthStatus([], [null, "nearHigh"])).toEqual({
      text: "Gần mức cao",
      tone: "warn",
    });
  });

  it("no alert, one near each edge: Gần ranh chuẩn", () => {
    expect(growthStatus([], ["nearHigh", "nearLow", null])).toEqual({
      text: "Gần ranh chuẩn",
      tone: "warn",
    });
  });

  it("nothing near: still Lớn đều", () => {
    expect(growthStatus([], [null, null, null])).toEqual({
      text: "Lớn đều",
      tone: "good",
    });
  });

  it("an alert always wins over an indicator near the edge", () => {
    expect(growthStatus(run([length(40, 11)]), ["nearLow"])).toEqual({
      text: "Cần chú ý",
      tone: "warn",
    });
    expect(growthStatus(run([weight(40, 9)]), ["nearHigh"])).toEqual({
      text: "Nên đi khám",
      tone: "danger",
    });
  });
});

// Spec 2026-11-25 §5.6: inside the norm, but close to its edge.
describe("nearKind", () => {
  it("is near the low edge from −2 up to, but not at, −1", () => {
    expect([-2, -1.5, -1.01].map(nearKind)).toEqual([
      "nearLow",
      "nearLow",
      "nearLow",
    ]);
    expect(nearKind(-1)).toBeNull();
  });

  it("is near the high edge above +1, up to and at +2", () => {
    expect(nearKind(1)).toBeNull();
    expect([1.01, 1.5, 2].map(nearKind)).toEqual([
      "nearHigh",
      "nearHigh",
      "nearHigh",
    ]);
  });

  it("is null in the middle of the norm and outside it", () => {
    for (const z of [-3.01, -3, -2.01, -0.99, 0, 0.99, 2.01, 3, 3.01])
      expect(nearKind(z), String(z)).toBeNull();
  });

  it("each kind has its chip", () => {
    expect(NEAR_CHIP).toEqual({
      nearLow: "Gần mức thấp",
      nearHigh: "Gần mức cao",
    });
  });
});

// Spec 2026-11-25 §5.3: the popup "Vì sao có cảnh báo này?".
describe("alertReason", () => {
  it("position alerts explain the WHO comparison", () => {
    const text =
      "App so số đo của bé với chuẩn tăng trưởng của WHO cho trẻ cùng tuổi, cùng giới. Số đo này nằm ngoài vùng của 95 trong 100 bé khỏe mạnh. Có bé vẫn khỏe dù nằm ngoài vùng này, nên bác sĩ là người kết luận.";
    for (const kind of ["veryLow", "veryHigh", "low", "high"] as const)
      expect(alertReason(kind)).toBe(text);
  });

  it("falling and rising explain the shift between measurements", () => {
    const text =
      "App so vị trí của bé trên biểu đồ WHO giữa các lần đo trong 6 tháng gần đây. Vị trí đã đổi hai dải trở lên. Đo lệch tay cũng có thể gây ra điều này, nên hãy đo lại rồi hỏi bác sĩ.";
    expect(alertReason("falling")).toBe(text);
    expect(alertReason("rising")).toBe(text);
  });

  it("loss explains that weight should only go up after two weeks", () => {
    expect(alertReason("loss")).toBe(
      "Sau hai tuần đầu, cân nặng của bé thường chỉ tăng. Lần cân này thấp hơn lần trước. Cân khác nhau hoặc cân lúc bé vừa bú cũng có thể gây lệch, nên hãy cân lại rồi hỏi bác sĩ.",
    );
  });
});
