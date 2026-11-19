import { describe, expect, it } from "vitest";
import { describeLog, type LogLike } from "@/lib/rules/describeLog";
import { heroState } from "@/lib/rules/hero";
import {
  feedDue,
  homeStatusLines,
  sleepStatusLine,
  statusTiles,
} from "@/lib/rules/status";

const NOW = new Date("2026-11-14T05:00:00Z"); // 12:00 giờ VN
const H = 3_600_000;
const ago = (hours: number) =>
  new Date(NOW.getTime() - hours * H).toISOString();
const log = (
  type: string,
  start: number,
  end: number | null,
  details: unknown = {},
): LogLike => ({
  type,
  started_at: ago(start),
  ended_at: end === null ? null : ago(end),
  details,
});
const bottle = (h: number) => log("bottle", h, h, { ml: 90, milk: "formula" });
const lines = (logs: LogLike[]) =>
  homeStatusLines({ logs, feedIntervalMin: 180, now: NOW });

describe("homeStatusLines", () => {
  it("shows the next feed time from the last feed start", () => {
    expect(lines([bottle(1)])).toEqual(["Cữ bú tiếp theo khoảng 14:00"]);
  });
  it("says the feed is due once the interval has passed", () => {
    expect(lines([bottle(4)])).toEqual(["Đã đến giờ bú (từ 11:00)"]);
  });
  it("says the baby is feeding while a breast timer runs", () => {
    expect(lines([log("breast", 0.2, null, { side: "left" })])).toEqual([
      "Đang bú",
    ]);
  });
  it("hides lines based on data older than 12 hours", () => {
    expect(lines([bottle(13), log("sleep", 14, 13)])).toEqual([]);
  });
  it("shows how long the baby has been awake or asleep", () => {
    expect(lines([bottle(1), log("sleep", 2, 0.75)])).toEqual([
      "Cữ bú tiếp theo khoảng 14:00",
      "Bé đã thức 45 phút",
    ]);
    expect(lines([log("sleep", 1.5, null)])).toEqual([
      "Bé đang ngủ 1 giờ 30 phút",
    ]);
  });
});

describe("sleepStatusLine", () => {
  it("is the sleep line of homeStatusLines", () => {
    expect(sleepStatusLine([log("sleep", 2, 0.75)], NOW)).toBe(
      "Bé đã thức 45 phút",
    );
    expect(sleepStatusLine([log("sleep", 1.5, null)], NOW)).toBe(
      "Bé đang ngủ 1 giờ 30 phút",
    );
    expect(sleepStatusLine([log("sleep", 14, 13)], NOW)).toBeNull();
    expect(sleepStatusLine([bottle(1)], NOW)).toBeNull();
  });
});

describe("feedDue", () => {
  it("is the last feed start plus the interval, unless that feed is older than 12 hours", () => {
    expect(feedDue([bottle(2), bottle(1)], 180, NOW)?.toISOString()).toBe(
      "2026-11-14T07:00:00.000Z",
    );
    expect(feedDue([bottle(12)], 180, NOW)?.toISOString()).toBe(
      "2026-11-13T20:00:00.000Z",
    );
    expect(feedDue([bottle(12.01)], 180, NOW)).toBeNull();
    expect(feedDue([log("sleep", 1, 0.5)], 180, NOW)).toBeNull();
  });
});

