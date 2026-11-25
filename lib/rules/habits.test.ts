import { describe, expect, it } from "vitest";
import { addDays } from "./days";
import type { LogLike } from "./describeLog";
import { habitStats } from "./habits";

// "Now" is noon on 25/11 in Việt Nam: the window is 18/11 to 24/11.
const NOW = new Date("2026-11-25T05:00:00Z");
const TODAY = "2026-11-25";
const WINDOW = Array.from({ length: 7 }, (_, i) => addDays(TODAY, i - 7));
// 76 days old: sleep should be 14–17 hours.
const DOB = "2026-09-10";

// A timed log that starts at 02:00 Việt Nam time on that day.
const timed = (
  type: "sleep" | "tummy",
  day: string,
  minutes: number,
): LogLike => {
  const start = Date.parse(`${day}T02:00:00+07:00`);
  return {
    type,
    started_at: new Date(start).toISOString(),
    ended_at: new Date(start + minutes * 60_000).toISOString(),
    details: {},
  };
};
const medicine = (day: string, name: string, hour = 8): LogLike => ({
  type: "medicine",
  started_at: new Date(
    Date.parse(`${day}T${String(hour).padStart(2, "0")}:00:00+07:00`),
  ).toISOString(),
  ended_at: null,
  details: { name, amount: 1, unit: "giọt", antipyretic: false },
});
const everyDay = (type: "sleep" | "tummy", minutes: number, days = WINDOW) =>
  days.map((day) => timed(type, day, minutes));
const row = (logs: LogLike[], key: "sleep" | "tummy" | "vitaminD", dob = DOB) =>
  habitStats(logs, dob, NOW).rows.find((item) => item.key === key);

// Spec 2026-11-25 §7.1.
describe("habitStats: the window", () => {
  it("is the seven full days before today: today and the day before the window do not count", () => {
    const logs = [
      ...everyDay("sleep", 15 * 60),
      timed("sleep", TODAY, 60),
      // 02:00 to 12:00 on 17/11: wholly before the window.
      timed("sleep", addDays(TODAY, -8), 10 * 60),
    ];
    expect(row(logs, "sleep")?.line).toBe(
      "15 giờ 00 phút mỗi ngày · nên 14–17 giờ",
    );
  });

  it("a sleep that runs past midnight is split between the two days", () => {
    // 22:00 on 17/11 to 12:00 on 18/11: only the 12 hours of 18/11 count.
    const start = Date.parse("2026-11-17T22:00:00+07:00");
    const across: LogLike = {
      type: "sleep",
      started_at: new Date(start).toISOString(),
      ended_at: new Date(start + 14 * 3_600_000).toISOString(),
      details: {},
    };
    const logs = [across, ...everyDay("sleep", 12 * 60, WINDOW.slice(1))];
    expect(row(logs, "sleep")?.line).toBe(
      "12 giờ 00 phút mỗi ngày · nên 14–17 giờ",
    );
  });

  it("a sleep that starts last night and runs into today counts up to midnight only", () => {
    // 22:00 on 24/11 to 06:00 on 25/11: two hours belong to the window.
    const start = Date.parse("2026-11-24T22:00:00+07:00");
    const intoToday: LogLike = {
      type: "sleep",
      started_at: new Date(start).toISOString(),
      ended_at: new Date(start + 8 * 3_600_000).toISOString(),
      details: {},
    };
    // Six days of 14 hours, and 12 + 2 hours on the last day.
    const logs = [
      ...everyDay("sleep", 14 * 60, WINDOW.slice(0, 6)),
      timed("sleep", WINDOW[6], 12 * 60),
      intoToday,
    ];
    expect(row(logs, "sleep")?.line).toBe(
      "14 giờ 00 phút mỗi ngày · nên 14–17 giờ",
    );
  });

  // The same as on the Thống kê page: a timer nobody stopped keeps counting.
  it("a timer still running counts up to now, cut at each midnight", () => {
    const running: LogLike = {
      type: "sleep",
      started_at: new Date(
        Date.parse("2026-11-24T20:00:00+07:00"),
      ).toISOString(),
      ended_at: null,
      details: {},
    };
    // Six days of 15 hours; the last day has the 4 hours before midnight.
    const logs = [...everyDay("sleep", 15 * 60, WINDOW.slice(0, 6)), running];
    // (6 × 900 + 240) / 7 = 805,7 → 806 minutes.
    expect(row(logs, "sleep")?.line).toBe(
      "13 giờ 26 phút mỗi ngày · nên 14–17 giờ",
    );
  });

  it("lists sleep, tummy time and vitamin D, in that order, for a young baby", () => {
    expect(
      habitStats([], DOB, NOW).rows.map((item) => [item.key, item.title]),
    ).toEqual([
      ["sleep", "Giấc ngủ"],
      ["tummy", "Nằm sấp"],
      ["vitaminD", "Vitamin D"],
    ]);
  });
});

