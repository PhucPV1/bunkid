import { VACCINES } from "@/lib/content/vaccines";
import type { VaccineDose } from "@/lib/content/vaccineSchema";
import { addDays, formatDayShort, WEEKDAYS } from "./days";
import { FORGOTTEN_BREAST_MS } from "./ratings";
import { ageDays, formatVnTime, vnDateString } from "./time";
import { buildSchedule, type DoseRecord } from "./vaccines";

export type NotificationKind = "feed" | "wake" | "vaccine";

export type Recipient = {
  userId: string;
  // null: the user never saved preferences, so every switch is on (spec §5.2).
  prefs: {
    feed_reminder: boolean;
    wake_window: boolean;
    vaccine: boolean;
    snooze_until: string | null;
  } | null;
};

export type BabyDispatchState = {
  babyId: string;
  feedIntervalMin: number;
  // Latest breast/bottle log by started_at, or null when there is none.
  lastFeed: { id: string; startedAt: string } | null;
  // started_at of the running breast timer, or null when none is running.
  breastRunningSince: string | null;
  // null: wake reminders are not evaluated for this baby.
  wake: {
    dob: string;
    // Latest sleep log with ended_at, or null when there is none.
    lastSleep: { id: string; endedAt: string } | null;
    sleepRunning: boolean;
  } | null;
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
// Feed and wake reminders only look back 12 hours.
const RECENT_MS = 12 * HOUR_MS;

export function agoText(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} phút trước`;
  if (minutes === 0) return `${hours} giờ trước`;
  return `${hours} giờ ${minutes} phút trước`;
}

function notSnoozed(
  prefs: { snooze_until: string | null },
  now: Date,
): boolean {
  return (
    prefs.snooze_until === null ||
    Date.parse(prefs.snooze_until) < now.getTime()
  );
}

function wantsFeed(recipient: Recipient, now: Date): boolean {
  const prefs = recipient.prefs;
  if (!prefs) return true;
  return prefs.feed_reminder && notSnoozed(prefs, now);
}

function wantsWake(recipient: Recipient, now: Date): boolean {
  const prefs = recipient.prefs;
  if (!prefs) return true;
  return prefs.wake_window && notSnoozed(prefs, now);
}

// Spec §8.3: W(ageDays), the awake time in minutes after which a reminder is due.
export function wakeWindowMin(days: number): number {
  if (days <= 27) return 60;
  if (days <= 90) return 90;
  if (days <= 150) return 120;
  if (days <= 240) return 180;
  if (days <= 365) return 210;
  return 240;
}

// Spec §8.3 row "wake".
function wakeReminders(baby: BabyDispatchState, now: Date): DueNotification[] {
  const wake = baby.wake;
  if (!wake || wake.sleepRunning || !wake.lastSleep) return [];
  const since = now.getTime() - Date.parse(wake.lastSleep.endedAt);
  if (since > RECENT_MS) return [];
  if (since < wakeWindowMin(ageDays(wake.dob, now)) * 60_000) return [];
  const minutes = Math.floor(since / 60_000);
  const sleepId = wake.lastSleep.id;
  return baby.recipients
    .filter((recipient) => wantsWake(recipient, now))
    .map((recipient) => ({
      userId: recipient.userId,
      kind: "wake",
      refKey: `wake:${sleepId}`,
      title: `Bé thức đã ${minutes} phút`,
      body: "Bé có thể đang mệt, thử cho bé ngủ.",
      url: "/",
      tag: `wake:${baby.babyId}`,
    }));
}

function feedReminders(baby: BabyDispatchState, now: Date): DueNotification[] {
  const last = baby.lastFeed;
  if (!last) return [];
  // Quiet while the baby is feeding; a timer left running counts as forgotten,
  // so it cannot silence the reminders for the rest of the day.
  if (
    baby.breastRunningSince !== null &&
    now.getTime() - Date.parse(baby.breastRunningSince) < FORGOTTEN_BREAST_MS
  )
    return [];
  const since = now.getTime() - Date.parse(last.startedAt);
  if (since > RECENT_MS) return [];
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
// due in 3 days (D3) or tomorrow (D1). Doses past the product's age limit are left
// out: the app tells the family to ask a doctor instead of booking them.
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
      !item.pastMaxAge &&
      marks[item.due] !== undefined,
  );
  return items.flatMap((item) =>
    baby.recipients.filter(wantsVaccine).map((recipient): DueNotification => ({
      userId: recipient.userId,
      kind: "vaccine",
      // The due date is part of the key: a dose moved to another day (rescheduled,
      // or pushed back by a late previous dose) is reminded again for the new day.
      refKey: `vax:${baby.babyId}:${item.dose.code}:${item.dose.doseNo}:${marks[item.due]}:${item.due}`,
      title: "Sắp tới lịch tiêm",
      body: `${item.dose.name} vào ${weekdayDate(item.due)}.`,
      url: "/tiem-chung",
      // One tag per dose: several doses often fall on the same day.
      tag: `vaccine:${baby.babyId}:${item.dose.code}:${item.dose.doseNo}`,
    })),
  );
}

// Spec §8.3: "feed", "wake" and "vaccine".
export function selectDueNotifications(
  babies: BabyDispatchState[],
  now: Date,
  vaccineDoses: VaccineDose[] = VACCINES.doses,
): DueNotification[] {
  return babies.flatMap((baby) => [
    ...feedReminders(baby, now),
    ...wakeReminders(baby, now),
    ...vaccineReminders(baby, now, vaccineDoses),
  ]);
}