// Spec 2026-11-19 §3.3: the three tiles under the hero card.
describe("statusTiles", () => {
  const span = (
    type: string,
    start: string,
    end: string | null,
    details: unknown,
  ): LogLike => ({ type, started_at: start, ended_at: end, details });
  const bottleAt = (iso: string) =>
    span("bottle", iso, iso, { ml: 90, milk: "formula" });
  const diaper = (h: number, wet: boolean, dirty: boolean) =>
    log("diaper", h, h, { wet, dirty });
  const tiles = (logs: LogLike[]) =>
    statusTiles({ logs, feedIntervalMin: 180, now: NOW });
  const nextFeed = (logs: LogLike[]) => tiles(logs)[0];
  const lastFeed = (logs: LogLike[]) => tiles(logs)[1];
  const lastDiaper = (logs: LogLike[]) => tiles(logs)[2];

  it("is exactly three tiles, all blank when nothing was logged", () => {
    expect(tiles([])).toEqual([
      { label: "Cữ bú tiếp", value: "—", note: "chưa ghi", tone: "muted" },
      { label: "Bú gần nhất", value: "—", note: "chưa ghi", tone: "muted" },
      { label: "Tã gần nhất", value: "—", note: "chưa ghi", tone: "muted" },
    ]);
    expect(tiles([log("sleep", 2, 1)])).toEqual(tiles([]));
  });

  describe("Cữ bú tiếp", () => {
    it("says Đang bú and the start time while a breast timer runs", () => {
      const running = log("breast", 0.25, null, { side: "left" });
      expect(nextFeed([bottle(4), running])).toEqual({
        label: "Cữ bú tiếp",
        value: "Đang bú",
        note: "từ 11:45",
        tone: "muted",
      });
    });

    it("is blank when feedDue has nothing: no feed in the last 12 hours", () => {
      expect(nextFeed([bottle(13)])).toEqual({
        label: "Cữ bú tiếp",
        value: "—",
        note: "chưa ghi",
        tone: "muted",
      });
    });

    it("before the expected time: the time, how long is left, good", () => {
      expect(nextFeed([bottle(1)])).toEqual({
        label: "Cữ bú tiếp",
        value: "14:00",
        note: "còn 2g",
        tone: "good",
      });
      expect(nextFeed([bottle(2.25)]).note).toBe("còn 45p");
    });

    it("at or after the expected time: the time, how late, warn", () => {
      expect(nextFeed([bottle(3.5)])).toEqual({
        label: "Cữ bú tiếp",
        value: "11:30",
        note: "trễ 30p",
        tone: "warn",
      });
      expect(nextFeed([bottle(3)])).toMatchObject({
        value: "12:00",
        note: "trễ 0p",
        tone: "warn",
      });
      expect(nextFeed([bottle(5.25)]).note).toBe("trễ 2g 15p");
    });

    it("rounds the minutes left up and the minutes late down, like heroState", () => {
      // Due at 12:59:30, 59.5 minutes from now.
      expect(nextFeed([bottleAt("2026-11-14T02:59:30Z")]).note).toBe("còn 1g");
      // Due at 11:58:30, 1.5 minutes ago.
      const late = [bottleAt("2026-11-14T01:58:30Z")];
      expect(nextFeed(late).note).toBe("trễ 1p");
      const hero = heroState({ logs: late, feedIntervalMin: 180, now: NOW });
      expect(hero).toMatchObject({ kind: "overdue", lateMinutes: 1 });
    });
  });

  describe("Bú gần nhất", () => {
    it("a finished breast feed: start time, side and length", () => {
      expect(lastFeed([log("breast", 1, 0.75, { side: "left" })])).toEqual({
        label: "Bú gần nhất",
        value: "11:00",
        note: "trái · 15p",
        tone: "muted",
      });
      expect(lastFeed([log("breast", 2, 0.75, { side: "right" })]).note).toBe(
        "phải · 1g 15p",
      );
    });

    it("counts the minutes of a feed the way describeLog does", () => {
      const feed = span(
        "breast",
        "2026-11-14T04:00:00Z",
        "2026-11-14T04:15:59Z",
        { side: "left" },
      );
      expect(describeLog(feed, NOW)).toBe("Bú trái · 15 phút");
      expect(lastFeed([feed]).note).toBe("trái · 15p");
    });

    it("a running breast feed: start time and the side being fed", () => {
      expect(lastFeed([log("breast", 0.25, null, { side: "right" })])).toEqual({
        label: "Bú gần nhất",
        value: "11:45",
        note: "đang bú phải",
        tone: "muted",
      });
      expect(lastFeed([log("breast", 0.25, null, { side: "left" })]).note).toBe(
        "đang bú trái",
      );
    });

    it("a bottle: time and ml", () => {
      expect(lastFeed([bottle(1)])).toEqual({
        label: "Bú gần nhất",
        value: "11:00",
        note: "bình · 90 ml",
        tone: "muted",
      });
    });

    it("takes the feed that started last", () => {
      const breast = log("breast", 3, 2.5, { side: "left" });
      expect(lastFeed([bottle(1), breast]).note).toBe("bình · 90 ml");
      expect(lastFeed([breast, bottle(4)]).note).toBe("trái · 30p");
    });

    it("only looks at the last 24 hours, and says so when every feed is older", () => {
      expect(lastFeed([bottle(25)])).toEqual({
        label: "Bú gần nhất",
        value: "—",
        note: "hơn 24 giờ",
        tone: "muted",
      });
      expect(lastFeed([bottle(24)])).toMatchObject({
        value: "12:00",
        note: "bình · 90 ml",
      });
      expect(lastFeed([bottle(30), bottle(23)]).value).toBe("13:00");
    });

    it("still shows a feed too old for the next-feed tile", () => {
      expect(tiles([bottle(13)]).map((t) => [t.value, t.note])).toEqual([
        ["—", "chưa ghi"],
        ["23:00", "bình · 90 ml"],
        ["—", "chưa ghi"],
      ]);
    });

    it("skips a feed whose details are not valid", () => {
      const broken = log("bottle", 0.5, 0.5, { ml: "nhiều" });
      expect(lastFeed([broken]).note).toBe("chưa ghi");
      expect(lastFeed([broken, bottle(2)]).value).toBe("10:00");
    });
  });

  describe("Tã gần nhất", () => {
    it("shows the time and what the diaper was", () => {
      expect(lastDiaper([diaper(0.5, true, false)])).toEqual({
        label: "Tã gần nhất",
        value: "11:30",
        note: "ướt",
        tone: "muted",
      });
      expect(lastDiaper([diaper(0.5, false, true)]).note).toBe("bẩn");
      expect(lastDiaper([diaper(0.5, true, true)]).note).toBe("ướt + bẩn");
    });

    it("takes the diaper that started last", () => {
      const logs = [diaper(3, true, true), diaper(1, false, true), bottle(0.5)];
      expect(lastDiaper(logs)).toMatchObject({ value: "11:00", note: "bẩn" });
    });

    it("only looks at the last 24 hours, and says so when every diaper is older", () => {
      expect(lastDiaper([diaper(24.5, true, false)])).toEqual({
        label: "Tã gần nhất",
        value: "—",
        note: "hơn 24 giờ",
        tone: "muted",
      });
      expect(lastDiaper([diaper(24, true, false)]).value).toBe("12:00");
    });

    it("skips a diaper whose details are not valid", () => {
      const broken = log("diaper", 0.5, 0.5, { wet: false, dirty: false });
      expect(lastDiaper([broken]).note).toBe("chưa ghi");
    });
  });
});
