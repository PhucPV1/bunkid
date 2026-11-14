import { VACCINES } from "@/lib/content/vaccines";
import type { VaccineDose } from "@/lib/content/vaccineSchema";
import { addDays, formatDayShort, WEEKDAYS } from "./days";
import { formatVnTime, vnDateString } from "./time";
import { buildSchedule, type DoseRecord } from "./vaccines";

export type NotificationKind = "feed" | "wake" | "vaccine";

export type Recipient = {
  userId: string;
  // null: the user never saved preferences, so every switch is on (spec §5.2).
  prefs: {
    feed_reminder: boolean;
    vaccine: boolean;
    snooze_until: string | null;
  } | null;
};

export type BabyDispatchState = {
  babyId: string;
  feedIntervalMin: number;
  // Latest breast/bottle log by started_at, or null when there is none.
  lastFeed: { id: string; startedAt: string } | null;
  breastRunning: boolean;
  // null: vaccine reminders are not evaluated for this baby.
  vaccine: {
    dob: string;
    choices: Record<string, string>;
    records: DoseRecord[];
  } | null;
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

// Vaccine reminders ignore snooze (spec §8.3); only the "Nhắc lịch tiêm" switch counts.
const wantsVaccine = (recipient: Recipient) =>
  recipient.prefs === null || recipient.prefs.vaccine;

function weekdayDate(day: string): string {
  const weekday = WEEKDAYS[new Date(`${day}T00:00:00Z`).getUTCDay()];
  return `${weekday}, ${formatDayShort(day)}`;
}

// Spec §8.3 row "vaccine": 08:00–08:59 VN time, open doses of a chosen series
// due in 3 days (D3) or tomorrow (D1).
function vaccineReminders(
  baby: BabyDispatchState,
  now: Date,
  doses: VaccineDose[],
): DueNotification[] {
  if (!baby.vaccine || formatVnTime(now).slice(0, 2) !== "08") return [];
  const today = vnDateString(now);
  const marks: Record<string, "D3" | "D1"> = {
    [addDays(today, 3)]: "D3",
    [addDays(today, 1)]: "D1",
  };
  const items = buildSchedule({
    doses,
    choices: baby.vaccine.choices,
    dob: baby.vaccine.dob,
    records: baby.vaccine.records,
    today,
  }).filter(
    (item) =>
      !item.unchosen &&
      item.state !== "done" &&
      item.state !== "skipped" &&
      marks[item.due] !== undefined,
  );
  return items.flatMap((item) =>
    baby.recipients.filter(wantsVaccine).map((recipient): DueNotification => ({
      userId: recipient.userId,
      kind: "vaccine",
      refKey: `vax:${baby.babyId}:${item.dose.code}:${item.dose.doseNo}:${marks[item.due]}`,
      title: "Sắp tới lịch tiêm",
      body: `${item.dose.name} vào ${weekdayDate(item.due)}.`,
      url: "/tiem-chung",
      // One tag per dose: several doses often fall on the same day.
      tag: `vaccine:${baby.babyId}:${item.dose.code}:${item.dose.doseNo}`,
    })),
  );
}

// Spec §8.3: "feed" and "vaccine". "wake" comes later in release 2.
export function selectDueNotifications(
  babies: BabyDispatchState[],
  now: Date,
  vaccineDoses: VaccineDose[] = VACCINES.doses,
): DueNotification[] {
  return babies.flatMap((baby) => [
    ...feedReminders(baby, now),
    ...vaccineReminders(baby, now, vaccineDoses),
  ]);
}
