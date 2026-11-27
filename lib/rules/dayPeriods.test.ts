import { describe, expect, it } from "vitest";
import {
  DAY_PERIODS,
  dayPeriods,
  defaultOpenPeriod,
  firstScreenDays,
  openPeriods,
  periodListId,
  periodOf,
  periodOpenKey,
  periodSummary,
  type OpenPeriodDay,
} from "./dayPeriods";
import { daySummary } from "./history";

// A VN wall-clock time on a VN day, as the ISO string logs carry.
const vn = (hhmm: string, day = "2026-11-14") =>
  new Date(`${day}T${hhmm}+07:00`).toISOString();
const entry = (
  type: string,
  start: string,
  end: string | null = start,
  details: unknown = {},
) => ({ type, started_at: start, ended_at: end, details });
const keys = (periods: { key: string }[]) => periods.map((p) => p.key);
const AFTER = new Date(vn("09:00", "2026-11-16")); // two days later

describe("periodOf", () => {
  it("cuts the VN day at 6, 12 and 18 o'clock", () => {
    expect(periodOf(vn("00:00"))).toBe("night");
    expect(periodOf(vn("05:59"))).toBe("night");
    expect(periodOf(vn("06:00"))).toBe("morning");
    expect(periodOf(vn("11:59"))).toBe("morning");
    expect(periodOf(vn("12:00"))).toBe("afternoon");
    expect(periodOf(vn("17:59"))).toBe("afternoon");
    expect(periodOf(vn("18:00"))).toBe("evening");
    expect(periodOf(vn("23:59"))).toBe("evening");
  });

  it("labels the periods latest first", () => {
    expect(DAY_PERIODS.map((p) => p.label)).toEqual([
      "Tối · 18–24 giờ",
      "Chiều · 12–18 giờ",
      "Sáng · 6–12 giờ",
      "Đêm · 0–6 giờ",
    ]);
  });
});

describe("periodSummary", () => {
  it("drops the parts that are 0, and counts the logs when all three are", () => {
    expect(
      periodSummary({ feeds: 3, diapers: 2, sleepMinutes: 130, count: 9 }),
    ).toBe("3 cữ · 2 tã · ngủ 2g 10p");
    expect(
      periodSummary({ feeds: 0, diapers: 1, sleepMinutes: 0, count: 1 }),
    ).toBe("1 tã");
    expect(
      periodSummary({ feeds: 0, diapers: 0, sleepMinutes: 260, count: 0 }),
    ).toBe("ngủ 4g 20p");
    expect(
      periodSummary({ feeds: 0, diapers: 0, sleepMinutes: 0, count: 1 }),
    ).toBe("1 mục");
  });
});

