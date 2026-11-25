import { describe, expect, it } from "vitest";
import { NUTRITION, NutritionContentSchema, nutritionStage } from "./nutrition";

// Spec 2026-11-25 §7.3.
describe("content/nutrition.vi.json", () => {
  it("says when it was checked and names three sources with their addresses", () => {
    expect(NUTRITION.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(NUTRITION.sources).toHaveLength(3);
    for (const source of NUTRITION.sources) {
      expect(source.name.length).toBeGreaterThan(0);
      expect(source.url).toMatch(/^https:\/\//);
    }
    expect(NUTRITION.sources.map((source) => new URL(source.url).host)).toEqual(
      ["www.who.int", "www.who.int", "viendinhduong.vn"],
    );
  });

  it("has four stages that cover days 0 to 1856 with no gap and no overlap", () => {
    expect(
      NUTRITION.stages.map((stage) => [
        stage.id,
        stage.fromDay,
        stage.toDay,
        stage.title,
      ]),
    ).toEqual([
      ["0-6m", 0, 182, "0–6 tháng"],
      ["6-12m", 183, 364, "6–12 tháng"],
      ["1-2y", 365, 729, "1–2 tuổi"],
      ["2-5y", 730, 1856, "2–5 tuổi"],
    ]);
  });

  it("holds the lines of the spec, word for word", () => {
    expect(NUTRITION.stages.map((stage) => stage.items)).toEqual([
      [
        "Bú mẹ hoàn toàn nếu có thể, bú theo nhu cầu của bé; nếu không, dùng sữa công thức.",
        "Vitamin D mỗi ngày theo chỉ định của bác sĩ.",
        "Chưa ăn dặm, chưa cần uống thêm nước.",
      ],
      [
        "Bắt đầu ăn dặm từ khoảng 6 tháng, vẫn bú mẹ hoặc sữa công thức.",
        "Mỗi ngày có thức ăn giàu đạm và sắt: thịt, cá, trứng, đậu.",
        "Tăng dần độ đặc và số bữa: 2–3 bữa lúc 6–8 tháng, 3–4 bữa lúc 9–11 tháng.",
        "Không thêm muối, đường; không dùng mật ong trước 1 tuổi.",
      ],
      [
        "Ăn 3–4 bữa chính và 1–2 bữa phụ mỗi ngày.",
        "Mỗi ngày đủ bốn nhóm: tinh bột, đạm, chất béo, rau quả.",
        "Tiếp tục bú mẹ nếu có thể.",
        "Hạn chế đồ ngọt và nước ngọt.",
      ],
      [
        "Ăn cùng bữa với gia đình, mỗi ngày đủ đạm, rau quả, sữa.",
        "Hạn chế đồ ngọt, nước ngọt, đồ chiên rán và thức ăn nhanh.",
        "Khám và đo chiều cao định kỳ.",
      ],
    ]);
  });

  it("the schema refuses a key it does not know", () => {
    expect(
      NutritionContentSchema.safeParse({ ...NUTRITION, note: "x" }).success,
    ).toBe(false);
    const [first, ...rest] = NUTRITION.stages;
    expect(
      NutritionContentSchema.safeParse({
        ...NUTRITION,
        stages: [{ ...first, dose: "400 IU" }, ...rest],
      }).success,
    ).toBe(false);
  });
});

describe("nutritionStage", () => {
  const ids = (age: number) => {
    const { current, next } = nutritionStage(age);
    return [current?.id ?? null, next?.id ?? null];
  };

  it("gives the stage of the age and the one after it", () => {
    expect(ids(0)).toEqual(["0-6m", "6-12m"]);
    expect(ids(182)).toEqual(["0-6m", "6-12m"]);
    expect(ids(183)).toEqual(["6-12m", "1-2y"]);
    expect(ids(364)).toEqual(["6-12m", "1-2y"]);
    expect(ids(365)).toEqual(["1-2y", "2-5y"]);
    expect(ids(729)).toEqual(["1-2y", "2-5y"]);
  });

  it("the last stage has no next one", () => {
    expect(ids(730)).toEqual(["2-5y", null]);
    expect(ids(1856)).toEqual(["2-5y", null]);
  });

  it("past day 1856 there is no stage at all", () => {
    expect(ids(1857)).toEqual([null, null]);
    expect(ids(-1)).toEqual([null, null]);
  });
});
