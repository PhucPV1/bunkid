import { describe, expect, it } from "vitest";
import { addDays } from "./days";
import type { LogLike } from "./describeLog";
import { type EpisodeLike, usualComparison } from "./illness";
import { usualView } from "./illnessView";

// Vietnam time, written the way a parent reads the clock.
const vn = (text: string) => new Date(`${text.replace(" ", "T")}:00+07:00`);
const iso = (text: string) => vn(text).toISOString();
const NOW = vn("2026-11-26 10:00");

const episode = (start: string, end: string | null = null): EpisodeLike => ({
  id: "ep1",
  started_at: iso(start),
  ended_at: end === null ? null : iso(end),
});
// Started late on 24/11, so yesterday (25/11) is its first whole day, and
// the seven days before it are 17/11 to 23/11.
const OPEN = episode("2026-11-24 23:30");
const BASE = Array.from({ length: 7 }, (_, i) => addDays("2026-11-17", i));

const at = (type: string, time: string, end: string, details: unknown) => ({
  type,
  started_at: iso(time),
  ended_at: iso(end),
  details,
});
const pad = (n: number) => String(n).padStart(2, "0");

// One day of the baby's routine: feeds two hours apart from 01:00 (12 at most), wet
// diapers at half past each hour from 00:30, one sleep from 08:00.
function routine(
  day: string,
  usual: { feeds?: number; wet?: number; sleepMinutes?: number },
): LogLike[] {
  const logs: LogLike[] = [];
  for (let i = 0; i < (usual.feeds ?? 0); i += 1)
    logs.push(
      at(
        "breast",
        `${day} ${pad(1 + 2 * i)}:00`,
        `${day} ${pad(1 + 2 * i)}:20`,
        { side: "left" },
      ),
    );
  for (let i = 0; i < (usual.wet ?? 0); i += 1)
    logs.push(
      at("diaper", `${day} ${pad(i)}:30`, `${day} ${pad(i)}:30`, {
        wet: true,
        dirty: false,
      }),
    );
  const sleep = usual.sleepMinutes ?? 0;
  if (sleep > 0) {
    const end = new Date(vn(`${day} 08:00`).getTime() + sleep * 60_000);
    logs.push({
      type: "sleep",
      started_at: iso(`${day} 08:00`),
      ended_at: end.toISOString(),
      details: {},
    });
  }
  return logs;
}
const week = (usual: Parameters<typeof routine>[1], days = BASE) =>
  days.flatMap((day) => routine(day, usual));

// Spec §4.2: the rules may not lean on the order of the array.
function anyOrder<T>(logs: LogLike[], rule: (logs: LogLike[]) => T): T {
  const ascending = [...logs].sort((a, b) =>
    a.started_at.localeCompare(b.started_at),
  );
  const shuffled = [
    ...ascending.filter((_, i) => i % 2 === 1),
    ...ascending.filter((_, i) => i % 2 === 0).reverse(),
  ];
  const [first, ...rest] = [ascending, [...ascending].reverse(), shuffled].map(
    rule,
  );
  for (const other of rest) expect(other).toEqual(first);
  return first;
}

const USUAL = { feeds: 8, wet: 6, sleepMinutes: 14 * 60 };

