import { describe, expect, it } from "vitest";
import type { LogLike } from "./describeLog";
import type { DayRatings } from "./ratings";
import {
  homeStatTiles,
  metricText,
  RATING_LABEL,
  shortDuration,
  totalsLine,
} from "./summaryText";

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

const NOW = new Date("2026-11-14T05:00:00Z");
const H = 3_600_000;
const ago = (hours: number) =>
  new Date(NOW.getTime() - hours * H).toISOString();
const log = (
  type: string,
  start: number,
  end: number,
  details: unknown,
): LogLike => ({
  type,
  started_at: ago(start),
  ended_at: ago(end),
  details,
});
const LOGS: LogLike[] = [
  log("sleep", 5, 2.5, {}),
  log("bottle", 1, 1, { ml: 90, milk: "formula" }),
  log("breast", 4, 3.8, { side: "left" }),
  log("diaper", 2, 2, { wet: true, dirty: false }),
  log("diaper", 6, 6, { wet: true, dirty: true }),
  log("diaper", 7, 7, { wet: false, dirty: true }),
];
const rated = (rating: "green" | "yellow" | "red", value: number) => ({
  status: "rated" as const,
  rating,
  value,
  explain: "x",
});

describe("homeStatTiles", () => {
  it("always shows the counts from the last 24 hours", () => {
    const ratings: DayRatings = {
      sleepMinutes: { status: "no-data" },
      feeds: { status: "no-data" },
      wetDiapers: { status: "no-data" },
    };
    expect(homeStatTiles({ ratings, logs: LOGS, now: NOW })).toEqual([
      {
        label: "Giấc ngủ",
        value: "2g 30p",
        note: "Đánh giá sau 24 giờ đầu",
        tone: "muted",
      },
      {
        label: "Cữ bú",
        value: "2",
        note: "Đánh giá sau 24 giờ đầu",
        tone: "muted",
      },
      {
        label: "Tã ướt",
        value: "2",
        note: "Đánh giá sau 24 giờ đầu",
        tone: "muted",
      },
    ]);
  });

  it("labels and colours each rating", () => {
    const ratings: DayRatings = {
      sleepMinutes: rated("green", 150),
      feeds: rated("yellow", 2),
      wetDiapers: rated("red", 2),
    };
    expect(
      homeStatTiles({ ratings, logs: LOGS, now: NOW }).map((t) => [
        t.note,
        t.tone,
      ]),
    ).toEqual([
      ["Bình thường", "good"],
      ["Cần chú ý", "warn"],
      ["Báo bác sĩ", "danger"],
    ]);
  });

  it("says when the age is not rated", () => {
    const ratings: DayRatings = {
      sleepMinutes: { status: "not-rated", value: 150 },
      feeds: { status: "not-rated", value: 2 },
      wetDiapers: { status: "not-rated", value: 2 },
    };
    expect(homeStatTiles({ ratings, logs: LOGS, now: NOW })[0]).toEqual({
      label: "Giấc ngủ",
      value: "2g 30p",
      note: "Không đánh giá ở tuổi này",
      tone: "muted",
    });
  });
});

describe("short texts", () => {
  it("shortDuration writes hours and minutes as Xg Yp", () => {
    expect(shortDuration(0)).toBe("0p");
    expect(shortDuration(45)).toBe("45p");
    expect(shortDuration(120)).toBe("2g");
    expect(shortDuration(785)).toBe("13g 5p");
  });

  it("totalsLine shows bottle ml and dirty diapers", () => {
    expect(totalsLine({ bottleMl: 180, dirtyDiapers: 2 })).toBe(
      "Bình 180 ml · Tã bẩn 2",
    );
  });
});
