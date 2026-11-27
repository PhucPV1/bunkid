import { describe, expect, it } from "vitest";
import type { LogLike } from "./describeLog";
import { type EpisodeLike, feverChartModel } from "./illness";

const vn = (text: string) => new Date(`${text.replace(" ", "T")}:00+07:00`);
const at = (text: string) => vn(text).getTime();
const episode = (start: string): EpisodeLike => ({
  id: "ep1",
  started_at: vn(start).toISOString(),
  ended_at: null,
});
const temp = (time: string, celsius: number): LogLike => ({
  type: "temperature",
  started_at: vn(time).toISOString(),
  ended_at: vn(time).toISOString(),
  details: { celsius, method: "nach" },
});
const round = (value: number) => Math.round(value * 1000) / 1000;
const marks = (chart: ReturnType<typeof feverChartModel>) =>
  chart!.visits.map((visit) => ({ ...visit, x: round(visit.x) }));

// Spec 2026-11-26 §6.5 from M5: a dashed line with the word "Khám" above it.
describe("feverChartModel, visits", () => {
  const oneDay = (visits?: number[]) =>
    feverChartModel(
      [temp("2026-11-25 09:00", 38.6)],
      episode("2026-11-25 08:00"),
      vn("2026-11-25 20:00"),
      visits,
    );

  it("no visit: no mark", () => {
    expect(oneDay()!.visits).toEqual([]);
    expect(oneDay([])!.visits).toEqual([]);
  });

  it("a visit sits at its time; the word is centred on it", () => {
    expect(marks(oneDay([at("2026-11-25 12:00")]))).toEqual([
      { x: 0.5, word: "middle" },
    ]);
  });

  it("near an edge the word is anchored to stay inside the plot", () => {
    expect(
      marks(oneDay([at("2026-11-25 01:00"), at("2026-11-25 23:00")])),
    ).toEqual([
      { x: 0.042, word: "start" },
      { x: 0.958, word: "end" },
    ]);
  });

  it("oldest first; a word that would touch the one before it is left out, its line stays", () => {
    expect(
      marks(
        oneDay([
          at("2026-11-25 16:00"),
          at("2026-11-25 12:00"),
          at("2026-11-25 13:00"),
        ]),
      ),
    ).toEqual([
      { x: 0.5, word: "middle" },
      { x: 0.542, word: null },
      { x: 0.667, word: "middle" },
    ]);
  });

  it("a visit outside the days drawn is not marked", () => {
    const chart = feverChartModel(
      [temp("2026-11-19 09:00", 38.6)],
      episode("2026-11-10 08:00"),
      vn("2026-11-20 10:00"),
      [at("2026-11-12 09:00"), at("2026-11-19 12:00")],
    );
    expect(chart!.truncated).toBe(true);
    expect(chart!.visits).toHaveLength(1);
    // The 19th is the 6th of the 7 days drawn (14th to 20th).
    expect(chart!.visits[0].x).toBeCloseTo(5.5 / 7);
  });
});