describe("habitStats: sleep", () => {
  it("inside the norm: Đủ, and the bar is the mean over the top of the norm", () => {
    expect(row(everyDay("sleep", 15 * 60), "sleep")).toEqual({
      key: "sleep",
      title: "Giấc ngủ",
      line: "15 giờ 00 phút mỗi ngày · nên 14–17 giờ",
      chip: { text: "Đủ", tone: "good" },
      progress: 15 / 17,
    });
  });

  it("the two ends of the norm are inside it", () => {
    expect(row(everyDay("sleep", 14 * 60), "sleep")?.chip?.text).toBe("Đủ");
    expect(row(everyDay("sleep", 17 * 60), "sleep")?.chip?.text).toBe("Đủ");
  });

  it("under the norm: Ít hơn chuẩn in warn", () => {
    expect(row(everyDay("sleep", 14 * 60 - 1), "sleep")).toMatchObject({
      line: "13 giờ 59 phút mỗi ngày · nên 14–17 giờ",
      chip: { text: "Ít hơn chuẩn", tone: "warn" },
    });
  });

  it("over the norm: Nhiều hơn chuẩn, neutral, and the bar is full", () => {
    expect(row(everyDay("sleep", 17 * 60 + 1), "sleep")).toMatchObject({
      chip: { text: "Nhiều hơn chuẩn", tone: "neutral" },
      progress: 1,
    });
  });

  it("the mean divides by the days that have sleep, not by seven", () => {
    // Five days of 15 hours and two days nobody logged.
    expect(
      row(everyDay("sleep", 15 * 60, WINDOW.slice(0, 5)), "sleep")?.line,
    ).toBe("15 giờ 00 phút mỗi ngày · nên 14–17 giờ");
  });

  it("fewer than five days with sleep: says so, no chip, no bar", () => {
    expect(
      row(everyDay("sleep", 15 * 60, WINDOW.slice(0, 4)), "sleep"),
    ).toEqual({
      key: "sleep",
      title: "Giấc ngủ",
      line: "Chưa đủ dữ liệu ngủ 7 ngày",
      chip: null,
      progress: null,
    });
  });

  it("the norm follows the baby's age", () => {
    // 200 days old: 12–15 hours.
    expect(
      row(everyDay("sleep", 13 * 60), "sleep", addDays(TODAY, -200))?.line,
    ).toBe("13 giờ 00 phút mỗi ngày · nên 12–15 giờ");
  });
});

describe("habitStats: tummy time", () => {
  it("30 minutes a day or more: Đủ, the bar full", () => {
    const logs = [
      timed("tummy", WINDOW[0], 20),
      timed("tummy", WINDOW[2], 40),
      timed("tummy", WINDOW[5], 30),
    ];
    expect(row(logs, "tummy")).toEqual({
      key: "tummy",
      title: "Nằm sấp",
      line: "30 phút mỗi ngày · nên từ 30 phút",
      chip: { text: "Đủ", tone: "good" },
      progress: 1,
    });
  });

  it("under 30 minutes: Còn thiếu in warn, the bar in proportion", () => {
    expect(
      row(everyDay("tummy", 15, WINDOW.slice(0, 3)), "tummy"),
    ).toMatchObject({
      line: "15 phút mỗi ngày · nên từ 30 phút",
      chip: { text: "Còn thiếu", tone: "warn" },
      progress: 0.5,
    });
  });

  it("two logs on one day add up for that day", () => {
    const logs = [
      timed("tummy", WINDOW[0], 20),
      {
        ...timed("tummy", WINDOW[0], 10),
        started_at: new Date(
          Date.parse(`${WINDOW[0]}T15:00:00+07:00`),
        ).toISOString(),
        ended_at: new Date(
          Date.parse(`${WINDOW[0]}T15:10:00+07:00`),
        ).toISOString(),
      },
      timed("tummy", WINDOW[1], 30),
      timed("tummy", WINDOW[2], 30),
    ];
    expect(row(logs, "tummy")?.line).toBe("30 phút mỗi ngày · nên từ 30 phút");
  });

  it("fewer than three days with tummy time: says so, no chip, no bar", () => {
    expect(row(everyDay("tummy", 40, WINDOW.slice(0, 2)), "tummy")).toEqual({
      key: "tummy",
      title: "Nằm sấp",
      line: "Tuần này chưa ghi nằm sấp",
      chip: null,
      progress: null,
    });
  });

  it("is shown until the first birthday", () => {
    expect(row([], "tummy", addDays(TODAY, -364))).toBeDefined();
    expect(row([], "tummy", addDays(TODAY, -365))).toBeUndefined();
  });
});

