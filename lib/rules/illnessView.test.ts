import { describe, expect, it } from "vitest";
import type { LogLike } from "./describeLog";
import type { EpisodeLike } from "./illness";
import {
  clockText,
  closeReminderView,
  dayRows,
  episodeHref,
  episodeList,
  homeEpisodeCard,
  verdictView,
  whenText,
} from "./illnessView";

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
const dose = (time: string) =>
  at("medicine", time, {
    name: "Hapacol",
    amount: 2.5,
    unit: "ml",
    antipyretic: true,
  });
const symptom = (time: string, codes: string[]) =>
  at("symptom", time, { codes });

describe("whenText", () => {
  const now = vn("2026-11-26 10:00");

  it("says hôm nay for a time today, the date otherwise", () => {
    expect(whenText(vn("2026-11-26 07:05").getTime(), now)).toBe(
      "07:05 hôm nay",
    );
    expect(whenText(vn("2026-11-25 23:59").getTime(), now)).toBe("25/11 23:59");
  });
});

describe("episodeHref", () => {
  it("carries the id as a query parameter, so the page stays static", () => {
    expect(episodeHref("ab-12")).toBe("/dot-om/chi-tiet?id=ab-12");
  });
});

// Spec 2026-11-26 §6.3 item 2.
describe("verdictView", () => {
  const open = episode("2026-11-24 23:30");
  const now = vn("2026-11-26 10:00");
  const logs = [
    temp("2026-11-24 23:40", 38.4),
    temp("2026-11-25 15:00", 39.2),
    temp("2026-11-26 07:05", 37.6),
    dose("2026-11-25 15:10"),
    dose("2026-11-26 02:00"),
  ];

  it("open: the verdict, the day and start, three rows, and it takes quick logs", () => {
    expect(verdictView({ episode: open, logs, babyName: "Bun", now })).toEqual({
      verdict: {
        title: "Bun đã hết sốt 19 giờ",
        tone: "good",
        icon: "check",
      },
      sub: "Ngày thứ 3 · bắt đầu 24/11 lúc 23:30",
      rows: [
        { label: "Đo gần nhất", when: "07:05 hôm nay", value: "37,6°C" },
        { label: "Sốt cao nhất", when: "25/11 15:00", value: "39,2°C" },
        {
          label: "Thuốc hạ sốt",
          when: "gần nhất 02:00 hôm nay",
          value: "2 liều",
        },
      ],
      open: true,
    });
  });

  it("nothing measured, nothing given", () => {
    const view = verdictView({ episode: open, logs: [], babyName: "Bun", now });
    expect(view.verdict.title).toBe("Chưa đo nhiệt độ");
    expect(view.rows).toEqual([
      { label: "Đo gần nhất", when: null, value: "Chưa đo" },
      { label: "Sốt cao nhất", when: null, value: "Chưa đo" },
      { label: "Thuốc hạ sốt", when: null, value: "Chưa dùng" },
    ]);
  });

  it("measured but never from 38,0: Không sốt, with no time", () => {
    const view = verdictView({
      episode: open,
      logs: [temp("2026-11-26 07:05", 37.6)],
      babyName: "Bun",
      now,
    });
    expect(view.rows[1]).toEqual({
      label: "Sốt cao nhất",
      when: null,
      value: "Không sốt",
    });
  });

  it("closed: Đã khỏi, its two dates, the same rows, no quick logs", () => {
    const closed = episode("2026-11-24 23:30", "2026-11-26 08:00");
    const view = verdictView({
      episode: closed,
      logs,
      babyName: "Bun",
      now: vn("2026-12-02 10:00"),
    });
    expect(view.verdict.title).toBe("Đã khỏi sau 3 ngày");
    expect(view.sub).toBe("24/11 – 26/11");
    expect(view.rows[0]).toEqual({
      label: "Đo gần nhất",
      when: "26/11 07:05",
      value: "37,6°C",
    });
    expect(view.rows[2].when).toBe("gần nhất 26/11 02:00");
    expect(view.open).toBe(false);
  });
});

