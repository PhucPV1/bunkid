import { describe, expect, it } from "vitest";
import { metricText, RATING_LABEL } from "@/lib/rules/summaryText";

describe("metricText", () => {
  it("formats a rated sleep total", () => {
    expect(
      metricText("sleep", {
        status: "rated",
        rating: "green",
        value: 900,
        explain: "Bé ngủ đủ (chuẩn 14–17 giờ)",
      }),
    ).toEqual({
      label: "Giấc ngủ",
      value: "15 giờ 00 phút",
      note: "Bé ngủ đủ (chuẩn 14–17 giờ)",
      rating: "green",
    });
  });
  it("shows the count without a rating when the age band is not rated", () => {
    expect(metricText("feeds", { status: "not-rated", value: 7 })).toEqual({
      label: "Cữ bú",
      value: "7 cữ",
      note: "Không đánh giá ở tuổi này",
      rating: null,
    });
  });
  it("shows a dash when there is not enough data", () => {
    expect(metricText("wet", { status: "no-data" })).toEqual({
      label: "Tã ướt",
      value: "—",
      note: "Chưa đủ dữ liệu",
      rating: null,
    });
  });
  it("labels each rating", () => {
    expect(RATING_LABEL).toEqual({
      green: "Tốt",
      yellow: "Lưu ý",
      red: "Nguy cơ",
    });
  });
});
