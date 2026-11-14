import { describe, expect, it } from "vitest";
import type { VaccineDose } from "@/lib/content/vaccineSchema";
import {
  agoText,
  selectDueNotifications,
  wakeWindowMin,
  type BabyDispatchState,
} from "./pushSelection";

const now = new Date("2026-11-15T03:00:00Z"); // 10:00 on 15/11 in VN
const minutesAgo = (m: number) =>
  new Date(now.getTime() - m * 60_000).toISOString();

function baby(over: Partial<BabyDispatchState> = {}): BabyDispatchState {
  return {
    babyId: "b1",
    feedIntervalMin: 180,
    lastFeed: { id: "L1", startedAt: minutesAgo(190) },
    breastRunning: false,
    wake: null,
    vaccine: null,
    recipients: [{ userId: "u1", prefs: null }],
    ...over,
  };
}

describe("selectDueNotifications — feed (spec §8.3)", () => {
  it("reminds every recipient once the interval has passed", () => {
    const due = selectDueNotifications(
      [
        baby({
          recipients: [
            { userId: "u1", prefs: null },
            { userId: "u2", prefs: null },
          ],
        }),
      ],
      now,
    );
    expect(due).toEqual([
      {
        userId: "u1",
        kind: "feed",
        refKey: "feed:L1",
        title: "Đến giờ bú rồi",
        body: "Cữ trước lúc 06:50 (3 giờ 10 phút trước).",
        url: "/",
        tag: "feed:b1",
      },
      expect.objectContaining({ userId: "u2", refKey: "feed:L1" }),
    ]);
  });

  it("waits until exactly started_at + feed_interval_min", () => {
    expect(
      selectDueNotifications(
        [baby({ lastFeed: { id: "L1", startedAt: minutesAgo(179) } })],
        now,
      ),
    ).toEqual([]);
    expect(
      selectDueNotifications(
        [baby({ lastFeed: { id: "L1", startedAt: minutesAgo(180) } })],
        now,
      ),
    ).toHaveLength(1);
  });

  it("stays quiet when the last feed is older than 12 hours, or there is none", () => {
    expect(
      selectDueNotifications(
        [baby({ lastFeed: { id: "L1", startedAt: minutesAgo(720) } })],
        now,
      ),
    ).toHaveLength(1);
    expect(
      selectDueNotifications(
        [baby({ lastFeed: { id: "L1", startedAt: minutesAgo(721) } })],
        now,
      ),
    ).toEqual([]);
    expect(selectDueNotifications([baby({ lastFeed: null })], now)).toEqual([]);
  });

  it("stays quiet while a breast timer is running", () => {
    expect(
      selectDueNotifications([baby({ breastRunning: true })], now),
    ).toEqual([]);
  });

  it("respects the feed switch and snooze; an expired snooze no longer blocks", () => {
    const due = selectDueNotifications(
      [
        baby({
          recipients: [
            {
              userId: "off",
              prefs: {
                feed_reminder: false,
                wake_window: true,
                vaccine: true,
                snooze_until: null,
              },
            },
            {
              userId: "snoozed",
              prefs: {
                feed_reminder: true,
                wake_window: true,
                vaccine: true,
                snooze_until: minutesAgo(-30),
              },
            },
            {
              userId: "woke",
              prefs: {
                feed_reminder: true,
                wake_window: true,
                vaccine: true,
                snooze_until: minutesAgo(1),
              },
            },
            {
              userId: "plain",
              prefs: {
                feed_reminder: true,
                wake_window: true,
                vaccine: true,
                snooze_until: null,
              },
            },
          ],
        }),
      ],
      now,
    );
    expect(due.map((d) => d.userId)).toEqual(["woke", "plain"]);
  });

  it("handles each baby on its own", () => {
    const due = selectDueNotifications(
      [
        baby(),
        baby({
          babyId: "b2",
          lastFeed: { id: "L2", startedAt: minutesAgo(30) },
        }),
      ],
      now,
    );
    expect(due.map((d) => d.tag)).toEqual(["feed:b1"]);
  });

  it("agoText writes hours and minutes", () => {
    expect(agoText(185 * 60_000)).toBe("3 giờ 5 phút trước");
    expect(agoText(120 * 60_000)).toBe("2 giờ trước");
    expect(agoText(45 * 60_000 + 59_000)).toBe("45 phút trước");
  });
});