describe("dayPeriods", () => {
  it("a past day has all four periods, latest first; one with nothing is empty", () => {
    const logs = [
      entry("diaper", vn("13:00"), vn("13:00"), { wet: true, dirty: false }),
    ];
    const { periods } = dayPeriods({
      day: "2026-11-14",
      logs,
      all: logs,
      filter: "all",
      now: AFTER,
    });
    expect(keys(periods)).toEqual(["evening", "afternoon", "morning", "night"]);
    expect(periods[1]).toEqual({
      key: "afternoon",
      label: "Chiều · 12–18 giờ",
      summary: "1 tã",
      logs,
      kind: "logs",
    });
    expect(periods[0]).toEqual({
      key: "evening",
      label: "Tối · 18–24 giờ",
      summary: "",
      logs: [],
      kind: "empty",
    });
  });

  it("today shows the periods that have begun", () => {
    const at10 = dayPeriods({
      day: "2026-11-14",
      logs: [],
      all: [],
      filter: "all",
      now: new Date(vn("10:00")),
    });
    expect(keys(at10.periods)).toEqual(["morning", "night"]);
    const at12 = dayPeriods({
      day: "2026-11-14",
      logs: [],
      all: [],
      filter: "all",
      now: new Date(vn("12:00")),
    });
    expect(keys(at12.periods)).toEqual(["afternoon", "morning", "night"]);
  });

  it("today keeps a period whose log starts a moment after now", () => {
    const early = entry("bottle", vn("12:00:20"), vn("12:00:20"), {
      ml: 90,
      milk: "formula",
    });
    const { periods } = dayPeriods({
      day: "2026-11-14",
      logs: [early],
      all: [early],
      filter: "all",
      now: new Date(vn("11:59:40")),
    });
    expect(keys(periods)).toEqual(["afternoon", "morning", "night"]);
    expect(periods[0].kind).toBe("logs");
    expect(periods[0].logs).toEqual([early]);
  });

  it("a filter keeps only the periods with a matching log, and their matching logs", () => {
    const bottle = entry("bottle", vn("07:00"), vn("07:00"), {
      ml: 90,
      milk: "formula",
    });
    const diaper = entry("diaper", vn("08:00"), vn("08:00"), {
      wet: true,
      dirty: false,
    });
    const nap = entry("sleep", vn("13:00"), vn("14:00"));
    const night = entry("sleep", vn("21:00", "2026-11-13"), vn("05:00"));
    const logs = [nap, diaper, bottle];
    const all = [...logs, night];
    const { periods } = dayPeriods({
      day: "2026-11-14",
      logs,
      all,
      filter: "feed",
      now: AFTER,
    });
    expect(keys(periods)).toEqual(["morning"]);
    expect(periods[0].logs).toEqual([bottle]);
    // The summary still counts every log of the period.
    expect(periods[0].summary).toBe("1 cữ · 1 tã");
    expect(
      keys(
        dayPeriods({ day: "2026-11-14", logs, all, filter: "all", now: AFTER })
          .periods,
      ),
    ).toEqual(["evening", "afternoon", "morning", "night"]);
  });

  it("counts feed sessions, diapers and sleep in the summary", () => {
    const logs = [
      entry("sleep", vn("09:50"), vn("11:00")),
      entry("diaper", vn("09:40"), vn("09:40"), { wet: true, dirty: true }),
      entry("bottle", vn("09:30"), vn("09:30"), { ml: 90, milk: "formula" }),
      entry("breast", vn("08:00"), vn("08:15"), { side: "left" }),
      entry("breast", vn("08:20"), vn("08:30"), { side: "right" }),
      entry("diaper", vn("07:10"), vn("07:10"), { wet: true, dirty: false }),
      entry("sleep", vn("06:30"), vn("07:30")),
      entry("breast", vn("06:10"), vn("06:25"), { side: "left" }),
    ];
    const { periods } = dayPeriods({
      day: "2026-11-14",
      logs,
      all: logs,
      filter: "all",
      now: AFTER,
    });
    expect(periods[2].summary).toBe("3 cữ · 2 tã · ngủ 2g 10p");
  });

  it("a feed across a boundary counts once, where it began", () => {
    const left = entry("breast", vn("11:55"), vn("12:00"), { side: "left" });
    const right = entry("breast", vn("12:05"), vn("12:15"), { side: "right" });
    const logs = [right, left];
    const { periods } = dayPeriods({
      day: "2026-11-14",
      logs,
      all: logs,
      filter: "all",
      now: AFTER,
    });
    expect(periods[1]).toMatchObject({ key: "afternoon", summary: "1 mục" });
    expect(periods[2]).toMatchObject({ key: "morning", summary: "1 cữ" });
  });

  it("a period with only medicine counts its logs", () => {
    const dose = entry("medicine", vn("07:00"), vn("07:00"), {
      name: "Vitamin D3",
      amount: 1,
      unit: "giọt",
    });
    const { periods } = dayPeriods({
      day: "2026-11-14",
      logs: [dose],
      all: [dose],
      filter: "all",
      now: AFTER,
    });
    expect(periods[2].summary).toBe("1 mục");
  });

  it("a night that began the evening before makes Đêm sleep-only", () => {
    const night = entry("sleep", vn("21:00", "2026-11-13"), vn("06:30"));
    const { periods } = dayPeriods({
      day: "2026-11-14",
      logs: [],
      all: [night],
      filter: "all",
      now: AFTER,
    });
    expect(periods[3]).toEqual({
      key: "night",
      label: "Đêm · 0–6 giờ",
      summary: "ngủ 6g",
      logs: [],
      kind: "sleepOnly",
    });
    expect(periods[2]).toMatchObject({ kind: "sleepOnly", summary: "ngủ 30p" });
    const short = entry("sleep", vn("23:00", "2026-11-13"), vn("05:00"));
    expect(
      dayPeriods({
        day: "2026-11-14",
        logs: [],
        all: [short],
        filter: "all",
        now: AFTER,
      }).periods[3].summary,
    ).toBe("ngủ 5g");
  });

  it("the periods' sleep adds up to the day's", () => {
    const night = entry("sleep", vn("21:00", "2026-11-13"), vn("06:30"));
    const nap = entry("sleep", vn("11:20"), vn("13:05"));
    const evening = entry("sleep", vn("19:00"), vn("02:00", "2026-11-15"));
    const logs = [evening, nap];
    const all = [...logs, night];
    const { periods } = dayPeriods({
      day: "2026-11-14",
      logs,
      all,
      filter: "all",
      now: AFTER,
    });
    expect(periods.map((p) => p.summary)).toEqual([
      "ngủ 5g",
      "ngủ 1g 5p",
      "ngủ 1g 10p",
      "ngủ 6g",
    ]);
    expect(daySummary({ day: "2026-11-14", logs, all, now: AFTER })).toBe(
      "0 cữ · 0 tã · ngủ 13g 15p",
    );
  });

  it("counts a running sleep up to now", () => {
    const running = entry("sleep", vn("09:00"), null);
    const { periods } = dayPeriods({
      day: "2026-11-14",
      logs: [running],
      all: [running],
      filter: "all",
      now: new Date(vn("09:45")),
    });
    expect(periods[0]).toMatchObject({ key: "morning", summary: "ngủ 45p" });
  });

  it("symptom logs go above the periods and leave them as they were", () => {
    const symptom = entry("symptom", vn("12:00"), vn("12:00"), {
      codes: ["cough"],
    });
    const out = dayPeriods({
      day: "2026-11-14",
      logs: [symptom],
      all: [symptom],
      filter: "all",
      now: AFTER,
    });
    expect(out.symptoms).toEqual([symptom]);
    expect(out.periods.every((p) => p.kind === "empty")).toBe(true);
    expect(
      dayPeriods({
        day: "2026-11-14",
        logs: [symptom],
        all: [symptom],
        filter: "temperature",
        now: AFTER,
      }).symptoms,
    ).toEqual([symptom]);
    expect(
      dayPeriods({
        day: "2026-11-14",
        logs: [symptom],
        all: [symptom],
        filter: "feed",
        now: AFTER,
      }),
    ).toEqual({ symptoms: [], periods: [] });
  });
});