describe("habitStats: vitamin D", () => {
  it("six days or more: Đều, the bar in sevenths", () => {
    const logs = WINDOW.slice(0, 6).map((day) => medicine(day, "Vitamin D3"));
    expect(row(logs, "vitaminD")).toEqual({
      key: "vitaminD",
      title: "Vitamin D",
      line: "Đã uống 6 trên 7 ngày",
      chip: { text: "Đều", tone: "good" },
      progress: 6 / 7,
    });
  });

  it("five days or fewer: how many days were missed, neutral", () => {
    const logs = WINDOW.slice(0, 5).map((day) => medicine(day, "vitamin d"));
    expect(row(logs, "vitaminD")).toMatchObject({
      line: "Đã uống 5 trên 7 ngày",
      chip: { text: "Sót 2 ngày", tone: "neutral" },
    });
    expect(row([], "vitaminD")).toMatchObject({
      line: "Đã uống 0 trên 7 ngày",
      chip: { text: "Sót 7 ngày", tone: "neutral" },
      progress: 0,
    });
  });

  it("two doses on one day are one day; other medicines and today do not count", () => {
    const logs = [
      medicine(WINDOW[0], "Vitamin D3"),
      medicine(WINDOW[0], "Vitamin D3", 20),
      medicine(WINDOW[1], "Vitamin DHA"),
      medicine(WINDOW[2], "Paracetamol"),
      medicine(TODAY, "Vitamin D3"),
    ];
    expect(row(logs, "vitaminD")?.line).toBe("Đã uống 1 trên 7 ngày");
  });

  it("is shown until the second birthday", () => {
    expect(row([], "vitaminD", addDays(TODAY, -729))).toBeDefined();
    expect(row([], "vitaminD", addDays(TODAY, -730))).toBeUndefined();
  });
});

// Spec §4, rows 5 and 6: what the Sức khỏe page says when a habit is short.
describe("habitStats: what needs attention", () => {
  it("sleep under the norm: the hours a day against the norm", () => {
    expect(
      habitStats(everyDay("sleep", 13 * 60 + 30), DOB, NOW).attention,
    ).toEqual({
      sleep: "13,5 giờ mỗi ngày · nên 14–17 giờ",
      tummy: null,
    });
  });

  // Rounded to the nearest tenth, 13 giờ 59 phút would read "14 giờ" under a
  // title that says the baby sleeps less than 14.
  it("the hours are rounded down, so they never read as the norm they are under", () => {
    expect(
      habitStats(everyDay("sleep", 14 * 60 - 1), DOB, NOW).attention.sleep,
    ).toBe("13,9 giờ mỗi ngày · nên 14–17 giờ");
    expect(
      habitStats(everyDay("sleep", 13 * 60), DOB, NOW).attention.sleep,
    ).toBe("13 giờ mỗi ngày · nên 14–17 giờ");
  });

  it("tummy time under 30 minutes: the minutes a day against the norm", () => {
    expect(
      habitStats(everyDay("tummy", 15, WINDOW.slice(0, 3)), DOB, NOW).attention,
    ).toEqual({ sleep: null, tummy: "15 phút mỗi ngày · nên từ 30 phút" });
  });

  it("nothing when the habit is fine, over the norm, or not judged for lack of data", () => {
    for (const logs of [
      [...everyDay("sleep", 15 * 60), ...everyDay("tummy", 40)],
      everyDay("sleep", 18 * 60),
      everyDay("sleep", 10 * 60, WINDOW.slice(0, 4)),
      [],
    ])
      expect(habitStats(logs, DOB, NOW).attention).toEqual({
        sleep: null,
        tummy: null,
      });
  });

  it("a baby past the first birthday has no tummy-time line", () => {
    expect(
      habitStats(everyDay("tummy", 15), addDays(TODAY, -400), NOW).attention
        .tummy,
    ).toBeNull();
  });
});
