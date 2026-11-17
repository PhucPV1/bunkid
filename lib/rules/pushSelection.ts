import { VACCINES } from "@/lib/content/vaccines";
import type { VaccineDose } from "@/lib/content/vaccineSchema";
import { addDays, formatDayShort, vnDayStartMs, WEEKDAYS } from "./days";
import { detailsSchemas } from "./logDetails";
import { sameMedicine } from "./medicineNames";
import { DEFAULT_QUIET, inQuietHours, vnMinuteOfDay } from "./notifications";
import { FORGOTTEN_BREAST_MS } from "./ratings";
import { ageDays, formatVnTime, vnDateString } from "./time";
import { TIMER_LIMIT_MIN } from "./timer";
import { buildSchedule, type DoseRecord } from "./vaccines";

export type NotificationKind =
  "feed" | "wake" | "vaccine" | "medicine" | "timer";

export type Recipient = {
  userId: string;
  // null: the user never saved preferences, so every switch is on (spec §5.2).
  prefs: {
    feed_reminder: boolean;
    wake_window: boolean;
    vaccine: boolean;
    snooze_until: string | null;
    // Spec 2026-11-17 §4.1. A missing field means its default there, the same
    // rule as `prefs: null`.
    medicine?: boolean;
    timer_alert?: boolean;
    quiet_enabled?: boolean;
    quiet_start_min?: number;
    quiet_end_min?: number;
    hold_feed_while_asleep?: boolean;
  } | null;
};

// Spec 2026-11-17 §4.3: a timer that is running now.
export type RunningTimer = {
  id: string;
  type: "breast" | "sleep" | "pump" | "tummy";
  startedAt: string;
  side: "left" | "right" | null;
};

export type BabyDispatchState = {
  babyId: string;
  feedIntervalMin: number;
  // Latest breast/bottle log by started_at, or null when there is none.
  lastFeed: { id: string; startedAt: string } | null;
  // started_at of the running breast timer, or null when none is running.
  breastRunningSince: string | null;
  // Every running timer; empty when none runs.
  runningTimers: RunningTimer[];
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
  // Spec 2026-11-17 §4.3. `schedules` holds the enabled ones only; `loggedToday`
  // the names of the medicine logs since 00:00 VN; `lastAntipyretic` the latest
  // antipyretic dose of the last 6 hours.
  medicine: MedicineState;
  // Members with a user_id and at least one push subscription.
  recipients: Recipient[];
};

