import { describe, expect, it } from "vitest";
import {
  agoText,
  selectDueNotifications,
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
              prefs: { feed_reminder: false, snooze_until: null },
            },
            {
              userId: "snoozed",
              prefs: { feed_reminder: true, snooze_until: minutesAgo(-30) },
            },
            {
              userId: "woke",
              prefs: { feed_reminder: true, snooze_until: minutesAgo(1) },
            },
            {
              userId: "plain",
              prefs: { feed_reminder: true, snooze_until: null },
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