describe("selectDueNotifications — vaccine (spec §8.3)", () => {
  // Monday 16/11/2026 08:30 in VN. D3 = Thursday 19/11, D1 = Tuesday 17/11.
  const at = (iso: string) => new Date(iso);
  const morning = at("2026-11-16T01:30:00Z");
  const dob = "2026-09-14"; // 19/11 is day 66, 17/11 is day 64
  const vaxDose = (
    code: string,
    rec: number,
    extra: Partial<VaccineDose> = {},
  ): VaccineDose => ({
    code,
    doseNo: 1,
    name: `${code} mũi 1`,
    protects: ["X"],
    program: "dich_vu",
    recommendedAgeDays: rec,
    minAgeDays: rec,
    source: "https://example.org",
    reviewedAt: "2026-11-14",
    ...extra,
  });
  const doses = [
    vaxDose("hexa", 66, { group: "dtp_combo", series: "6in1" }),
    vaxDose("opv", 64),
    vaxDose("rotarix", 64, { group: "rota", series: "rotarix" }),
    vaxDose("bcg", 64),
    vaxDose("later", 65),
  ];
  const vaxBaby = (over: Partial<BabyDispatchState> = {}) =>
    baby({
      lastFeed: null,
      vaccine: {
        dob,
        choices: { dtp_combo: "6in1" },
        records: [
          {
            vaccine_code: "bcg",
            dose_no: 1,
            status: "done",
            given_on: null,
            due_on_override: null,
          },
        ],
      },
      ...over,
    });

  it("reminds 3 days and 1 day before open doses of chosen series, 08:00–08:59 VN", () => {
    expect(selectDueNotifications([vaxBaby()], morning, doses)).toEqual([
      {
        userId: "u1",
        kind: "vaccine",
        refKey: "vax:b1:opv:1:D1",
        title: "Sắp tới lịch tiêm",
        body: "opv mũi 1 vào Thứ Ba, 17/11.",
        url: "/tiem-chung",
        tag: "vaccine:b1:opv:1",
      },
      {
        userId: "u1",
        kind: "vaccine",
        refKey: "vax:b1:hexa:1:D3",
        title: "Sắp tới lịch tiêm",
        body: "hexa mũi 1 vào Thứ Năm, 19/11.",
        url: "/tiem-chung",
        tag: "vaccine:b1:hexa:1",
      },
    ]);
  });

  it("sends nothing outside 08:00–08:59 VN or without vaccine data", () => {
    for (const iso of ["2026-11-16T00:59:00Z", "2026-11-16T02:00:00Z"])
      expect(selectDueNotifications([vaxBaby()], at(iso), doses)).toEqual([]);
    expect(
      selectDueNotifications([vaxBaby({ vaccine: null })], morning, doses),
    ).toEqual([]);
  });

  it("uses a rescheduled date and skips doses marked skipped", () => {
    const due = selectDueNotifications(
      [
        vaxBaby({
          vaccine: {
            dob,
            choices: { dtp_combo: "6in1" },
            records: [
              {
                vaccine_code: "hexa",
                dose_no: 1,
                status: "rescheduled",
                given_on: null,
                due_on_override: "2026-11-17",
              },
              {
                vaccine_code: "opv",
                dose_no: 1,
                status: "skipped",
                given_on: null,
                due_on_override: null,
              },
            ],
          },
        }),
      ],
      morning,
      doses,
    );
    expect(due.map((d) => d.refKey)).toEqual([
      "vax:b1:bcg:1:D1",
      "vax:b1:hexa:1:D1",
    ]);
  });

  it("follows the vaccine switch and ignores snooze", () => {
    const due = selectDueNotifications(
      [
        vaxBaby({
          recipients: [
            {
              userId: "off",
              prefs: {
                feed_reminder: true,
                wake_window: true,
                vaccine: false,
                snooze_until: null,
              },
            },
            {
              userId: "snoozed",
              prefs: {
                feed_reminder: true,
                wake_window: true,
                vaccine: true,
                snooze_until: "2026-11-16T05:00:00Z",
              },
            },
          ],
        }),
      ],
      morning,
      doses,
    );
    expect(new Set(due.map((d) => d.userId))).toEqual(new Set(["snoozed"]));
  });
});

