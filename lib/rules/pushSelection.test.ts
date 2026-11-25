import { describe, expect, it } from "vitest";
import type { VaccineDose } from "@/lib/content/vaccineSchema";
import type { LmsRow } from "@/lib/content/who";
import { addDays } from "./days";
import {
  agoText,
  buildMedicineState,
  selectDueNotifications,
  wakeWindowMin,
  type BabyDispatchState,
  type GrowthState,
  type Recipient,
  type WhoTables,
} from "./pushSelection";

const now = new Date("2026-11-15T03:00:00Z"); // 10:00 on 15/11 in VN
const minutesAgo = (m: number) =>
  new Date(now.getTime() - m * 60_000).toISOString();

function baby(over: Partial<BabyDispatchState> = {}): BabyDispatchState {
  return {
    babyId: "b1",
    name: "Bun",
    feedIntervalMin: 180,
    lastFeed: { id: "L1", startedAt: minutesAgo(190) },
    breastRunningSince: null,
    runningTimers: [],
    medicine: { schedules: [], loggedToday: [], lastAntipyretic: null },
    wake: null,
    vaccine: null,
    growth: { dob: "2026-01-01", sex: "male", rows: [] },
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
      selectDueNotifications(
        [baby({ feedIntervalMin: 60, breastRunningSince: minutesAgo(59) })],
        now,
      ),
    ).toEqual([]);
  });

  it("reminds again once a breast timer has been left running for an hour", () => {
    const due = selectDueNotifications(
      [baby({ breastRunningSince: minutesAgo(190) })],
      now,
    );
    expect(due.map((d) => d.refKey)).toEqual(["feed:L1"]);
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
        refKey: "vax:b1:opv:1:D1:2026-11-17",
        title: "Sắp tới lịch tiêm",
        body: "opv mũi 1 vào Thứ Ba, 17/11.",
        url: "/tiem-chung",
        tag: "vaccine:b1:opv:1",
      },
      {
        userId: "u1",
        kind: "vaccine",
        refKey: "vax:b1:hexa:1:D3:2026-11-19",
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
      "vax:b1:bcg:1:D1:2026-11-17",
      "vax:b1:hexa:1:D1:2026-11-17",
    ]);
  });

  it("reminds again when a dose is moved to another day", () => {
    const keyFor = (dueOn: string) =>
      selectDueNotifications(
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
                  due_on_override: dueOn,
                },
              ],
            },
          }),
        ],
        morning,
        doses.filter((d) => d.code === "hexa"),
      ).map((d) => d.refKey);
    // Same dose, same D3 mark on two different mornings would otherwise share a key.
    expect(keyFor("2026-11-19")).toEqual(["vax:b1:hexa:1:D3:2026-11-19"]);
    expect(
      selectDueNotifications(
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
                  due_on_override: "2026-12-03",
                },
              ],
            },
          }),
        ],
        at("2026-11-30T01:30:00Z"),
        doses.filter((d) => d.code === "hexa"),
      ).map((d) => d.refKey),
    ).toEqual(["vax:b1:hexa:1:D3:2026-12-03"]);
  });

  it("does not remind for a dose past the product's age limit", () => {
    const due = selectDueNotifications(
      [
        vaxBaby({
          vaccine: {
            dob,
            choices: { rota: "rotarix" },
            records: [
              {
                vaccine_code: "rotarix",
                dose_no: 1,
                status: "rescheduled",
                given_on: null,
                due_on_override: "2026-11-17",
              },
            ],
          },
        }),
      ],
      morning,
      [
        vaxDose("rotarix", 30, {
          group: "rota",
          series: "rotarix",
          maxAgeDays: 40,
        }),
      ],
    );
    expect(due).toEqual([]);
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

describe("selectDueNotifications — quiet hours and a sleeping baby (spec 2026-11-17 §4.3)", () => {
  // `now` is 10:00 in VN; a quiet range of 09:00–11:00 covers it.
  const quiet = {
    feed_reminder: true,
    wake_window: true,
    vaccine: true,
    snooze_until: null,
    quiet_enabled: true,
    quiet_start_min: 540,
    quiet_end_min: 660,
  };
  const wakeDue = {
    dob: "2026-09-14",
    lastSleep: { id: "S1", endedAt: minutesAgo(200) },
    sleepRunning: false,
  };

  it("holds feed and wake reminders during a recipient's quiet hours", () => {
    const due = selectDueNotifications(
      [
        baby({
          wake: wakeDue,
          recipients: [
            { userId: "quiet", prefs: quiet },
            { userId: "off", prefs: { ...quiet, quiet_enabled: false } },
            { userId: "none", prefs: null },
          ],
        }),
      ],
      now,
    );
    expect(due.map((d) => `${d.userId}:${d.kind}`)).toEqual([
      "off:feed",
      "none:feed",
      "off:wake",
      "none:wake",
    ]);
  });

  it("sends the held reminder once quiet hours are over, with the same key", () => {
    const after = new Date(now.getTime() + 61 * 60_000); // 11:01
    const due = selectDueNotifications(
      [baby({ recipients: [{ userId: "quiet", prefs: quiet }] })],
      after,
    );
    expect(due.map((d) => d.refKey)).toEqual(["feed:L1"]);
  });

  it("does not hold vaccine reminders", () => {
    const morning = new Date("2026-11-16T01:30:00Z"); // 08:30 in VN
    const due = selectDueNotifications(
      [
        baby({
          lastFeed: null,
          vaccine: { dob: "2026-09-14", choices: {}, records: [] },
          recipients: [
            {
              userId: "quiet",
              prefs: { ...quiet, quiet_start_min: 480, quiet_end_min: 540 },
            },
          ],
        }),
      ],
      morning,
      [
        {
          code: "opv",
          doseNo: 1,
          name: "opv mũi 1",
          protects: ["X"],
          program: "dich_vu",
          recommendedAgeDays: 64,
          minAgeDays: 64,
          source: "https://example.org",
          reviewedAt: "2026-11-14",
        },
      ],
    );
    expect(due.map((d) => d.kind)).toEqual(["vaccine"]);
  });

  it("holds the feed reminder while the baby sleeps, only for who asked", () => {
    const hold = {
      ...quiet,
      quiet_enabled: false,
      hold_feed_while_asleep: true,
    };
    const sleeping = [
      {
        id: "S9",
        type: "sleep" as const,
        startedAt: minutesAgo(40),
        side: null,
      },
    ];
    const recipients = [
      { userId: "hold", prefs: hold },
      { userId: "plain", prefs: null },
    ];
    expect(
      selectDueNotifications(
        [baby({ runningTimers: sleeping, recipients })],
        now,
      ).map((d) => d.userId),
    ).toEqual(["plain"]);
    // The baby woke up: the reminder goes out on the next run.
    expect(
      selectDueNotifications([baby({ recipients })], now).map((d) => d.userId),
    ).toEqual(["hold", "plain"]);
  });

  it("a sleep timer left running for 14 hours no longer holds the reminder", () => {
    const hold = {
      ...quiet,
      quiet_enabled: false,
      hold_feed_while_asleep: true,
    };
    const forgotten = [
      {
        id: "S9",
        type: "sleep" as const,
        startedAt: minutesAgo(840),
        side: null,
      },
    ];
    expect(
      selectDueNotifications(
        [
          baby({
            runningTimers: forgotten,
            recipients: [{ userId: "hold", prefs: hold }],
          }),
        ],
        now,
      ).map((d) => `${d.userId}:${d.kind}`),
      // The feed reminder is no longer held, and the forgotten timer has its own.
    ).toEqual(["hold:feed", "hold:timer"]);
  });
});

describe("selectDueNotifications — medicine (spec 2026-11-17 §4.3)", () => {
  // `now` is 10:00 on 15/11 in VN (03:00Z); the VN day started at 17:00Z on 14/11.
  const schedule = (over: Record<string, unknown> = {}) => ({
    id: "m1",
    name: "Vitamin D",
    remindAtMin: 540, // 09:00
    updatedAt: "2026-11-10T00:00:00Z",
    ...over,
  });
  const medBaby = (
    medicine: Partial<BabyDispatchState["medicine"]>,
    over: Partial<BabyDispatchState> = {},
  ) =>
    baby({
      lastFeed: null,
      medicine: {
        schedules: [],
        loggedToday: [],
        lastAntipyretic: null,
        ...medicine,
      },
      ...over,
    });

  it("reminds once the time has come and the medicine is not logged today", () => {
    expect(
      selectDueNotifications([medBaby({ schedules: [schedule()] })], now),
    ).toEqual([
      {
        userId: "u1",
        kind: "medicine",
        refKey: "med:m1:2026-11-15:540",
        title: "Đến giờ uống Vitamin D",
        body: "Hôm nay chưa ghi Vitamin D.",
        url: "/",
        tag: "medicine:m1",
      },
    ]);
  });

  it("waits for the time, and stays quiet once the medicine is logged", () => {
    expect(
      selectDueNotifications(
        [medBaby({ schedules: [schedule({ remindAtMin: 601 })] })],
        now,
      ),
    ).toEqual([]);
    expect(
      selectDueNotifications(
        [medBaby({ schedules: [schedule()], loggedToday: ["vitamin d3"] })],
        now,
      ),
    ).toEqual([]);
    expect(
      selectDueNotifications(
        [medBaby({ schedules: [schedule()], loggedToday: ["DHA"] })],
        now,
      ).map((d) => d.refKey),
    ).toEqual(["med:m1:2026-11-15:540"]);
  });

  it("uses a new key on a new day and after the time is moved", () => {
    const next = new Date(now.getTime() + 24 * 3_600_000);
    expect(
      selectDueNotifications([medBaby({ schedules: [schedule()] })], next).map(
        (d) => d.refKey,
      ),
    ).toEqual(["med:m1:2026-11-16:540"]);
    expect(
      selectDueNotifications(
        [
          medBaby({
            schedules: [
              // Moved at 09:30 to 09:45: still ahead then, so it reminds again today.
              schedule({ remindAtMin: 585, updatedAt: "2026-11-15T02:30:00Z" }),
            ],
          }),
        ],
        now,
      ).map((d) => d.refKey),
    ).toEqual(["med:m1:2026-11-15:585"]);
  });

  it("starts tomorrow when the schedule was created or changed after today's time", () => {
    expect(
      selectDueNotifications(
        [
          medBaby({
            // Switched on at 09:50 with the 09:00 default.
            schedules: [schedule({ updatedAt: "2026-11-15T02:50:00Z" })],
          }),
        ],
        now,
      ),
    ).toEqual([]);
  });

  it("follows the Nhắc thuốc switch, snooze and quiet hours", () => {
    const on = {
      feed_reminder: true,
      wake_window: true,
      vaccine: true,
      snooze_until: null,
    };
    const due = selectDueNotifications(
      [
        medBaby(
          { schedules: [schedule()] },
          {
            recipients: [
              { userId: "off", prefs: { ...on, medicine: false } },
              {
                userId: "snoozed",
                prefs: { ...on, snooze_until: minutesAgo(-30) },
              },
              {
                userId: "quiet",
                prefs: {
                  ...on,
                  quiet_enabled: true,
                  quiet_start_min: 540,
                  quiet_end_min: 660,
                },
              },
              { userId: "on", prefs: on },
              { userId: "none", prefs: null },
            ],
          },
        ),
      ],
      now,
    );
    expect(due.map((d) => d.userId)).toEqual(["on", "none"]);
  });
});

describe("selectDueNotifications — after an antipyretic dose (spec 2026-11-17 §4.3)", () => {
  const dose = (minutes: number) => ({
    id: "F1",
    startedAt: minutesAgo(minutes),
  });
  const feverBaby = (minutes: number, over: Partial<BabyDispatchState> = {}) =>
    baby({
      lastFeed: null,
      medicine: {
        schedules: [],
        loggedToday: ["Paracetamol"],
        lastAntipyretic: dose(minutes),
      },
      ...over,
    });

  it("reminds from 4 hours up to, not including, 6 hours after the dose", () => {
    expect(selectDueNotifications([feverBaby(239)], now)).toEqual([]);
    expect(selectDueNotifications([feverBaby(240)], now)).toEqual([
      {
        userId: "u1",
        kind: "medicine",
        refKey: "fever:F1",
        title: "Đã đủ 4 giờ từ liều hạ sốt",
        body: "Liều trước lúc 06:00. Đo lại nhiệt độ cho bé.",
        url: "/",
        tag: "fever:b1",
      },
    ]);
    expect(selectDueNotifications([feverBaby(359)], now)).toHaveLength(1);
    expect(selectDueNotifications([feverBaby(360)], now)).toEqual([]);
  });

  it("is held by the switch and snooze, but not by quiet hours", () => {
    const on = {
      feed_reminder: true,
      wake_window: true,
      vaccine: true,
      snooze_until: null,
    };
    const due = selectDueNotifications(
      [
        feverBaby(250, {
          recipients: [
            { userId: "off", prefs: { ...on, medicine: false } },
            {
              userId: "snoozed",
              prefs: { ...on, snooze_until: minutesAgo(-30) },
            },
            {
              userId: "quiet",
              prefs: {
                ...on,
                quiet_enabled: true,
                quiet_start_min: 540,
                quiet_end_min: 660,
              },
            },
          ],
        }),
      ],
      now,
    );
    expect(due.map((d) => d.userId)).toEqual(["quiet"]);
  });
});

describe("selectDueNotifications — a timer left running (spec 2026-11-17 §4.3)", () => {
  const timer = (
    type: "breast" | "sleep" | "pump" | "tummy",
    minutes: number,
    side: "left" | "right" | null = null,
  ) => ({ id: `T-${type}`, type, startedAt: minutesAgo(minutes), side });
  const timerBaby = (
    runningTimers: BabyDispatchState["runningTimers"],
    over: Partial<BabyDispatchState> = {},
  ) => baby({ lastFeed: null, runningTimers, ...over });

  it("reminds at each type's limit, not before", () => {
    expect(
      selectDueNotifications(
        [
          timerBaby([
            timer("breast", 59, "left"),
            timer("pump", 59),
            timer("tummy", 29),
            timer("sleep", 839),
          ]),
        ],
        now,
      ),
    ).toEqual([]);
    const due = selectDueNotifications(
      [
        timerBaby([
          timer("breast", 60, "right"),
          timer("pump", 60),
          timer("tummy", 30),
          timer("sleep", 840),
        ]),
      ],
      now,
    );
    expect(due.map((d) => [d.kind, d.refKey, d.title])).toEqual([
      ["timer", "timer:T-breast", "Timer Bú phải đã chạy quá 60 phút"],
      ["timer", "timer:T-pump", "Timer Hút sữa đã chạy quá 60 phút"],
      ["timer", "timer:T-tummy", "Timer Nằm sấp đã chạy quá 30 phút"],
      ["timer", "timer:T-sleep", "Timer Ngủ đã chạy quá 14 giờ"],
    ]);
    expect(due[0]).toMatchObject({
      body: "Nếu đã xong, mở Kim Bun để dừng.",
      url: "/",
      tag: "timer:T-breast",
    });
  });

  it("follows the timer switch, snooze and quiet hours", () => {
    const on = {
      feed_reminder: true,
      wake_window: true,
      vaccine: true,
      snooze_until: null,
    };
    const due = selectDueNotifications(
      [
        timerBaby([timer("tummy", 45)], {
          recipients: [
            { userId: "off", prefs: { ...on, timer_alert: false } },
            {
              userId: "snoozed",
              prefs: { ...on, snooze_until: minutesAgo(-30) },
            },
            {
              userId: "quiet",
              prefs: {
                ...on,
                quiet_enabled: true,
                quiet_start_min: 540,
                quiet_end_min: 660,
              },
            },
            { userId: "on", prefs: on },
            { userId: "none", prefs: null },
          ],
        }),
      ],
      now,
    );
    expect(due.map((d) => d.userId)).toEqual(["on", "none"]);
  });
});

describe("buildMedicineState (spec 2026-11-17 §4.3)", () => {
  const log = (id: string, startedAt: string, details: unknown) => ({
    id,
    started_at: startedAt,
    details,
  });
  const med = (name: string, antipyretic = false) => ({
    name,
    amount: 1,
    unit: "ml",
    antipyretic,
  });

  it("keeps enabled schedules, today's names and the latest antipyretic of the last 6 hours", () => {
    const state = buildMedicineState({
      schedules: [
        {
          id: "m1",
          name: "Vitamin D",
          remind_at_min: 540,
          enabled: true,
          updated_at: "2026-11-10T00:00:00Z",
        },
        {
          id: "m2",
          name: "DHA",
          remind_at_min: 600,
          enabled: false,
          updated_at: "2026-11-10T00:00:00Z",
        },
      ],
      medicineLogs: [
        log("a", "2026-11-14T16:59:00Z", med("Hôm qua")), // 23:59 on 14/11 in VN
        log("b", "2026-11-14T17:00:00Z", med("Vitamin D")), // 00:00 on 15/11
        log("c", "2026-11-14T20:59:00Z", med("Paracetamol", true)), // 6 h 01 before now
        log("d", "2026-11-14T22:00:00Z", med("Paracetamol", true)), // 5 h before now
        log("e", "2026-11-15T01:00:00Z", med("Ibuprofen", true)), // 2 h before now
        log("f", "2026-11-15T02:00:00Z", med("DHA")),
        log("g", "2026-11-15T02:30:00Z", { broken: true }),
      ],
      now,
    });
    expect(state).toEqual({
      schedules: [
        {
          id: "m1",
          name: "Vitamin D",
          remindAtMin: 540,
          updatedAt: "2026-11-10T00:00:00Z",
        },
      ],
      loggedToday: [
        "Vitamin D",
        "Paracetamol",
        "Paracetamol",
        "Ibuprofen",
        "DHA",
      ],
      lastAntipyretic: { id: "e", startedAt: "2026-11-15T01:00:00Z" },
    });
  });

  it("has no antipyretic when the last one is older than 6 hours", () => {
    const state = buildMedicineState({
      schedules: [],
      medicineLogs: [
        log("c", "2026-11-14T20:59:00Z", med("Paracetamol", true)),
      ],
      now,
    });
    expect(state.lastAntipyretic).toBeNull();
    expect(state.loggedToday).toEqual(["Paracetamol"]);
  });
});

// L = 1, S = 1/8 and the same median on every day: z = (value / median − 1) × 8.
const flat = (median: number): LmsRow[] =>
  Array.from({ length: 1857 }, (_, day) => [day, 1, median, 0.125]);
// Boys: median 16, so 9 is far under the norm (z = −3,5). Girls: median 9.
const TABLES: WhoTables = {
  boys: { wfa: flat(16), lhfa: flat(16), hcfa: flat(16) },
  girls: { wfa: flat(9), lhfa: flat(9), hcfa: flat(9) },
};
const ALL_ON = {
  feed_reminder: true,
  wake_window: true,
  vaccine: true,
  snooze_until: null,
};
const measured = (
  over: Partial<GrowthState["rows"][number]> = {},
): GrowthState["rows"][number] => ({
  id: "g1",
  measuredOn: "2026-11-14",
  weightG: 9000,
  lengthCm: null,
  headCm: null,
  createdBy: "u1",
  createdAt: minutesAgo(60),
  ...over,
});
const TWO: Recipient[] = [
  { userId: "u1", prefs: null },
  { userId: "u2", prefs: null },
];

describe("selectDueNotifications — growth alert (spec 2026-11-25 §8.2)", () => {
  const due = (
    rows: GrowthState["rows"],
    recipients: Recipient[] = TWO,
    sex: GrowthState["sex"] = "male",
    at: Date = now,
  ) =>
    selectDueNotifications(
      [baby({ growth: { dob: "2026-01-01", sex, rows }, recipients })],
      at,
      [],
      TABLES,
    ).filter((item) => item.kind === "growth_alert");

  it("tells everyone but the member who entered the measurement", () => {
    expect(due([measured()])).toEqual([
      {
        userId: "u2",
        kind: "growth_alert",
        refKey: "growth:g1",
        title: "Tăng trưởng của Bun cần chú ý",
        body: "Cân nặng thấp hơn chuẩn nhiều. Nên cho bé đi khám.",
        url: "/tang-truong",
        tag: "growth:b1",
      },
    ]);
  });

  it("nothing measured, or the newest measurement has no alert: nothing is sent", () => {
    expect(due([])).toEqual([]);
    expect(due([measured({ weightG: 16000 })])).toEqual([]);
  });

  it("only within 24 hours of entering the measurement", () => {
    expect(
      due([measured({ createdAt: minutesAgo(24 * 60 - 1) })]),
    ).toHaveLength(1);
    expect(due([measured({ createdAt: minutesAgo(24 * 60) })])).toEqual([]);
  });

  it("an older day entered late is not the newest measurement: nothing is sent", () => {
    const rows = [
      measured({ weightG: 16000, createdAt: minutesAgo(3 * 24 * 60) }),
      measured({
        id: "g0",
        measuredOn: "2026-10-01",
        createdAt: minutesAgo(5),
      }),
    ];
    expect(due(rows)).toEqual([]);
  });

  it("two rows on the same day: the one entered last is the newest", () => {
    const rows = [
      measured({ id: "g1", weightG: 16000, createdAt: minutesAgo(90) }),
      measured({ id: "g2", createdBy: "u2", createdAt: minutesAgo(30) }),
    ];
    expect(due(rows).map((item) => [item.userId, item.refKey])).toEqual([
      ["u1", "growth:g2"],
    ]);
  });

  it("two alerts or more: the body gives the count", () => {
    const [item] = due([measured({ lengthCm: 9 })]);
    expect(item.body).toBe("2 chỉ số cần chú ý. Mở app để xem.");
  });

  it("counts only the indicators the newest measurement itself holds", () => {
    // The head was last measured on 01/10, far under the norm; the newest
    // row holds the weight only.
    const older = measured({
      id: "g0",
      measuredOn: "2026-10-01",
      weightG: null,
      headCm: 9,
      createdAt: minutesAgo(60 * 24 * 40),
    });
    expect(due([measured({ weightG: 16000 }), older])).toEqual([]);
    expect(due([measured(), older])[0].body).toBe(
      "Cân nặng thấp hơn chuẩn nhiều. Nên cho bé đi khám.",
    );
  });

  it("an alert about an older measurement is not sent for a newer one outside the WHO table", () => {
    // The newest row was measured at 1860 days old, past the table, so the
    // weight alert comes from the row measured at 1850 days.
    const dob = addDays("2026-11-14", -1860);
    const rows = [
      measured({ weightG: 16000 }),
      measured({
        id: "g0",
        measuredOn: addDays(dob, 1850),
        createdAt: minutesAgo(60 * 24 * 10),
      }),
    ];
    expect(
      selectDueNotifications(
        [baby({ growth: { dob, sex: "male", rows }, recipients: TWO })],
        now,
        [],
        TABLES,
      ).filter((item) => item.kind === "growth_alert"),
    ).toEqual([]);
  });

  it("uses the tables of the baby's sex", () => {
    expect(due([measured()], TWO, "female")).toEqual([]);
  });

  it("the switch off, snooze and quiet hours hold it; a missing field means on", () => {
    const recipients: Recipient[] = [
      { userId: "off", prefs: { ...ALL_ON, growth_alert: false } },
      {
        userId: "snoozed",
        prefs: { ...ALL_ON, snooze_until: minutesAgo(-30) },
      },
      {
        userId: "quiet",
        prefs: {
          ...ALL_ON,
          quiet_enabled: true,
          quiet_start_min: 0,
          quiet_end_min: 1439,
        },
      },
      { userId: "plain", prefs: ALL_ON },
      { userId: "on", prefs: { ...ALL_ON, growth_alert: true } },
      { userId: "never-saved", prefs: null },
    ];
    expect(due([measured()], recipients).map((item) => item.userId)).toEqual([
      "plain",
      "on",
      "never-saved",
    ]);
  });

  it("comes after the timer reminders", () => {
    const kinds = selectDueNotifications(
      [
        baby({
          growth: { dob: "2026-01-01", sex: "male", rows: [measured()] },
          // A tummy-time timer left running past its 30 minutes.
          runningTimers: [
            { id: "t1", type: "tummy", startedAt: minutesAgo(45), side: null },
          ],
          recipients: TWO,
        }),
      ],
      now,
      [],
      TABLES,
    ).map((item) => item.kind);
    expect(kinds).toEqual(["feed", "feed", "timer", "timer", "growth_alert"]);
  });
});
