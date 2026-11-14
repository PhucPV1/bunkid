import { describe, expect, it } from "vitest";
import type { TriageQuestion } from "@/lib/content/triage";
import {
  evaluateTriage,
  fastBreathingRate,
  goNowIf,
  parseCelsius,
  questionText,
  recentCelsius,
  temperatureFindings,
  visibleQuestions,
} from "./triage";

const q = (
  code: string,
  level: "red" | "yellow",
  extra: Partial<TriageQuestion> = {},
): TriageQuestion => ({
  code,
  group: "other",
  level,
  text: `${code} text`,
  short: `${code} short`,
  source: "https://example.org",
  reviewedAt: "2026-11-14",
  ...extra,
});

const questions = [
  q("breath", "red", { text: "Thở từ {fastBreathing} lần/phút" }),
  q("rash", "yellow"),
  q("convulsion", "red"),
  q("newborn_only", "red", { maxAgeDays: 1 }),
  q("diapers", "red", { minAgeDays: 6 }),
];

describe("fast breathing (spec §6.6)", () => {
  it("uses 60 / 50 / 40 breaths per minute by age", () => {
    expect([0, 59, 60, 364, 365, 700].map(fastBreathingRate)).toEqual([
      60, 60, 50, 50, 40, 40,
    ]);
    expect(questionText(questions[0], 61)).toBe("Thở từ 50 lần/phút");
  });
});

describe("visibleQuestions", () => {
  it("applies minAgeDays and maxAgeDays", () => {
    const codes = (age: number) =>
      visibleQuestions(questions, age).map((x) => x.code);
    expect(codes(0)).toEqual(["breath", "rash", "convulsion", "newborn_only"]);
    expect(codes(6)).toEqual(["breath", "rash", "convulsion", "diapers"]);
  });
});

describe("temperatureFindings (spec §6.6)", () => {
  it("covers every temperature rule at its boundary", () => {
    const level = (c: number | null, age: number) =>
      temperatureFindings(c, age).map((f) => f.level);
    expect(level(null, 30)).toEqual([]);
    expect(level(35.4, 200)).toEqual(["red"]);
    expect(level(35.5, 200)).toEqual([]);
    expect(level(38, 90)).toEqual(["red"]);
    expect(level(37.9, 90)).toEqual([]);
    expect(level(38, 91)).toEqual(["yellow"]);
    expect(level(39, 182)).toEqual(["red"]);
    expect(level(39, 183)).toEqual(["yellow"]);
    expect(level(40, 700)).toEqual(["red"]);
    expect(temperatureFindings(38.2, 30)[0].text).toBe(
      "Bé dưới 3 tháng sốt từ 38°C trở lên",
    );
  });
});

describe("evaluateTriage (red beats yellow)", () => {
  const run = (
    checked: string[],
    celsius: number | null = null,
    ageDays = 61,
  ) =>
    evaluateTriage({ questions, checked: new Set(checked), celsius, ageDays });

  it("is green with nothing ticked and a normal temperature", () => {
    expect(run([], 37.2)).toEqual({ level: "green", findings: [] });
  });

  it("is yellow when only yellow findings match", () => {
    expect(run(["rash"])).toEqual({
      level: "yellow",
      findings: [{ level: "yellow", text: "rash text" }],
    });
    expect(run([], 38.5, 120).level).toBe("yellow");
  });

  it("is red when any red finding matches, listing red ones first", () => {
    expect(run(["rash", "breath"], 38.5, 120)).toEqual({
      level: "red",
      findings: [
        { level: "red", text: "Thở từ 50 lần/phút" },
        { level: "yellow", text: "Bé đang sốt từ 38°C trở lên" },
        { level: "yellow", text: "rash text" },
      ],
    });
  });

  it("ignores a ticked question hidden for this age", () => {
    expect(run(["newborn_only"], null, 61).level).toBe("green");
  });
});

describe("goNowIf", () => {
  it("lists the fever threshold for the age, low temperature and the red signs", () => {
    expect(goNowIf(questions, 61)).toBe(
      "Đi khám ngay nếu xuất hiện: sốt từ 38°C, thân nhiệt dưới 35,5°C, breath short, convulsion short, diapers short.",
    );
    expect(goNowIf(questions, 400)).toMatch(
      /^Đi khám ngay nếu xuất hiện: sốt từ 40°C,/,
    );
  });
});

describe("step 1 helpers", () => {
  const now = new Date("2026-11-14T10:00:00Z");
  const log = (type: string, hoursAgo: number, details: unknown) => ({
    type,
    started_at: new Date(now.getTime() - hoursAgo * 3_600_000).toISOString(),
    details,
  });

  it("recentCelsius takes the newest temperature of the last 6 hours", () => {
    expect(
      recentCelsius(
        [
          log("temperature", 1, { celsius: 38.4 }),
          log("temperature", 0.5, { celsius: 38.9 }),
          log("diaper", 0.1, { wet: true }),
        ],
        now,
      ),
    ).toBe(38.9);
    expect(
      recentCelsius([log("temperature", 6.1, { celsius: 39 })], now),
    ).toBeNull();
  });

  it("parseCelsius accepts a comma and 30–43°C", () => {
    expect(parseCelsius("38,5")).toBe(38.5);
    expect(parseCelsius("33,8")).toBe(33.8);
    expect(parseCelsius("29,9")).toBe("bad");
    expect(parseCelsius(" ")).toBeNull();
    expect(parseCelsius("44")).toBe("bad");
    expect(parseCelsius("abc")).toBe("bad");
  });
});