// Spec §6.3 item 4.
describe("dayRows", () => {
  const open = episode("2026-11-24 23:30");
  const now = vn("2026-11-26 10:00");

  it("titles, the line under them, chips in the content's order, the label", () => {
    const rows = dayRows(
      [
        temp("2026-11-24 23:40", 38.4),
        temp("2026-11-25 15:00", 39.2),
        dose("2026-11-25 15:10"),
        dose("2026-11-25 21:00"),
        symptom("2026-11-25 08:00", ["fussy", "cough"]),
        symptom("2026-11-25 20:00", ["runny_nose", "cough", "gone_code"]),
      ],
      open,
      now,
    );
    expect(rows).toEqual([
      {
        day: "2026-11-26",
        title: "Hôm nay · ngày 3",
        detail: "Chưa đo · không dùng thuốc",
        chips: [],
        label: null,
      },
      {
        day: "2026-11-25",
        title: "25/11 · ngày 2",
        detail: "Cao nhất 39,2°C · 2 liều hạ sốt",
        // The content lists Sổ mũi, Ho, …, Quấy; a code it lost is left out.
        chips: ["Sổ mũi", "Ho", "Quấy"],
        label: { text: "Sốt cao", tone: "danger" },
      },
      {
        day: "2026-11-24",
        title: "24/11 · ngày 1",
        detail: "Cao nhất 38,4°C · không dùng thuốc",
        chips: [],
        label: { text: "Sốt", tone: "warn" },
      },
    ]);
  });

  it("a day with medicine but no reading", () => {
    const rows = dayRows([dose("2026-11-26 09:00")], open, now);
    expect(rows[0].detail).toBe("Chưa đo · 1 liều hạ sốt");
  });
});

// Spec §6.2.
describe("episodeList", () => {
  const now = vn("2026-11-26 10:00");
  const open = episode("2026-11-24 23:30", null, "open");
  const past = [
    episode("2026-10-10 08:00", "2026-10-13 09:00", "oct"),
    episode("2025-12-30 08:00", "2026-01-02 09:00", "newyear"),
    episode("2026-11-01 08:00", "2026-11-01 20:00", "nov"),
  ];

  it("no episode at all", () => {
    expect(episodeList({ episodes: [], openLogs: undefined, now })).toEqual({
      open: null,
      past: [],
    });
  });

  it("the open episode: since when, which day, and a chip for its state", () => {
    const chip = (logs: LogLike[] | undefined) =>
      episodeList({ episodes: [open, ...past], openLogs: logs, now }).open;
    expect(chip([temp("2026-11-26 09:00", 38.5)])).toEqual({
      id: "open",
      href: "/dot-om/chi-tiet?id=open",
      title: "Từ 24/11 · ngày thứ 3",
      chip: { text: "Đang sốt", tone: "warn" },
    });
    expect(chip([temp("2026-11-26 09:00", 39.5)])?.chip).toEqual({
      text: "Đang sốt",
      tone: "danger",
    });
    expect(chip([temp("2026-11-25 09:00", 38.5)])?.chip).toEqual({
      text: "Chưa đo lại",
      tone: "warn",
    });
    expect(
      chip([temp("2026-11-25 09:00", 38.5), temp("2026-11-26 09:00", 37)])
        ?.chip,
    ).toEqual({ text: "Hết sốt", tone: "good" });
    expect(chip([temp("2026-11-26 09:00", 37)])?.chip).toEqual({
      text: "Không sốt",
      tone: "good",
    });
    // Nothing measured, or the logs have not loaded: no chip.
    expect(chip([])?.chip).toBeNull();
    expect(chip(undefined)?.chip).toBeNull();
  });

  it("past episodes newest first, with the year on dates of another year", () => {
    expect(
      episodeList({ episodes: [...past, open], openLogs: [], now }).past,
    ).toEqual([
      {
        id: "nov",
        href: "/dot-om/chi-tiet?id=nov",
        text: "01/11 – 01/11 · 1 ngày",
      },
      {
        id: "oct",
        href: "/dot-om/chi-tiet?id=oct",
        text: "10/10 – 13/10 · 4 ngày",
      },
      {
        id: "newyear",
        href: "/dot-om/chi-tiet?id=newyear",
        text: "30/12/2025 – 02/01 · 4 ngày",
      },
    ]);
  });

  it("only closed episodes: nothing is open", () => {
    expect(episodeList({ episodes: past, openLogs: undefined, now }).open).toBe(
      null,
    );
  });
});

