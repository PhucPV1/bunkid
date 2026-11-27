import { describe, expect, it } from "vitest";
import type { LogLike } from "./describeLog";
import {
  antipyreticTimes,
  belongsTo,
  detailRange,
  type EpisodeLike,
  episodeDay,
  episodeDayCount,
  episodeDays,
  episodeReadings,
  episodeVerdict,
  feverStatus,
  formatCelsius,
  sinceText,
  statusTone,
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

// Spec §5.2.
describe("feverStatus", () => {
  const open = episode("2026-11-25 08:00");
  const kindAt = (logs: LogLike[], now: string) =>
    sameForEveryOrder(logs, (list) => feverStatus(list, open, vn(now))).kind;

  it("unmeasured: no reading in the episode", () => {
    const status = feverStatus(
      [temp("2026-11-25 07:00", 39), dose("2026-11-25 09:00")],
      open,
      vn("2026-11-25 12:00"),
    );
    expect(status).toEqual({
      kind: "unmeasured",
      latest: null,
      lastFever: null,
      peak: null,
    });
  });

  it("fever: the newest reading is from 38,0 and at most 6 hours old", () => {
    const logs = [temp("2026-11-25 09:00", 37.5), temp("2026-11-25 10:00", 38)];
    expect(kindAt(logs, "2026-11-25 10:00")).toBe("fever");
    expect(kindAt(logs, "2026-11-25 16:00")).toBe("fever");
    expect(kindAt(logs, "2026-11-25 16:01")).toBe("stale");
  });

  it("stale: the newest reading is from 38,0 and older than 6 hours", () => {
    const logs = [temp("2026-11-25 10:00", 39.4)];
    const status = feverStatus(logs, open, vn("2026-11-26 08:00"));
    expect(status.kind).toBe("stale");
    expect(status.latest?.celsius).toBe(39.4);
  });

  it("cleared: the newest reading is under 38,0 after one from 38,0", () => {
    const logs = [
      temp("2026-11-25 09:00", 38.6),
      temp("2026-11-25 14:00", 39.2),
      temp("2026-11-25 20:00", 38.1),
      temp("2026-11-26 07:00", 37.9),
    ];
    const status = sameForEveryOrder(logs, (list) =>
      feverStatus(list, open, vn("2026-11-26 09:00")),
    );
    expect(status.kind).toBe("cleared");
    expect(status.latest).toEqual({
      at: vn("2026-11-26 07:00").getTime(),
      celsius: 37.9,
    });
    expect(status.lastFever).toEqual({
      at: vn("2026-11-25 20:00").getTime(),
      celsius: 38.1,
    });
    expect(status.peak).toEqual({
      at: vn("2026-11-25 14:00").getTime(),
      celsius: 39.2,
    });
  });

  it("none: every reading is under 38,0", () => {
    const logs = [
      temp("2026-11-25 09:00", 37.9),
      temp("2026-11-25 12:00", 37.2),
    ];
    const status = feverStatus(logs, open, vn("2026-11-25 13:00"));
    expect(status.kind).toBe("none");
    expect(status.lastFever).toBeNull();
    expect(status.peak?.celsius).toBe(37.9);
  });

  it("a fever before the episode does not make it cleared", () => {
    const logs = [temp("2026-11-25 07:00", 39), temp("2026-11-25 09:00", 37.5)];
    expect(kindAt(logs, "2026-11-25 10:00")).toBe("none");
  });

  it("of two equal highest readings the later one is the peak", () => {
    const logs = [
      temp("2026-11-25 09:00", 39.2),
      temp("2026-11-25 14:00", 39.2),
    ];
    const status = sameForEveryOrder(logs, (list) =>
      feverStatus(list, open, vn("2026-11-25 15:00")),
    );
    expect(status.peak?.at).toBe(vn("2026-11-25 14:00").getTime());
  });

  it("a reading saved just after the page's clock last moved counts at once", () => {
    const now = vn("2026-11-25 12:00");
    const fresh: LogLike = {
      type: "temperature",
      started_at: new Date(now.getTime() + 20_000).toISOString(),
      ended_at: null,
      details: { celsius: 38.6, method: "nach" },
    };
    const status = feverStatus([fresh], open, now);
    expect(status.kind).toBe("fever");
    expect(status.latest?.celsius).toBe(38.6);
  });

  it("a closed episode reads its readings up to its end", () => {
    const closed = episode("2026-11-25 08:00", "2026-11-26 08:00");
    const logs = [
      temp("2026-11-25 09:00", 38.6),
      temp("2026-11-26 09:00", 36.8),
    ];
    const status = feverStatus(logs, closed, vn("2026-11-30 09:00"));
    expect(status.latest?.celsius).toBe(38.6);
  });
});

describe("sinceText", () => {
  const HOUR = 3_600_000;

  it("under an hour, whole hours up to 48, then whole days", () => {
    expect(sinceText(0)).toBe("chưa đầy 1 giờ");
    expect(sinceText(HOUR - 1)).toBe("chưa đầy 1 giờ");
    expect(sinceText(HOUR)).toBe("1 giờ");
    expect(sinceText(2.9 * HOUR)).toBe("2 giờ");
    expect(sinceText(48 * HOUR - 1)).toBe("47 giờ");
    expect(sinceText(48 * HOUR)).toBe("2 ngày");
    expect(sinceText(71.9 * HOUR)).toBe("2 ngày");
    expect(sinceText(72 * HOUR)).toBe("3 ngày");
  });
});

describe("episodeVerdict", () => {
  const open = episode("2026-11-25 08:00");
  const verdict = (logs: LogLike[], now: string, of: EpisodeLike = open) =>
    episodeVerdict({
      episode: of,
      status: feverStatus(logs, of, vn(now)),
      babyName: "Bun",
      now: vn(now),
    });

  it("unmeasured: neutral, the thermometer", () => {
    expect(verdict([], "2026-11-25 12:00")).toEqual({
      title: "Chưa đo nhiệt độ",
      tone: "neutral",
      icon: "thermo",
    });
  });

  it("fever: warn under 39,0, danger from 39,0", () => {
    expect(
      verdict([temp("2026-11-25 10:00", 38.9)], "2026-11-25 11:00"),
    ).toEqual({ title: "Bun đang sốt 38,9°C", tone: "warn", icon: "thermo" });
    expect(verdict([temp("2026-11-25 10:00", 39)], "2026-11-25 11:00")).toEqual(
      {
        title: "Bun đang sốt 39°C",
        tone: "danger",
        icon: "thermo",
      },
    );
  });

  it("stale: warn and a clock, even from 39,0", () => {
    expect(
      verdict([temp("2026-11-25 10:00", 39.4)], "2026-11-25 17:00"),
    ).toEqual({ title: "Chưa đo lại sau 39,4°C", tone: "warn", icon: "clock" });
  });

  it("cleared: counts from the last reading that was a fever", () => {
    const logs = [
      temp("2026-11-25 10:00", 38.6),
      temp("2026-11-25 13:00", 37.4),
    ];
    expect(verdict(logs, "2026-11-25 13:30")).toEqual({
      title: "Bun đã hết sốt 3 giờ",
      tone: "good",
      icon: "check",
    });
    expect(verdict(logs, "2026-11-27 11:00").title).toBe(
      "Bun đã hết sốt 2 ngày",
    );
    expect(
      verdict(
        [temp("2026-11-25 10:00", 38.6), temp("2026-11-25 10:20", 37.4)],
        "2026-11-25 10:30",
      ).title,
    ).toBe("Bun đã hết sốt chưa đầy 1 giờ");
  });

  it("none: good and a tick", () => {
    expect(
      verdict([temp("2026-11-25 10:00", 37.2)], "2026-11-25 11:00"),
    ).toEqual({ title: "Bun không sốt", tone: "good", icon: "check" });
  });

  it("a newest reading under 35,5 is never green: neutral and the thermometer, same title", () => {
    expect(
      verdict([temp("2026-11-25 10:00", 35.4)], "2026-11-25 11:00"),
    ).toEqual({ title: "Bun không sốt", tone: "neutral", icon: "thermo" });
    expect(
      verdict(
        [temp("2026-11-25 09:00", 38.2), temp("2026-11-25 10:00", 35.4)],
        "2026-11-25 11:00",
      ),
    ).toEqual({
      title: "Bun đã hết sốt 2 giờ",
      tone: "neutral",
      icon: "thermo",
    });
    expect(
      verdict([temp("2026-11-25 10:00", 35.5)], "2026-11-25 11:00").tone,
    ).toBe("good");
  });

  it("a closed episode always reads Đã khỏi, whatever its last reading", () => {
    const closed = episode("2026-11-24 23:30", "2026-11-26 07:00");
    expect(
      verdict([temp("2026-11-25 10:00", 39.4)], "2026-11-30 09:00", closed),
    ).toEqual({ title: "Đã khỏi sau 3 ngày", tone: "good", icon: "check" });
    expect(verdict([], "2026-11-30 09:00", closed).title).toBe(
      "Đã khỏi sau 3 ngày",
    );
  });
});

describe("statusTone", () => {
  const open = episode("2026-11-25 08:00");
  const tone = (logs: LogLike[], now: string) =>
    statusTone(feverStatus(logs, open, vn(now)));

  it("is the tone of the verdict card for each kind", () => {
    expect(tone([], "2026-11-25 12:00")).toBe("neutral");
    expect(tone([temp("2026-11-25 10:00", 38.5)], "2026-11-25 11:00")).toBe(
      "warn",
    );
    expect(tone([temp("2026-11-25 10:00", 40)], "2026-11-25 11:00")).toBe(
      "danger",
    );
    expect(tone([temp("2026-11-25 10:00", 40)], "2026-11-25 17:00")).toBe(
      "warn",
    );
    expect(tone([temp("2026-11-25 10:00", 36.9)], "2026-11-25 11:00")).toBe(
      "good",
    );
  });
});

// Spec §5.3 and §6.3 item 4.
describe("episodeDays", () => {
  const open = episode("2026-11-24 23:30");
  const now = vn("2026-11-27 08:00");
  const logs = [
    temp("2026-11-24 23:00", 40), // before the episode
    temp("2026-11-24 23:40", 38.4),
    temp("2026-11-25 03:00", 39),
    temp("2026-11-25 15:00", 38.2),
    dose("2026-11-25 03:10"),
    dose("2026-11-25 09:30"),
    symptom("2026-11-25 08:00", ["cough", "runny_nose"]),
    symptom("2026-11-25 20:00", ["runny_nose", "fussy"]),
    temp("2026-11-26 09:00", 37.6),
    temp("2026-11-26 19:00", 37.9),
    dose("2026-11-26 01:00", false),
    symptom("2026-11-27 07:00", ["cough"]),
  ];
  const days = () =>
    sameForEveryOrder(logs, (list) => episodeDays(list, open, now));

  it("one row per day from the first day to today, newest first", () => {
    expect(days().map((row) => [row.day, row.n])).toEqual([
      ["2026-11-27", 4],
      ["2026-11-26", 3],
      ["2026-11-25", 2],
      ["2026-11-24", 1],
    ]);
  });

  it("each day: its highest reading, its doses, its symptom codes once each", () => {
    expect(days()[2]).toEqual({
      day: "2026-11-25",
      n: 2,
      peak: 39,
      doses: 2,
      codes: ["cough", "fussy", "runny_nose"],
      label: { text: "Sốt cao", tone: "danger" },
    });
    expect(days()[3]).toMatchObject({ peak: 38.4, doses: 0, codes: [] });
  });

  it("labels: Sốt cao from 39,0, Sốt from 38,0, Hết sốt after a day with fever, none without a reading", () => {
    expect(days().map((row) => row.label)).toEqual([
      null,
      { text: "Hết sốt", tone: "good" },
      { text: "Sốt cao", tone: "danger" },
      { text: "Sốt", tone: "warn" },
    ]);
    expect(days()[0]).toMatchObject({ peak: null, doses: 0, codes: ["cough"] });
  });

  it("Không sốt when no earlier day of the episode had a fever", () => {
    const calm = [
      temp("2026-11-24 23:40", 37.2),
      temp("2026-11-25 09:00", 37.9),
      temp("2026-11-26 09:00", 38),
      temp("2026-11-27 07:00", 37),
    ];
    expect(
      sameForEveryOrder(calm, (list) => episodeDays(list, open, now)).map(
        (row) => row.label?.text,
      ),
    ).toEqual(["Hết sốt", "Sốt", "Không sốt", "Không sốt"]);
  });

  it("a fever earlier the same day does not turn the day into Hết sốt", () => {
    const sameDay = [
      temp("2026-11-24 23:40", 38.4),
      temp("2026-11-24 23:50", 37),
    ];
    expect(episodeDays(sameDay, open, vn("2026-11-24 23:55"))).toEqual([
      {
        day: "2026-11-24",
        n: 1,
        peak: 38.4,
        doses: 0,
        codes: [],
        label: { text: "Sốt", tone: "warn" },
      },
    ]);
  });

  it("a closed episode ends on the day of its end and leaves later logs out", () => {
    const closed = episode("2026-11-24 23:30", "2026-11-26 12:00");
    const rows = sameForEveryOrder(logs, (list) =>
      episodeDays(list, closed, now),
    );
    expect(rows.map((row) => row.day)).toEqual([
      "2026-11-26",
      "2026-11-25",
      "2026-11-24",
    ]);
    // 19:00 on the last day is after the end: only the 09:00 reading counts.
    expect(rows[0].peak).toBe(37.6);
  });
});