export type MedicineState = {
  schedules: {
    id: string;
    name: string;
    remindAtMin: number;
    updatedAt: string;
  }[];
  loggedToday: string[];
  lastAntipyretic: { id: string; startedAt: string } | null;
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

// Spec 2026-11-17 §4.3: inside this recipient's quiet hours. A reminder held
// here is not claimed, so the next cron run after the range sends it.
function isQuiet(prefs: NonNullable<Recipient["prefs"]>, now: Date): boolean {
  return inQuietHours(
    {
      quiet_enabled: prefs.quiet_enabled ?? DEFAULT_QUIET.quiet_enabled,
      quiet_start_min: prefs.quiet_start_min ?? DEFAULT_QUIET.quiet_start_min,
      quiet_end_min: prefs.quiet_end_min ?? DEFAULT_QUIET.quiet_end_min,
    },
    now,
  );
}

// A sleep timer under its limit; past it the timer counts as forgotten.
function babyAsleep(baby: BabyDispatchState, now: Date): boolean {
  const limit = TIMER_LIMIT_MIN.sleep * 60_000;
  return baby.runningTimers.some(
    (timer) =>
      timer.type === "sleep" &&
      now.getTime() - Date.parse(timer.startedAt) < limit,
  );
}

function wantsFeed(recipient: Recipient, now: Date, asleep: boolean): boolean {
  const prefs = recipient.prefs;
  if (!prefs) return true;
  return (
    prefs.feed_reminder &&
    notSnoozed(prefs, now) &&
    !isQuiet(prefs, now) &&
    !(asleep && (prefs.hold_feed_while_asleep ?? false))
  );
}

function wantsWake(recipient: Recipient, now: Date): boolean {
  const prefs = recipient.prefs;
  if (!prefs) return true;
  return prefs.wake_window && notSnoozed(prefs, now) && !isQuiet(prefs, now);
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
  const asleep = babyAsleep(baby, now);
  return baby.recipients
    .filter((recipient) => wantsFeed(recipient, now, asleep))
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

const SIX_HOURS_MS = 6 * HOUR_MS;

// What the dispatcher knows about a baby's medicine, from the rows it loaded:
// `medicineLogs` are the baby's medicine logs since the earlier of 00:00 VN
// today and six hours ago.
export function buildMedicineState(input: {
  schedules: {
    id: string;
    name: string;
    remind_at_min: number;
    enabled: boolean;
    updated_at: string;
  }[];
  medicineLogs: { id: string; started_at: string; details: unknown }[];
  now: Date;
}): MedicineState {
  const { schedules, medicineLogs, now } = input;
  const dayStart = vnDayStartMs(vnDateString(now));
  const loggedToday: string[] = [];
  let lastAntipyretic: { id: string; startedAt: string; at: number } | null =
    null;
  const sorted = [...medicineLogs].sort(
    (a, b) => Date.parse(a.started_at) - Date.parse(b.started_at),
  );
  for (const log of sorted) {
    const parsed = detailsSchemas.medicine.safeParse(log.details);
    const at = Date.parse(log.started_at);
    if (!parsed.success || at > now.getTime()) continue;
    if (at >= dayStart) loggedToday.push(parsed.data.name);
    if (parsed.data.antipyretic && now.getTime() - at < SIX_HOURS_MS)
      lastAntipyretic = { id: log.id, startedAt: log.started_at, at };
  }
  return {
    schedules: schedules
      .filter((s) => s.enabled)
      .map((s) => ({
        id: s.id,
        name: s.name,
        remindAtMin: s.remind_at_min,
        updatedAt: s.updated_at,
      })),
    loggedToday,
    lastAntipyretic: lastAntipyretic && {
      id: lastAntipyretic.id,
      startedAt: lastAntipyretic.startedAt,
    },
  };
}

// The "Nhắc thuốc" switch and snooze hold both medicine reminders; quiet hours
// hold only the daily one (spec 2026-11-17 §4.3).
function wantsMedicine(
  recipient: Recipient,
  now: Date,
  quietApplies: boolean,
): boolean {
  const prefs = recipient.prefs;
  if (!prefs) return true;
  return (
    (prefs.medicine ?? true) &&
    notSnoozed(prefs, now) &&
    !(quietApplies && isQuiet(prefs, now))
  );
}

// From the reminder time to the end of the VN day, while today has no log of
// that medicine. A schedule created or changed after today's time starts tomorrow.
function medicineReminders(
  baby: BabyDispatchState,
  now: Date,
): DueNotification[] {
  const today = vnDateString(now);
  const minute = vnMinuteOfDay(now);
  const dayStart = vnDayStartMs(today);
  return baby.medicine.schedules
    .filter((schedule) => {
      const remindAt = dayStart + schedule.remindAtMin * 60_000;
      return (
        minute >= schedule.remindAtMin &&
        Date.parse(schedule.updatedAt) <= remindAt &&
        !baby.medicine.loggedToday.some((name) =>
          sameMedicine(schedule.name, name),
        )
      );
    })
    .flatMap((schedule) =>
      baby.recipients
        .filter((recipient) => wantsMedicine(recipient, now, true))
        .map((recipient): DueNotification => ({
          userId: recipient.userId,
          kind: "medicine",
          // The time is part of the key: a schedule moved to later today reminds again.
          refKey: `med:${schedule.id}:${today}:${schedule.remindAtMin}`,
          title: `Đến giờ uống ${schedule.name}`,
          body: `Hôm nay chưa ghi ${schedule.name}.`,
          url: "/",
          tag: `medicine:${schedule.id}`,
        })),
    );
}

// Four hours after the latest antipyretic dose: time to measure again. It never
// says whether to give another dose.
function feverReminders(baby: BabyDispatchState, now: Date): DueNotification[] {
  const dose = baby.medicine.lastAntipyretic;
  if (!dose) return [];
  const since = now.getTime() - Date.parse(dose.startedAt);
  if (since < 4 * HOUR_MS || since >= SIX_HOURS_MS) return [];
  const body = `Liều trước lúc ${formatVnTime(new Date(dose.startedAt))}. Đo lại nhiệt độ cho bé.`;
  return baby.recipients
    .filter((recipient) => wantsMedicine(recipient, now, false))
    .map((recipient) => ({
      userId: recipient.userId,
      kind: "medicine",
      refKey: `fever:${dose.id}`,
      title: "Đã đủ 4 giờ từ liều hạ sốt",
      body,
      url: "/",
      tag: `fever:${baby.babyId}`,
    }));
}

const TIMER_NAME = { sleep: "Ngủ", pump: "Hút sữa", tummy: "Nằm sấp" } as const;

function timerName(timer: RunningTimer): string {
  if (timer.type === "breast")
    return timer.side === "right" ? "Bú phải" : "Bú trái";
  return TIMER_NAME[timer.type];
}

const limitText = (minutes: number) =>
  minutes % 60 === 0 && minutes > 60
    ? `${minutes / 60} giờ`
    : `${minutes} phút`;

function wantsTimer(recipient: Recipient, now: Date): boolean {
  const prefs = recipient.prefs;
  if (!prefs) return true;
  return (
    (prefs.timer_alert ?? true) &&
    notSnoozed(prefs, now) &&
    !isQuiet(prefs, now)
  );
}

// Once per timer that ran past its limit (spec 2026-11-17 §4.3).
function timerReminders(baby: BabyDispatchState, now: Date): DueNotification[] {
  return baby.runningTimers
    .filter(
      (timer) =>
        now.getTime() - Date.parse(timer.startedAt) >=
        TIMER_LIMIT_MIN[timer.type] * 60_000,
    )
    .flatMap((timer) =>
      baby.recipients
        .filter((recipient) => wantsTimer(recipient, now))
        .map((recipient): DueNotification => ({
          userId: recipient.userId,
          kind: "timer",
          refKey: `timer:${timer.id}`,
          // "quá": still true when quiet hours or snooze delayed it.
          title: `Timer ${timerName(timer)} đã chạy quá ${limitText(TIMER_LIMIT_MIN[timer.type])}`,
          body: "Nếu đã xong, mở Kim Bun để dừng.",
          url: "/",
          tag: `timer:${timer.id}`,
        })),
    );
}

// Spec §8.3: "feed", "wake" and "vaccine"; spec 2026-11-17 §4.3: "medicine" and "timer".
export function selectDueNotifications(
  babies: BabyDispatchState[],
  now: Date,
  vaccineDoses: VaccineDose[] = VACCINES.doses,
): DueNotification[] {
  return babies.flatMap((baby) => [
    ...feedReminders(baby, now),
    ...wakeReminders(baby, now),
    ...vaccineReminders(baby, now, vaccineDoses),
    ...medicineReminders(baby, now),
    ...feverReminders(baby, now),
    ...timerReminders(baby, now),
  ]);
}