// Spec 2026-11-26 §5.4.
describe("usualComparison", () => {
  it("an open episode compares yesterday with the 7 days before its first day", () => {
    const logs = [
      ...week(USUAL),
      ...routine("2026-11-25", { feeds: 6, wet: 5, sleepMinutes: 15 * 60 }),
      // Today and the episode's own first evening are not compared.
      ...routine("2026-11-26", { feeds: 1 }),
    ];
    expect(anyOrder(logs, (l) => usualComparison(l, OPEN, NOW))).toEqual({
      kind: "rows",
      day: "2026-11-25",
      rows: [
        { key: "feeds", value: 6, base: 8, verdict: "less" },
        { key: "wetDiapers", value: 5, base: 6, verdict: "usual" },
        { key: "sleepMinutes", value: 900, base: 840, verdict: "usual" },
      ],
    });
  });

  it("a closed episode compares the day before the day it ended", () => {
    const closed = episode("2026-11-24 23:30", "2026-11-26 08:00");
    const logs = [...week(USUAL), ...routine("2026-11-25", USUAL)];
    expect(usualComparison(logs, closed, vn("2026-12-20 09:00"))).toMatchObject(
      { kind: "rows", day: "2026-11-25" },
    );
  });

  it("the first day itself may be the day compared, counted as a whole calendar day", () => {
    const started = episode("2026-11-25 18:00");
    const logs = [...week(USUAL), ...routine("2026-11-25", USUAL)];
    expect(usualComparison(logs, started, NOW)).toMatchObject({
      kind: "rows",
      day: "2026-11-25",
      rows: [
        { key: "feeds", value: 8, verdict: "usual" },
        { key: "wetDiapers", value: 6, verdict: "usual" },
        { key: "sleepMinutes", value: 840, verdict: "usual" },
      ],
    });
  });

  it("no day to compare before the episode's first day", () => {
    const logs = week(USUAL);
    expect(usualComparison(logs, episode("2026-11-26 07:00"), NOW)).toEqual({
      kind: "no-day",
    });
    const sameDay = episode("2026-11-20 07:00", "2026-11-20 21:00");
    expect(usualComparison(logs, sameDay, NOW)).toEqual({ kind: "no-day" });
  });

  it("needs at least 3 days with a feed, a sleep or a diaper before the episode", () => {
    const yesterday = routine("2026-11-25", USUAL);
    const two = week(USUAL, BASE.slice(0, 2));
    // A day with only a temperature or a medicine does not count.
    const other = BASE.slice(2).map((day) => ({
      type: "temperature",
      started_at: iso(`${day} 09:00`),
      ended_at: iso(`${day} 09:00`),
      details: { celsius: 37, method: "nach" },
    }));
    expect(
      usualComparison([...two, ...other, ...yesterday], OPEN, NOW),
    ).toEqual({ kind: "no-base" });
    const three = week(USUAL, BASE.slice(0, 3));
    expect(usualComparison([...three, ...yesterday], OPEN, NOW)).toMatchObject({
      kind: "rows",
    });
  });

  it("averages only the days that were logged", () => {
    // Four quiet days (the baby was away) do not pull the average down.
    const logs = [
      ...week(USUAL, BASE.slice(4)),
      ...routine("2026-11-25", USUAL),
    ];
    expect(usualComparison(logs, OPEN, NOW)).toMatchObject({
      kind: "rows",
      rows: [
        { key: "feeds", value: 8, base: 8, verdict: "usual" },
        { key: "wetDiapers", value: 6, base: 6, verdict: "usual" },
        { key: "sleepMinutes", value: 840, base: 840, verdict: "usual" },
      ],
    });
  });

  it("logs before the 7 days do not count", () => {
    const logs = [
      ...week(USUAL, BASE.slice(0, 2)),
      ...routine("2026-11-16", USUAL),
      ...routine("2026-11-15", USUAL),
      ...routine("2026-11-25", USUAL),
    ];
    expect(usualComparison(logs, OPEN, NOW)).toEqual({ kind: "no-base" });
  });

  it("feeds and wet diapers: at most 0.75 of usual is less, anything above is as usual", () => {
    const verdicts = [6, 7, 12].map((feeds) => {
      const logs = [
        ...week(USUAL),
        ...routine("2026-11-25", { ...USUAL, feeds }),
      ];
      const result = usualComparison(logs, OPEN, NOW);
      return result.kind === "rows" ? result.rows[0].verdict : result.kind;
    });
    expect(verdicts).toEqual(["less", "usual", "usual"]);
  });

  it("sleep: at most 0.75 is less, at least 1.25 is more", () => {
    const verdicts = [9, 10, 14, 15, 16].map((hours) => {
      const logs = [
        ...week({ ...USUAL, sleepMinutes: 12 * 60 }),
        ...routine("2026-11-25", { ...USUAL, sleepMinutes: hours * 60 }),
      ];
      const result = usualComparison(logs, OPEN, NOW);
      return result.kind === "rows" ? result.rows[2].verdict : result.kind;
    });
    expect(verdicts).toEqual(["less", "usual", "usual", "more", "more"]);
  });

  it("the thresholds hold exactly when the average is not a round number", () => {
    // 8, 8 and 9 feeds: the average is 8.33…, and 0.75 of it is 6.25.
    const base = [
      ...routine(BASE[0], { ...USUAL, feeds: 8 }),
      ...routine(BASE[1], { ...USUAL, feeds: 8 }),
      ...routine(BASE[2], { ...USUAL, feeds: 9 }),
    ];
    const verdict = (feeds: number) => {
      const logs = [...base, ...routine("2026-11-25", { ...USUAL, feeds })];
      const result = usualComparison(logs, OPEN, NOW);
      return result.kind === "rows" ? result.rows[0] : result.kind;
    };
    expect(verdict(6)).toMatchObject({ verdict: "less", base: 25 / 3 });
    expect(verdict(7)).toMatchObject({ verdict: "usual" });
  });

  it("a measure that is 0 on average has no row; none left means too little data", () => {
    const noWet = [
      ...week({ feeds: 8, sleepMinutes: 840 }),
      ...routine("2026-11-25", USUAL),
    ];
    const result = usualComparison(noWet, OPEN, NOW);
    expect(result.kind === "rows" && result.rows.map((row) => row.key)).toEqual(
      ["feeds", "sleepMinutes"],
    );
    // Only dirty diapers: the days count, but every average is 0.
    const dirty = BASE.map((day) => ({
      type: "diaper",
      started_at: iso(`${day} 09:00`),
      ended_at: iso(`${day} 09:00`),
      details: { wet: false, dirty: true },
    }));
    expect(
      usualComparison([...dirty, ...routine("2026-11-25", USUAL)], OPEN, NOW),
    ).toEqual({ kind: "no-base" });
  });

  it("a sleep that began the evening before a day counts for that day", () => {
    const logs = [
      ...week(USUAL),
      ...routine("2026-11-25", { feeds: 8, wet: 6 }),
      {
        type: "sleep",
        started_at: iso("2026-11-24 22:00"),
        ended_at: iso("2026-11-25 06:00"),
        details: {},
      },
    ];
    const result = usualComparison(logs, OPEN, NOW);
    expect(result.kind === "rows" && result.rows[2]).toEqual({
      key: "sleepMinutes",
      value: 360,
      base: 840,
      verdict: "less",
    });
  });
});