describe("defaultOpenPeriod", () => {
  const day = (name: string, kinds: [string, string][]) => ({
    day: name,
    periods: kinds.map(([key, kind]) => ({ key, kind })) as {
      key: "night" | "morning" | "afternoon" | "evening";
      kind: "logs" | "sleepOnly" | "empty";
    }[],
  });

  it("is today's latest period with logs", () => {
    const now = new Date(vn("12:05"));
    const days = [
      day("2026-11-14", [
        ["afternoon", "empty"],
        ["morning", "logs"],
        ["night", "logs"],
      ]),
      day("2026-11-13", [["evening", "logs"]]),
    ];
    expect(defaultOpenPeriod(days, now)).toBe("2026-11-14|morning");
  });

  it("is none when today has no logs or is not loaded", () => {
    const now = new Date(vn("12:05"));
    expect(
      defaultOpenPeriod(
        [
          day("2026-11-14", [
            ["afternoon", "empty"],
            ["morning", "sleepOnly"],
          ]),
        ],
        now,
      ),
    ).toBeNull();
    expect(
      defaultOpenPeriod([day("2026-11-13", [["evening", "logs"]])], now),
    ).toBeNull();
  });
});

describe("periodOpenKey and periodListId", () => {
  it("name a period of a day", () => {
    expect(periodOpenKey("2026-11-14", "afternoon")).toBe(
      "2026-11-14|afternoon",
    );
    expect(periodListId("2026-11-14", "afternoon")).toBe(
      "p-2026-11-14-afternoon",
    );
  });
});