describe("selectDueNotifications — wake (spec §8.3)", () => {
  // 10:00 on 15/11 in VN; dob 2026-09-14 → 62 days old → W = 90 minutes.
  const wakeBaby = (
    over: Partial<NonNullable<BabyDispatchState["wake"]>> = {},
  ) =>
    baby({
      lastFeed: null,
      wake: {
        dob: "2026-09-14",
        lastSleep: { id: "S1", endedAt: minutesAgo(90) },
        sleepRunning: false,
        ...over,
      },
    });

  it("W(ageDays) follows the table at every boundary", () => {
    const cases: [number, number][] = [
      [0, 60],
      [27, 60],
      [28, 90],
      [90, 90],
      [91, 120],
      [150, 120],
      [151, 180],
      [240, 180],
      [241, 210],
      [365, 210],
      [366, 240],
    ];
    for (const [days, minutes] of cases)
      expect(wakeWindowMin(days)).toBe(minutes);
  });

  it("reminds once the baby has been awake W minutes", () => {
    expect(selectDueNotifications([wakeBaby()], now)).toEqual([
      {
        userId: "u1",
        kind: "wake",
        refKey: "wake:S1",
        title: "Bé thức đã 90 phút",
        body: "Bé có thể đang mệt, thử cho bé ngủ.",
        url: "/",
        tag: "wake:b1",
      },
    ]);
    expect(
      selectDueNotifications(
        [wakeBaby({ lastSleep: { id: "S1", endedAt: minutesAgo(89) } })],
        now,
      ),
    ).toEqual([]);
  });

  it("stays quiet while asleep, without a recent sleep, or past 12 hours", () => {
    for (const over of [
      { sleepRunning: true },
      { lastSleep: null },
      { lastSleep: { id: "S1", endedAt: minutesAgo(12 * 60 + 1) } },
    ])
      expect(selectDueNotifications([wakeBaby(over)], now)).toEqual([]);
    expect(
      selectDueNotifications(
        [wakeBaby({ lastSleep: { id: "S1", endedAt: minutesAgo(12 * 60) } })],
        now,
      ),
    ).toHaveLength(1);
  });

  it("respects the wake switch and snooze", () => {
    const due = selectDueNotifications(
      [
        baby({
          lastFeed: null,
          wake: {
            dob: "2026-09-14",
            lastSleep: { id: "S1", endedAt: minutesAgo(100) },
            sleepRunning: false,
          },
          recipients: [
            {
              userId: "off",
              prefs: {
                feed_reminder: true,
                wake_window: false,
                vaccine: true,
                snooze_until: null,
              },
            },
            {
              userId: "snoozed",
              prefs: {
                feed_reminder: true,
                wake_window: true,
                vaccine: true,
                snooze_until: minutesAgo(-30),
              },
            },
            {
              userId: "on",
              prefs: {
                feed_reminder: true,
                wake_window: true,
                vaccine: true,
                snooze_until: minutesAgo(1),
              },
            },
          ],
        }),
      ],
      now,
    );
    expect(due.map((d) => d.userId)).toEqual(["on"]);
  });
});