// Spec §5.4 and §6.3 item 5: the words of the card.
describe("usualView", () => {
  it("three rows: the value, the usual one, and a chip", () => {
    const logs = [
      ...week(USUAL),
      ...routine("2026-11-25", { feeds: 6, wet: 5, sleepMinutes: 15 * 60 }),
    ];
    expect(usualView(logs, OPEN, NOW)).toEqual({
      sub: "Hôm qua, so với trung bình 7 ngày trước khi ốm",
      message: null,
      rows: [
        {
          label: "Bú",
          line: "6 cữ · thường 8 cữ",
          chip: { text: "Ít hơn", tone: "warn" },
        },
        {
          label: "Tã ướt",
          line: "5 lần · thường 6 lần",
          chip: { text: "Như thường", tone: "good" },
        },
        {
          label: "Ngủ",
          line: "15 giờ · thường 14 giờ",
          chip: { text: "Như thường", tone: "good" },
        },
      ],
    });
  });

  it("a closed episode names its day", () => {
    const closed = episode("2026-11-24 23:30", "2026-11-26 08:00");
    const logs = [...week(USUAL), ...routine("2026-11-25", USUAL)];
    expect(usualView(logs, closed, vn("2026-12-20 09:00")).sub).toBe(
      "25/11, so với trung bình 7 ngày trước khi ốm",
    );
  });

  it("rounds the usual value to a whole number and sleep to whole hours", () => {
    const base = [
      ...routine(BASE[0], { feeds: 7, wet: 5, sleepMinutes: 13 * 60 }),
      ...routine(BASE[1], { feeds: 8, wet: 6, sleepMinutes: 14 * 60 }),
    ];
    const logs = [
      ...base,
      ...routine(BASE[2], { feeds: 8, wet: 6, sleepMinutes: 14 * 60 + 30 }),
      ...routine("2026-11-25", {
        feeds: 8,
        wet: 6,
        sleepMinutes: 15 * 60 + 30,
      }),
    ];
    // Feeds 23/3 = 7.67, wet 17/3 = 5.67, sleep 13 h 50 min; yesterday 15 h 30.
    expect(usualView(logs, OPEN, NOW).rows.map((row) => row.line)).toEqual([
      "8 cữ · thường 8 cữ",
      "6 lần · thường 6 lần",
      "16 giờ · thường 14 giờ",
    ]);
  });

  it("more sleep than usual is a neutral chip", () => {
    const logs = [
      ...week({ ...USUAL, sleepMinutes: 12 * 60 }),
      ...routine("2026-11-25", { ...USUAL, sleepMinutes: 15 * 60 }),
    ];
    expect(usualView(logs, OPEN, NOW).rows[2].chip).toEqual({
      text: "Nhiều hơn",
      tone: "neutral",
    });
  });

  it("one sentence instead of the rows when there is nothing to compare", () => {
    expect(usualView(week(USUAL), episode("2026-11-26 07:00"), NOW)).toEqual({
      sub: null,
      message: "Chưa có ngày trọn nào của đợt ốm để so.",
      rows: [],
    });
    expect(usualView(routine("2026-11-25", USUAL), OPEN, NOW)).toEqual({
      sub: null,
      message: "Chưa đủ dữ liệu trước khi ốm để so.",
      rows: [],
    });
  });
});
