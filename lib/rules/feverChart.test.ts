import { describe, expect, it } from "vitest";
import type { LogLike } from "./describeLog";
import { type EpisodeLike, feverChartModel } from "./illness";

const vn = (text: string) => new Date(`${text.replace(" ", "T")}:00+07:00`);
const iso = (text: string) => vn(text).toISOString();
const episode = (start: string, end: string | null = null): EpisodeLike => ({
  id: "ep1",
  started_at: iso(start),
  ended_at: end === null ? null : iso(end),
});
const temp = (time: string, celsius: number): LogLike => ({
  type: "temperature",
  started_at: iso(time),
  ended_at: iso(time),
  details: { celsius, method: "nach" },
});
const dose = (time: string): LogLike => ({
  type: "medicine",
  started_at: iso(time),
  ended_at: iso(time),
  details: { name: "Hapacol", amount: 2.5, unit: "ml", antipyretic: true },
});
const round = (value: number) => Math.round(value * 1000) / 1000;

// Spec 2026-11-26 §6.5.
describe("feverChartModel", () => {
  it("is null when the episode has no reading", () => {
    const open = episode("2026-11-25 08:00");
    const now = vn("2026-11-25 12:00");
    expect(feverChartModel([], open, now)).toBeNull();
    // A reading before the episode and a dose are not readings of the episode.
    expect(
      feverChartModel(
        [temp("2026-11-25 07:00", 39), dose("2026-11-25 09:00")],
        open,
        now,
      ),
    ).toBeNull();
  });

  it("one day: the whole of today, 36 to 40 degrees, the fever line in the middle", () => {
    const chart = feverChartModel(
      [temp("2026-11-25 12:00", 38.6), dose("2026-11-25 18:00")],
      episode("2026-11-25 08:00"),
      vn("2026-11-25 20:00"),
    )!;
    expect(chart.truncated).toBe(false);
    expect(chart.days).toEqual([
      { day: "2026-11-25", label: "Hôm nay", x: 0.5 },
    ]);
    expect(chart.dividers).toEqual([]);
    expect(chart.ticks).toEqual([
      { celsius: 36, y: 0 },
      { celsius: 37, y: 0.25 },
      { celsius: 38, y: 0.5 },
      { celsius: 39, y: 0.75 },
      { celsius: 40, y: 1 },
    ]);
    expect(chart.feverY).toBe(0.5);
    expect(chart.points).toHaveLength(1);
    expect(chart.points[0]).toMatchObject({
      celsius: 38.6,
      x: 0.5,
      latest: true,
      label: { text: "38,6", anchor: "middle", place: "above" },
    });
    expect(round(chart.points[0].y)).toBe(0.65);
    expect(chart.doses).toEqual([
      { at: vn("2026-11-25 18:00").getTime(), x: 0.75 },
    ]);
    expect(chart.ariaLabel).toBe(
      "Biểu đồ nhiệt độ: 1 lần đo, cao nhất 38,6°C, 1 liều hạ sốt.",
    );
  });

  it("three days: a label in the middle of each day, a divider between days", () => {
    const logs = [
      temp("2026-11-24 23:40", 38.4),
      temp("2026-11-25 15:00", 39.2),
      temp("2026-11-26 09:00", 37.6),
      dose("2026-11-25 15:10"),
      dose("2026-11-24 23:00"), // before the episode
    ];
    const open = episode("2026-11-24 23:30");
    const now = vn("2026-11-26 10:00");
    const chart = feverChartModel(logs, open, now)!;
    expect(chart.days.map((day) => [day.label, round(day.x)])).toEqual([
      ["24/11", 0.167],
      ["25/11", 0.5],
      ["Hôm nay", 0.833],
    ]);
    expect(chart.dividers.map(round)).toEqual([0.333, 0.667]);
    expect(chart.points.map((point) => point.celsius)).toEqual([
      38.4, 39.2, 37.6,
    ]);
    expect(chart.doses).toHaveLength(1);
    // The same answer for the array in any order.
    expect(feverChartModel([...logs].reverse(), open, now)).toEqual(chart);
    expect(
      feverChartModel([logs[2], logs[0], logs[4], logs[1], logs[3]], open, now),
    ).toEqual(chart);
  });

  it("labels the newest point and the highest one from 38,0; one label when they are the same point", () => {
    const open = episode("2026-11-24 08:00");
    const now = vn("2026-11-26 10:00");
    const labels = (logs: LogLike[]) =>
      feverChartModel(logs, open, now)!.points.map((point) =>
        point.label ? point.label.text : null,
      );
    expect(
      labels([
        temp("2026-11-24 09:00", 38.4),
        temp("2026-11-24 20:00", 39.2),
        temp("2026-11-26 09:00", 37.6),
      ]),
    ).toEqual([null, "39,2", "37,6"]);
    expect(
      labels([temp("2026-11-24 09:00", 38.4), temp("2026-11-26 09:00", 39)]),
    ).toEqual([null, "39"]);
    // No reading from 38,0: only the newest point has a label.
    expect(
      labels([temp("2026-11-24 09:00", 37.8), temp("2026-11-26 09:00", 37.2)]),
    ).toEqual([null, "37,2"]);
    // Two equal highest readings: the later one carries the label.
    expect(
      labels([
        temp("2026-11-24 09:00", 39.2),
        temp("2026-11-25 09:00", 39.2),
        temp("2026-11-26 09:00", 37.2),
      ]),
    ).toEqual([null, "39,2", "37,2"]);
  });

  it("only the newest point is marked latest", () => {
    const chart = feverChartModel(
      [temp("2026-11-24 09:00", 38.4), temp("2026-11-24 20:00", 39.2)],
      episode("2026-11-24 08:00"),
      vn("2026-11-24 21:00"),
    )!;
    expect(chart.points.map((point) => point.latest)).toEqual([false, true]);
  });

  it("a label near an edge is anchored to stay inside the plot", () => {
    const chart = feverChartModel(
      [temp("2026-11-24 00:30", 39.4), temp("2026-11-26 23:30", 38.2)],
      episode("2026-11-24 00:10"),
      vn("2026-11-26 23:40"),
    )!;
    expect(chart.points.map((point) => point.label?.anchor)).toEqual([
      "start",
      "end",
    ]);
  });

  it("the newest label moves beside its dot when above it would cover the highest reading's label", () => {
    const open = episode("2026-11-24 08:00");
    const now = vn("2026-11-24 22:00");
    const places = (logs: LogLike[]) =>
      feverChartModel(logs, open, now)!.points.map(
        (point) => point.label?.place,
      );
    expect(
      places([temp("2026-11-24 12:00", 39.2), temp("2026-11-24 13:00", 38.9)]),
    ).toEqual(["above", "side"]);
    // Far apart in time, or far apart in degrees: both stay above.
    expect(
      places([temp("2026-11-24 09:00", 39.2), temp("2026-11-24 20:00", 38.9)]),
    ).toEqual(["above", "above"]);
    expect(
      places([temp("2026-11-24 12:00", 39.6), temp("2026-11-24 13:00", 36.8)]),
    ).toEqual(["above", "above"]);
  });

  it("a lower reading soon after a higher one: its label does not cover the earlier dot", () => {
    // Three days; the fever is coming down. The earlier dot of today has no
    // label of its own, and the newest label above its dot would sit on it.
    const chart = feverChartModel(
      [
        temp("2026-11-25 15:00", 39.2),
        temp("2026-11-26 08:00", 38.6),
        temp("2026-11-26 09:00", 38.1),
      ],
      episode("2026-11-24 23:30"),
      vn("2026-11-26 10:00"),
    )!;
    expect(chart.points.map((point) => point.label)).toEqual([
      { text: "39,2", anchor: "middle", place: "above" },
      null,
      { text: "38,1", anchor: "start", place: "side" },
    ]);
  });

  it("near the right edge there is no room beside the dot: the label goes under it", () => {
    const chart = feverChartModel(
      [temp("2026-11-24 22:00", 38.6), temp("2026-11-24 23:00", 38.1)],
      episode("2026-11-24 00:10"),
      vn("2026-11-24 23:50"),
    )!;
    expect(chart.points[1].label).toEqual({
      text: "38,1",
      anchor: "end",
      place: "below",
    });
    // Above and under both taken (the fever went down, then up again): the
    // label goes beside the dot on the left.
    const zigzag = feverChartModel(
      [
        temp("2026-11-26 14:00", 38.8),
        temp("2026-11-26 17:00", 37.6),
        temp("2026-11-26 20:00", 38.3),
      ],
      episode("2026-11-24 23:30"),
      vn("2026-11-26 21:00"),
    )!;
    expect(zigzag.points.map((point) => point.label)).toEqual([
      { text: "38,8", anchor: "middle", place: "above" },
      null,
      { text: "38,3", anchor: "end", place: "side" },
    ]);
    // Low on the scale as well: nothing fits, so it stays above.
    const low = feverChartModel(
      [temp("2026-11-24 22:00", 36.9), temp("2026-11-24 23:00", 36.5)],
      episode("2026-11-24 00:10"),
      vn("2026-11-24 23:50"),
    )!;
    expect(low.points[1].label?.place).toBe("above");
  });

  it("the word Sốt takes the first of right, left, middle that no dot and no label reaches", () => {
    const open = episode("2026-11-24 00:10");
    const now = vn("2026-11-24 23:50");
    const word = (logs: LogLike[], of: EpisodeLike = open, at: Date = now) =>
      feverChartModel(logs, of, at)!.feverWord;
    expect(word([temp("2026-11-24 12:00", 39.8)])).toBe("end");
    // A dot high up near the right edge.
    expect(word([temp("2026-11-24 22:00", 39.8)])).toBe("start");
    // On the right but well under the top band: the word stays.
    expect(word([temp("2026-11-24 22:00", 38.6)])).toBe("end");
    // The newest reading 39,1 late on the last of three days: its label,
    // anchored at its end, reaches the top right corner.
    expect(
      word(
        [temp("2026-11-26 20:00", 39.1)],
        episode("2026-11-24 23:30"),
        vn("2026-11-26 21:00"),
      ),
    ).toBe("start");
    // Right and left both taken: the middle.
    expect(
      word([temp("2026-11-24 01:00", 39.9), temp("2026-11-24 22:00", 39.8)]),
    ).toBe("middle");
    // All three taken: it stays on the right.
    expect(
      word([
        temp("2026-11-24 01:00", 39.9),
        temp("2026-11-24 12:00", 39.9),
        temp("2026-11-24 22:00", 39.8),
      ]),
    ).toBe("end");
  });

  it("the scale grows by whole degrees to hold a low and a very high reading", () => {
    const chart = feverChartModel(
      [temp("2026-11-24 09:00", 35.2), temp("2026-11-24 20:00", 40.6)],
      episode("2026-11-24 08:00"),
      vn("2026-11-24 21:00"),
    )!;
    expect(chart.ticks.map((tick) => tick.celsius)).toEqual([
      35, 36, 37, 38, 39, 40, 41,
    ]);
    expect(chart.feverY).toBe(0.5);
    expect(round(chart.points[1].y)).toBe(0.933);
  });

  it("more than 7 days: only the last 7, and it says so", () => {
    const logs = [
      temp("2026-11-18 09:00", 39.8), // day 1, outside the window
      dose("2026-11-18 09:10"),
      temp("2026-11-21 09:00", 38.8),
      temp("2026-11-27 09:00", 37),
      dose("2026-11-21 09:10"),
    ];
    const chart = feverChartModel(
      logs,
      episode("2026-11-18 08:00"),
      vn("2026-11-27 10:00"),
    )!;
    expect(chart.truncated).toBe(true);
    expect(chart.days.map((day) => day.label)).toEqual([
      "21/11",
      "22/11",
      "23/11",
      "24/11",
      "25/11",
      "26/11",
      "Hôm nay",
    ]);
    expect(chart.dividers).toHaveLength(6);
    expect(chart.points.map((point) => point.celsius)).toEqual([38.8, 37]);
    expect(chart.points[0].label?.text).toBe("38,8");
    expect(chart.doses).toHaveLength(1);
    expect(chart.ariaLabel).toBe(
      "Biểu đồ nhiệt độ, 7 ngày gần nhất: 2 lần đo, cao nhất 38,8°C, 1 liều hạ sốt.",
    );
  });

  it("exactly 7 days is not cut", () => {
    const chart = feverChartModel(
      [temp("2026-11-21 09:00", 38.8)],
      episode("2026-11-21 08:00"),
      vn("2026-11-27 10:00"),
    )!;
    expect(chart.truncated).toBe(false);
    expect(chart.days).toHaveLength(7);
  });

  it("readings only before the window: an empty frame, not the empty state", () => {
    const chart = feverChartModel(
      [temp("2026-11-18 09:00", 39.8)],
      episode("2026-11-18 08:00"),
      vn("2026-11-27 10:00"),
    )!;
    expect(chart.points).toEqual([]);
    expect(chart.ticks.map((tick) => tick.celsius)).toEqual([
      36, 37, 38, 39, 40,
    ]);
    expect(chart.ariaLabel).toBe(
      "Biểu đồ nhiệt độ, 7 ngày gần nhất: 0 lần đo, 0 liều hạ sốt.",
    );
  });

  it("a closed episode ends on the day of its end, by its date", () => {
    const chart = feverChartModel(
      [temp("2026-11-20 09:00", 38.8), temp("2026-11-21 09:00", 37)],
      episode("2026-11-20 08:00", "2026-11-21 12:00"),
      vn("2026-11-27 10:00"),
    )!;
    expect(chart.days.map((day) => day.label)).toEqual(["20/11", "21/11"]);
    expect(chart.points[1].latest).toBe(true);
  });
});
