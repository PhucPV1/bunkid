import { formatVnTime } from "./time";

export type NotificationKind = "feed" | "wake" | "vaccine";

export type Recipient = {
  userId: string;
  // null: the user never saved preferences, so every switch is on (spec §5.2).
  prefs: { feed_reminder: boolean; snooze_until: string | null } | null;
};

export type BabyDispatchState = {
  babyId: string;
  feedIntervalMin: number;
  // Latest breast/bottle log by started_at, or null when there is none.
  lastFeed: { id: string; startedAt: string } | null;
  breastRunning: boolean;
  // Members with a user_id and at least one push subscription.
  recipients: Recipient[];
};

export type DueNotification = {
  userId: string;
  kind: NotificationKind;
  refKey: string;
  title: string;
  body: string;
  url: string;
  tag: string;
};

const HOUR_MS = 3_600_000;
const RECENT_FEED_MS = 12 * HOUR_MS;

export function agoText(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} phút trước`;
  if (minutes === 0) return `${hours} giờ trước`;
  return `${hours} giờ ${minutes} phút trước`;
}

function wantsFeed(recipient: Recipient, now: Date): boolean {
  const prefs = recipient.prefs;
  if (!prefs) return true;
  if (!prefs.feed_reminder) return false;
  return (
    prefs.snooze_until === null ||
    Date.parse(prefs.snooze_until) < now.getTime()
  );
}

function feedReminders(baby: BabyDispatchState, now: Date): DueNotification[] {
  const last = baby.lastFeed;
  if (!last || baby.breastRunning) return [];
  const since = now.getTime() - Date.parse(last.startedAt);
  if (since > RECENT_FEED_MS) return [];
  if (since < baby.feedIntervalMin * 60_000) return [];
  const body = `Cữ trước lúc ${formatVnTime(new Date(last.startedAt))} (${agoText(since)}).`;
  return baby.recipients
    .filter((recipient) => wantsFeed(recipient, now))
    .map((recipient) => ({
      userId: recipient.userId,
      kind: "feed",
      refKey: `feed:${last.id}`,
      title: "Đến giờ bú rồi",
      body,
      url: "/",
      tag: `feed:${baby.babyId}`,
    }));
}

// Spec §8.3. Release 1 sends only "feed"; "wake" and "vaccine" come in release 2.
export function selectDueNotifications(
  babies: BabyDispatchState[],
  now: Date,
): DueNotification[] {
  return babies.flatMap((baby) => feedReminders(baby, now));
}
