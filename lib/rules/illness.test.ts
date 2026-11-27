import { describe, expect, it } from "vitest";
import type { LogLike } from "./describeLog";
import {
  antipyreticTimes,
  belongsTo,
  detailRange,
  type EpisodeLike,
  episodeDay,
  episodeDayCount,
  episodeReadings,
  formatCelsius,
  symptomEntries,
} from "./illness";

// Vietnam time, written the way a parent reads the clock.
const vn = (text: string) => new Date(`${text.replace(" ", "T")}:00+07:00`);
const iso = (text: string) => vn(text).toISOString();

const episode = (
  start: string,
  end: string | null = null,
  id = "ep1",
): EpisodeLike => ({
  id,
  started_at: iso(start),
  ended_at: end === null ? null : iso(end),
});

const at = (type: string, time: string, details: unknown): LogLike => ({
  type,
  started_at: iso(time),
  ended_at: iso(time),
  details,
});
const temp = (time: string, celsius: number) =>
  at("temperature", time, { celsius, method: "nach" });
const dose = (time: string, antipyretic = true) =>
  at("medicine", time, {
    name: antipyretic ? "Hapacol" : "Vitamin D",
    amount: 2.5,
    unit: "ml",
    antipyretic,
  });
const symptom = (time: string, codes: string[]) =>
  at("symptom", time, { codes });

// Spec §4.2: the rules may not lean on the order of the array. Every order of
// `logs` must give the same answer.
function orders(logs: LogLike[]): LogLike[][] {
  const ascending = [...logs].sort((a, b) =>
    a.started_at.localeCompare(b.started_at),
  );
  // Odd places first, then the even ones backwards: neither sorted way.
  const shuffled = [
    ...ascending.filter((_, index) => index % 2 === 1),
    ...ascending.filter((_, index) => index % 2 === 0).reverse(),
  ];
  return [ascending, [...ascending].reverse(), shuffled];
}
function sameForEveryOrder<T>(
  logs: LogLike[],
  rule: (logs: LogLike[]) => T,
): T {
  const [first, ...rest] = orders(logs).map(rule);
  for (const other of rest) expect(other).toEqual(first);
  return first;
}

// Spec 2026-11-26 §5.1.
describe("episodeDay", () => {
  it("counts Vietnam calendar days from the day the episode started", () => {
    const start = iso("2026-11-24 23:30");
    expect(episodeDay(start, vn("2026-11-24 23:59"))).toBe(1);
    // Half an hour later it is the next calendar day in Vietnam.
    expect(episodeDay(start, vn("2026-11-25 00:00"))).toBe(2);
    expect(episodeDay(start, vn("2026-11-25 23:59"))).toBe(2);
    expect(episodeDay(start, vn("2026-11-27 08:00"))).toBe(4);
  });

  it("follows the Vietnam day, not the UTC day", () => {
    // 06:00 in Vietnam is still the previous day in UTC.
    const start = iso("2026-11-25 06:00");
    expect(start.slice(0, 10)).toBe("2026-11-24");
    expect(episodeDay(start, vn("2026-11-25 06:30"))).toBe(1);
    expect(episodeDay(start, vn("2026-11-26 01:00"))).toBe(2);
  });

  it("crosses a month and a year", () => {
    expect(episodeDay(iso("2026-12-30 10:00"), vn("2027-01-02 09:00"))).toBe(4);
  });
});

describe("episodeDayCount", () => {
  it("an open episode is on today's day; a closed one has the day of its end", () => {
    const now = vn("2026-11-27 08:00");
    expect(episodeDayCount(episode("2026-11-24 23:30"), now)).toBe(4);
    expect(
      episodeDayCount(episode("2026-11-24 23:30", "2026-11-26 07:00"), now),
    ).toBe(3);
    expect(
      episodeDayCount(episode("2026-11-24 09:00", "2026-11-24 21:00"), now),
    ).toBe(1);
  });
});