describe("openPeriods", () => {
  const p = (key: "night" | "morning" | "evening", kind: string) => ({
    key,
    label: key,
    summary: "",
    logs: kind === "logs" ? ["x"] : [],
    kind: kind as "logs" | "sleepOnly" | "empty",
  });
  const days = [
    {
      day: "2026-11-14",
      summary: "",
      symptoms: [],
      periods: [p("morning", "logs"), p("night", "logs")],
    },
    {
      day: "2026-11-13",
      summary: "",
      symptoms: [],
      periods: [p("evening", "logs"), p("night", "sleepOnly")],
    },
  ];
  const now = new Date(vn("10:00"));
  const open = (out: OpenPeriodDay<string>[]) =>
    out.flatMap((d) => d.periods.map((x) => x.open));

  it("Tất cả opens only the default period", () => {
    expect(
      open(openPeriods(days, { filter: "all", now, overrides: {} })),
    ).toEqual([true, false, false, false]);
  });

  it("a tap overrides the default either way", () => {
    expect(
      open(
        openPeriods(days, {
          filter: "all",
          now,
          overrides: {
            "2026-11-14|morning": false,
            "2026-11-13|evening": true,
          },
        }),
      ),
    ).toEqual([false, false, true, false]);
  });

  it("a filter opens every period with logs; a sleep-only period never opens", () => {
    expect(
      open(openPeriods(days, { filter: "feed", now, overrides: {} })),
    ).toEqual([true, true, true, false]);
    expect(
      open(
        openPeriods(days, {
          filter: "feed",
          now,
          overrides: { "2026-11-14|night": false, "2026-11-13|night": true },
        }),
      ),
    ).toEqual([true, false, true, false]);
  });
});

describe("firstScreenDays", () => {
  const p = (key: "night" | "morning", count: number, open: boolean) => ({
    key,
    label: key,
    summary: "",
    logs: Array.from({ length: count }, (_, i) => `${key}-${i}`),
    kind: "logs" as const,
    open,
  });
  const d = (
    day: string,
    symptoms: number,
    periods: ReturnType<typeof p>[],
  ): OpenPeriodDay<string> => ({
    day,
    summary: "",
    symptoms: Array.from({ length: symptoms }, (_, i) => `${day}-s${i}`),
    periods,
  });

  it("counts only symptom rows and rows of open periods", () => {
    const days = [
      d("a", 1, [p("morning", 5, true), p("night", 30, false)]),
      d("b", 0, [p("morning", 20, false)]),
    ];
    expect(firstScreenDays(days, 12)).toEqual(days);
  });

  it("cuts the open rows it reaches to the budget, and stops at the next day", () => {
    const days = [
      d("a", 2, [p("morning", 8, true), p("night", 6, true)]),
      d("b", 0, [p("morning", 3, true)]),
    ];
    const shown = firstScreenDays(days, 12);
    expect(shown).toHaveLength(1);
    expect(shown[0].symptoms).toHaveLength(2);
    expect(shown[0].periods.map((x) => x.logs.length)).toEqual([8, 2]);
    expect(days[0].periods[1].logs).toHaveLength(6);
  });

  it("returns every day when they fit", () => {
    expect(firstScreenDays([], 12)).toEqual([]);
  });
});
