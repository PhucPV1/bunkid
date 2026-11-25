import { describe, expect, it } from "vitest";
import type { LmsRow } from "@/lib/content/who";
import { addDays } from "./days";
import type { GrowthMeasure } from "./growthAlerts";
import { goalPreview, heightView, rangeBar } from "./heightView";

const DOB = "2026-01-01";
// The baby is 76 days old "today".
const TODAY = new Date(`${addDays(DOB, 76)}T05:00:00Z`);
// L = 1, M = 16, S = 1/8 on every day: the length at z is 16 + 2z.
const FLAT: LmsRow[] = Array.from({ length: 1857 }, (_, d) => [
  d,
  1,
  16,
  0.125,
]);
// The median grows 1/8 cm a day from 50.
const GROWING: LmsRow[] = Array.from({ length: 1857 }, (_, d) => [
  d,
  1,
  50 + d / 8,
  0.1,
]);
const length = (age: number, cm: number): GrowthMeasure => ({
  measured_on: addDays(DOB, age),
  weight_g: null,
  length_cm: cm,
  head_cm: null,
});
const baby = (
  over: Partial<Parameters<typeof heightView>[0]["baby"]> = {},
): Parameters<typeof heightView>[0]["baby"] => ({
  name: "Bun",
  dob: DOB,
  sex: "boys",
  father_height_cm: 172,
  mother_height_cm: 164,
  target_height_cm: 180,
  ...over,
});
const view = (
  over: Partial<Parameters<typeof heightView>[0]["baby"]> = {},
  rows: GrowthMeasure[] = [length(76, 17.5), length(40, 16.5)],
  table: LmsRow[] = FLAT,
  today: Date = TODAY,
) => heightView({ baby: baby(over), rows, table, today });

// Spec 2026-11-25 §6.3, item 3.
describe("rangeBar", () => {
  const range = { mid: 174.5, low: 166, high: 183 };

  it("the scale runs from 6 cm under the range to 7 cm over it", () => {
    const bar = rangeBar(range, 180);
    expect(bar.low).toEqual({ at: 20, text: "166" });
    expect(bar.high.text).toBe("183");
    expect(bar.high.at).toBeCloseTo(76.667, 2);
    expect(bar.mid.text).toBe("174,5");
    expect(bar.mid.at).toBeCloseTo(48.333, 2);
    expect(bar.target?.text).toBe("Mục tiêu 180");
    expect(bar.target?.at).toBeCloseTo(66.667, 2);
  });

  it("the middle always carries one decimal", () => {
    expect(rangeBar({ mid: 174, low: 166, high: 183 }, null).mid.text).toBe(
      "174,0",
    );
  });

  it("a target outside the scale is pinned to its end", () => {
    expect(rangeBar(range, 150).target).toEqual({
      at: 0,
      text: "Mục tiêu 150",
    });
    expect(rangeBar(range, 200.5).target).toEqual({
      at: 100,
      text: "Mục tiêu 200,5",
    });
  });

  it("names the three numbers and the target for a screen reader", () => {
    expect(rangeBar(range, 180).label).toBe(
      "Khoảng dự kiến từ 166 đến 183 cm, giữa là 174,5 cm, mục tiêu 180 cm.",
    );
    expect(rangeBar(range, null)).toMatchObject({
      target: null,
      label: "Khoảng dự kiến từ 166 đến 183 cm, giữa là 174,5 cm.",
    });
  });
});

describe("heightView: the goal card", () => {
  it("the target, the status chip, and the newest length with the status in words", () => {
    // 180 cm is z +0,47 for a man: the line is at 16,9. 17,5 is 0,6 above.
    expect(view().goal).toEqual({
      target: "180",
      chip: { text: "Đang đúng hướng", tone: "good" },
      sentence: "Bun dài 17,5 cm lúc 2 tháng 17 ngày. Sát đường mục tiêu.",
    });
  });

  it("below the line: the neutral chip and how far", () => {
    expect(view({}, [length(76, 15)]).goal).toEqual({
      target: "180",
      chip: { text: "Dưới đường mục tiêu", tone: "neutral" },
      sentence:
        "Bun dài 15 cm lúc 2 tháng 17 ngày. Dưới đường mục tiêu 1,9 cm.",
    });
  });

  it("no length yet: only the status, no chip", () => {
    expect(view({}, []).goal).toEqual({
      target: "180",
      chip: null,
      sentence: "Chưa có lần đo chiều dài.",
    });
  });

  it("no target: no goal", () => {
    expect(view({ target_height_cm: null }).goal).toBeNull();
  });

  it("a girl's target is read against the women's reference", () => {
    // 163,2 cm is the median woman: the line is the median, 16.
    expect(
      view({ sex: "girls", target_height_cm: 163.2 }, [length(76, 17.5)]).goal
        ?.sentence,
    ).toBe("Bun dài 17,5 cm lúc 2 tháng 17 ngày. Trên đường mục tiêu 1,5 cm.");
  });
});

describe("heightView: the parents' card", () => {
  it("the parents' heights, the bar, the range and where the target sits in it", () => {
    const { parents } = view();
    expect(parents?.line).toBe("Bố 172 cm · Mẹ 164 cm");
    expect(parents?.bar.low.text).toBe("166");
    expect(parents?.bar.target?.text).toBe("Mục tiêu 180");
    expect(parents?.sentence).toBe(
      "Khoảng dự kiến 166–183 cm. Mục tiêu 180 cm nằm trong khoảng, ở nửa trên.",
    );
  });

  it("without a target: the range alone", () => {
    const { parents } = view({ target_height_cm: null });
    expect(parents?.bar.target).toBeNull();
    expect(parents?.sentence).toBe("Khoảng dự kiến 166–183 cm.");
  });

  it("a girl's range sits 13 cm lower", () => {
    expect(view({ sex: "girls" }).parents?.sentence).toContain("153–170 cm");
  });

  it("without both parents: no card content", () => {
    expect(view({ father_height_cm: null }).parents).toBeNull();
    expect(view({ mother_height_cm: null }).parents).toBeNull();
  });
});