// Spec §4.3.
describe("belongsTo", () => {
  const now = vn("2026-11-27 08:00");

  it("an open episode owns every log from its start up to now", () => {
    const open = episode("2026-11-25 08:00");
    expect(belongsTo(open, iso("2026-11-25 07:59"), now)).toBe(false);
    expect(belongsTo(open, iso("2026-11-25 08:00"), now)).toBe(true);
    expect(belongsTo(open, iso("2026-11-27 08:00"), now)).toBe(true);
  });

  // A screen's clock moves once a minute: a log saved 20 seconds after its
  // last tick is dated after `now` and must still count at once.
  it("an open episode also owns a log dated up to two minutes after now", () => {
    const open = episode("2026-11-25 08:00");
    const after = (ms: number) => new Date(now.getTime() + ms).toISOString();
    expect(belongsTo(open, after(20_000), now)).toBe(true);
    expect(belongsTo(open, after(120_000), now)).toBe(true);
    expect(belongsTo(open, after(120_001), now)).toBe(false);
  });

  it("a closed episode owns its start and its end, nothing after", () => {
    const closed = episode("2026-11-25 08:00", "2026-11-26 20:00");
    expect(belongsTo(closed, iso("2026-11-26 20:00"), now)).toBe(true);
    expect(belongsTo(closed, iso("2026-11-26 20:01"), now)).toBe(false);
  });
});

describe("episodeReadings, antipyreticTimes, symptomEntries", () => {
  const now = vn("2026-11-27 08:00");
  const open = episode("2026-11-25 08:00");
  const logs = [
    temp("2026-11-25 07:00", 39.5), // before the episode
    temp("2026-11-25 09:00", 38.6),
    temp("2026-11-26 21:00", 37.4),
    temp("2026-11-25 14:00", 39.2),
    at("temperature", "2026-11-25 15:00", { celsius: 50, method: "nach" }), // not a valid reading
    at("temperature", "2026-11-25 16:00", null),
    dose("2026-11-25 09:10"),
    dose("2026-11-25 07:10"), // before the episode
    dose("2026-11-25 15:00", false), // not a fever medicine
    dose("2026-11-26 03:00"),
    symptom("2026-11-25 10:00", ["cough", "runny_nose"]),
    symptom("2026-11-24 10:00", ["fever"]), // before the episode
    at("symptom", "2026-11-25 11:00", { codes: [] }), // not valid
    at("diaper", "2026-11-25 12:00", { wet: true, dirty: false }),
  ];

  it("readings: valid temperature logs of the episode, oldest first", () => {
    const readings = sameForEveryOrder(logs, (list) =>
      episodeReadings(list, open, now),
    );
    expect(readings).toEqual([
      { at: vn("2026-11-25 09:00").getTime(), celsius: 38.6 },
      { at: vn("2026-11-25 14:00").getTime(), celsius: 39.2 },
      { at: vn("2026-11-26 21:00").getTime(), celsius: 37.4 },
    ]);
  });

  it("two readings of the same minute: the higher one counts as the newer", () => {
    const twice = [
      temp("2026-11-25 09:00", 38.6),
      temp("2026-11-25 09:00", 37.9),
    ];
    const readings = sameForEveryOrder(twice, (list) =>
      episodeReadings(list, open, now),
    );
    expect(readings.map((r) => r.celsius)).toEqual([37.9, 38.6]);
  });

  it("doses: fever medicine of the episode only, oldest first", () => {
    expect(
      sameForEveryOrder(logs, (list) => antipyreticTimes(list, open, now)),
    ).toEqual([
      vn("2026-11-25 09:10").getTime(),
      vn("2026-11-26 03:00").getTime(),
    ]);
  });

  it("symptoms: valid symptom logs of the episode, oldest first", () => {
    expect(
      sameForEveryOrder(logs, (list) => symptomEntries(list, open, now)),
    ).toEqual([
      { at: vn("2026-11-25 10:00").getTime(), codes: ["cough", "runny_nose"] },
    ]);
  });

  it("a closed episode stops counting at its end", () => {
    const closed = episode("2026-11-25 08:00", "2026-11-25 20:00");
    expect(episodeReadings(logs, closed, now).map((r) => r.celsius)).toEqual([
      38.6, 39.2,
    ]);
    expect(antipyreticTimes(logs, closed, now)).toHaveLength(1);
  });
});

describe("formatCelsius", () => {
  it("writes a comma and at most one decimal", () => {
    expect(formatCelsius(38.6)).toBe("38,6");
    expect(formatCelsius(38)).toBe("38");
    expect(formatCelsius(39.25)).toBe("39,3");
    expect(formatCelsius(36.04)).toBe("36");
  });
});

// Spec §6.3.
describe("detailRange", () => {
  it("open: from the start of the 8th day before the first day, no end", () => {
    expect(detailRange(episode("2026-11-24 23:30"))).toEqual({
      from: iso("2026-11-16 00:00"),
      to: null,
    });
  });

  it("closed: up to the start of the day after the last day", () => {
    expect(
      detailRange(episode("2026-11-24 23:30", "2026-11-26 07:00")),
    ).toEqual({
      from: iso("2026-11-16 00:00"),
      to: iso("2026-11-27 00:00"),
    });
  });
});