// Spec 2026-11-26 §7.1: {giờ} on the home card.
describe("clockText", () => {
  const now = vn("2026-11-26 10:00");

  it("is the time alone for a time today, with the date otherwise", () => {
    expect(clockText(vn("2026-11-26 07:05").getTime(), now)).toBe("07:05");
    expect(clockText(vn("2026-11-25 23:59").getTime(), now)).toBe(
      "25/11 23:59",
    );
  });
});

// Spec §7.1: the episode card of the home page.
describe("homeEpisodeCard", () => {
  const open = episode("2026-11-24 23:30", null, "ab-12");
  const now = vn("2026-11-26 10:00");
  const card = (logs: LogLike[] | undefined, at = now) =>
    homeEpisodeCard({ episode: open, logs, now: at });

  it("leads to the episode's page and names the day it is on", () => {
    expect(card([])).toEqual({
      href: "/dot-om/chi-tiet?id=ab-12",
      title: "Đang ốm · ngày 3",
      sub: "Chưa đo nhiệt độ",
    });
    expect(card([], vn("2026-11-24 23:45")).title).toBe("Đang ốm · ngày 1");
  });

  // The reading after "·" has no plain space: the line never breaks inside it.
  const nb = (text: string) => text.replaceAll(" ", "\u00a0");

  it("the line under the title follows the fever state, with the newest reading", () => {
    expect(card([temp("2026-11-26 07:05", 38.6)]).sub).toBe(
      `Đang sốt · ${nb("38,6°C lúc 07:05")}`,
    );
    // More than 6 hours old, and taken yesterday.
    expect(card([temp("2026-11-25 21:10", 38)]).sub).toBe(
      `Chưa đo lại · ${nb("38°C lúc 25/11 21:10")}`,
    );
    expect(
      card([temp("2026-11-25 15:00", 39.2), temp("2026-11-26 07:05", 37.4)])
        .sub,
    ).toBe(`Hết sốt 19 giờ · ${nb("37,4°C lúc 07:05")}`);
    expect(
      card([temp("2026-11-26 09:10", 38.2), temp("2026-11-26 09:50", 37.4)])
        .sub,
    ).toBe(`Hết sốt chưa đầy 1 giờ · ${nb("37,4°C lúc 09:50")}`);
    expect(card([temp("2026-11-26 07:05", 37.4)]).sub).toBe(
      `Không sốt · ${nb("37,4°C lúc 07:05")}`,
    );
  });

  it("has no line under the title until the episode's logs have loaded", () => {
    expect(card(undefined)).toEqual({
      href: "/dot-om/chi-tiet?id=ab-12",
      title: "Đang ốm · ngày 3",
      sub: null,
    });
  });
});

// Spec §7.3: the reminder to close the episode.
describe("closeReminderView", () => {
  const open = episode("2026-11-24 23:30");
  const now = vn("2026-11-29 10:00");
  const SUB =
    "Đợt ốm bắt đầu 24/11 xong chưa? Đóng lại thì các bản ghi sau đó không tính vào đợt này nữa.";
  const view = (kind: "no-fever" | "unchecked" | "quiet", logs: LogLike[]) =>
    closeReminderView({ kind, episode: open, logs, babyName: "Bun", now });

  it("no-fever: names the baby; the icon and tone of a fever that is over", () => {
    expect(
      view("no-fever", [
        temp("2026-11-25 15:00", 39.2),
        temp("2026-11-26 07:05", 37.4),
      ]),
    ).toEqual({
      title: "Bun đã 48 giờ không sốt",
      sub: SUB,
      tone: "good",
      icon: "check",
    });
  });

  it("unchecked: a clock, because nobody measured again", () => {
    expect(view("unchecked", [temp("2026-11-25 15:00", 39.2)])).toEqual({
      title: "48 giờ qua chưa đo lại nhiệt độ",
      sub: SUB,
      tone: "warn",
      icon: "clock",
    });
  });

  it("quiet: the icon of the episode's state, measured or not", () => {
    expect(view("quiet", [])).toEqual({
      title: "48 giờ qua không có triệu chứng hay liều hạ sốt nào",
      sub: SUB,
      tone: "neutral",
      icon: "thermo",
    });
    expect(view("quiet", [temp("2026-11-26 07:05", 37.4)])).toMatchObject({
      tone: "good",
      icon: "check",
    });
  });
});