describe("heightView: the path to the target", () => {
  it("the title, the band, the target line, the baby's lengths and the note", () => {
    const { path } = view();
    expect(path?.title).toBe("Đường tới 180 cm");
    expect(path?.note).toBe(
      "Đường mục tiêu là chiều dài ở từng tháng tuổi của một bé trai sẽ cao 180 cm khi lớn, nếu giữ nguyên vị trí trên biểu đồ WHO. Dưới 2 tuổi vị trí này còn thay đổi nhiều.",
    );
    // chartRange at 76 days: the first year, a point a week.
    expect(path?.to).toBe(365);
    expect(path?.band[0]).toEqual({ day: 0, low: 12, mid: 16, high: 20 });
    expect(path?.band).toHaveLength(53);
    expect(path?.target).toHaveLength(53);
    expect(path?.target[0].value).toBeCloseTo(16.947, 2);
    expect(path?.points).toEqual([
      { day: 40, value: 16.5 },
      { day: 76, value: 17.5 },
    ]);
    expect(path?.last).toEqual({
      day: 76,
      value: 17.5,
      label: "17,5 cm",
      tone: "accent",
    });
    expect(path?.ariaLabel).toBe("Đường tới 180 cm. 2 lần đo chiều dài.");
  });

  it("the note names the baby's sex", () => {
    expect(view({ sex: "girls" }).path?.note).toContain("một bé gái sẽ cao");
  });

  it("no length yet: the line is still drawn", () => {
    const { path } = view({}, []);
    expect(path?.points).toEqual([]);
    expect(path?.last).toBeNull();
    expect(path?.ariaLabel).toBe("Đường tới 180 cm. Chưa có lần đo chiều dài.");
  });

  it("without a target there is no path", () => {
    expect(view({ target_height_cm: null }).path).toBeNull();
  });
});

describe("heightView: the speed card", () => {
  it("cm a month, the two days compared, and what is usual", () => {
    // 2 cm in 16 days on the growing table is exactly what is usual.
    expect(
      view({}, [length(56, 59), length(40, 57)], GROWING).velocity,
    ).toEqual({
      rate: "3,8 cm mỗi tháng",
      line: "Từ 10/02 đến 26/02 · bé cùng tuổi thường tăng khoảng 3,8 cm mỗi tháng",
      chip: { text: "Tăng tốt", tone: "good" },
    });
  });

  it("is null without two lengths at least 14 days apart", () => {
    expect(view({}, [length(76, 17.5)]).velocity).toBeNull();
  });
});

describe("heightView: past the WHO table", () => {
  const LATE = new Date(`${addDays(DOB, 1857)}T05:00:00Z`);

  it("after day 1856 the path and the speed give way", () => {
    const late = view({}, [length(1800, 17.5), length(1700, 16.5)], FLAT, LATE);
    expect(late.beyondTable).toBe(true);
    expect(late.path).toBeNull();
    expect(late.velocity).toBeNull();
    // The goal and the parents' range are still shown.
    expect(late.goal?.target).toBe("180");
    expect(late.parents).not.toBeNull();
  });

  it("on day 1856 nothing gives way yet", () => {
    const edge = view(
      {},
      [length(1800, 17.5), length(1700, 16.5)],
      FLAT,
      new Date(`${addDays(DOB, 1856)}T05:00:00Z`),
    );
    expect(edge.beyondTable).toBe(false);
    expect(edge.path).not.toBeNull();
    expect(edge.velocity).not.toBeNull();
  });
});

// Spec 2026-11-25 §6.5: what the sheet shows while the heights are typed.
describe("goalPreview", () => {
  it("both parents valid: the range, and nothing about a target that is not there", () => {
    expect(
      goalPreview({ father: "175", mother: "160,5", target: "" }, "boys"),
    ).toEqual({
      range: "Khoảng dự kiến 166–183 cm",
      target: null,
    });
  });

  it("with a valid target: where it sits against the range", () => {
    expect(
      goalPreview({ father: "175", mother: "160.5", target: "180" }, "boys"),
    ).toEqual({
      range: "Khoảng dự kiến 166–183 cm",
      target: "Mục tiêu 180 cm nằm trong khoảng, ở nửa trên.",
    });
    expect(
      goalPreview({ father: "175", mother: "160,5", target: "190" }, "boys")
        ?.target,
    ).toBe(
      "Mục tiêu 190 cm cao hơn khoảng dự kiến. App vẫn theo dõi, nhưng mục tiêu này khó đạt.",
    );
  });

  it("a girl's range sits 13 cm lower", () => {
    expect(
      goalPreview({ father: "175", mother: "160,5", target: "" }, "girls")
        ?.range,
    ).toBe("Khoảng dự kiến 153–170 cm");
  });

  it("a target that is not a valid height is left out, the range stays", () => {
    for (const target of ["abc", "100", "250"])
      expect(
        goalPreview({ father: "175", mother: "160,5", target }, "boys"),
      ).toEqual({ range: "Khoảng dự kiến 166–183 cm", target: null });
  });

  it("no range until both parents are valid", () => {
    for (const raw of [
      { father: "", mother: "", target: "180" },
      { father: "175", mother: "", target: "180" },
      { father: "", mother: "160", target: "" },
      { father: "17", mother: "160", target: "" },
      { father: "175", mother: "x", target: "" },
    ])
      expect(goalPreview(raw, "boys"), JSON.stringify(raw)).toBeNull();
  });
});
