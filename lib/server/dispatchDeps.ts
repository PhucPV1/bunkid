import webpush from "web-push";
import { vnDayStartMs } from "@/lib/rules/days";
import {
  buildMedicineState,
  type BabyDispatchState,
  type RunningTimer,
} from "@/lib/rules/pushSelection";
import { vnDateString } from "@/lib/rules/time";
import { parseChoices, toDoseRecords } from "@/lib/rules/vaccineForm";
import type { DispatchDeps } from "./dispatch";
import { pushEnv } from "./pushEnv";
import { supabaseServiceRole } from "./supabaseServer";

const TWELVE_HOURS_MS = 12 * 3_600_000;

function sideOf(details: unknown): RunningTimer["side"] {
  const side = (details as { side?: unknown } | null)?.side;
  return side === "left" || side === "right" ? side : null;
}
const VACCINE_TTL_S = 12 * 3600;

async function loadState(now: Date): Promise<BabyDispatchState[]> {
  const db = supabaseServiceRole();
  const { data: babies, error } = await db
    .from("babies")
    .select(
      "id, family_id, name, sex, feed_interval_min, dob, vaccine_choices",
    );
  if (error) throw error;

  const states: BabyDispatchState[] = [];
  for (const baby of babies) {
    const since = new Date(now.getTime() - TWELVE_HOURS_MS).toISOString();
    // Medicine logs since the earlier of 00:00 VN today and six hours ago.
    const medicineSince = new Date(
      Math.min(vnDayStartMs(vnDateString(now)), now.getTime() - 6 * 3_600_000),
    ).toISOString();
    const [
      feeds,
      sleeps,
      running,
      members,
      doses,
      schedules,
      medicineLogs,
      growth,
    ] = await Promise.all([
      db
        .from("logs")
        .select("id, started_at")
        .eq("baby_id", baby.id)
        .in("type", ["breast", "bottle"])
        .gte("started_at", since)
        .order("started_at", { ascending: false })
        .limit(1),
      db
        .from("logs")
        .select("id, ended_at")
        .eq("baby_id", baby.id)
        .eq("type", "sleep")
        .gte("ended_at", since)
        .order("ended_at", { ascending: false })
        .limit(1),
      // Running timers: at most one per type (unique index), so four rows at most.
      db
        .from("logs")
        .select("id, type, started_at, details")
        .eq("baby_id", baby.id)
        .in("type", ["breast", "sleep", "pump", "tummy"])
        .is("ended_at", null),
      db
        .from("family_members")
        .select("user_id")
        .eq("family_id", baby.family_id)
        .not("user_id", "is", null),
      db
        .from("vaccine_doses")
        .select("vaccine_code, dose_no, status, given_on, due_on_override")
        .eq("baby_id", baby.id),
      db
        .from("medicine_schedules")
        .select("id, name, remind_at_min, enabled, updated_at")
        .eq("baby_id", baby.id)
        .eq("enabled", true),
      db
        .from("logs")
        .select("id, started_at, details")
        .eq("baby_id", baby.id)
        .eq("type", "medicine")
        .gte("started_at", medicineSince),
      // Spec 2026-11-25 §8.2: every measurement, for the growth alerts and
      // the measure reminder.
      db
        .from("growth")
        .select(
          "id, measured_on, weight_g, length_cm, head_cm, created_by, created_at",
        )
        .eq("baby_id", baby.id),
    ]);
    for (const result of [
      feeds,
      sleeps,
      running,
      members,
      doses,
      schedules,
      medicineLogs,
      growth,
    ])
      if (result.error) throw result.error;

    const userIds = (members.data ?? []).flatMap((m) =>
      m.user_id ? [m.user_id] : [],
    );
    const [subscribed, prefs] = await Promise.all([
      db.from("push_subscriptions").select("user_id").in("user_id", userIds),
      db
        .from("notification_prefs")
        .select(
          "user_id, feed_reminder, wake_window, vaccine, snooze_until, medicine, timer_alert, quiet_enabled, quiet_start_min, quiet_end_min, hold_feed_while_asleep, growth_alert, growth_measure",
        )
        .in("user_id", userIds),
    ]);
    if (subscribed.error) throw subscribed.error;
    if (prefs.error) throw prefs.error;
    const withSubscription = new Set(subscribed.data.map((s) => s.user_id));
    const last = feeds.data?.[0];
    const lastSleep = sleeps.data?.[0];
    const runningRows = running.data ?? [];
    const runningTypes = new Set(runningRows.map((r) => r.type));

    states.push({
      babyId: baby.id,
      name: baby.name,
      feedIntervalMin: baby.feed_interval_min,
      lastFeed: last ? { id: last.id, startedAt: last.started_at } : null,
      breastRunningSince:
        runningRows.find((r) => r.type === "breast")?.started_at ?? null,
      runningTimers: runningRows.map((r): RunningTimer => ({
        id: r.id,
        type: r.type as RunningTimer["type"],
        startedAt: r.started_at,
        side: sideOf(r.details),
      })),
      wake: {
        dob: baby.dob,
        lastSleep: lastSleep?.ended_at
          ? { id: lastSleep.id, endedAt: lastSleep.ended_at }
          : null,
        sleepRunning: runningTypes.has("sleep"),
      },
      medicine: buildMedicineState({
        schedules: schedules.data ?? [],
        medicineLogs: medicineLogs.data ?? [],
        now,
      }),
      vaccine: {
        dob: baby.dob,
        choices: parseChoices(baby.vaccine_choices),
        records: toDoseRecords(doses.data ?? []),
      },
      growth: {
        dob: baby.dob,
        sex: baby.sex === "female" ? "female" : "male",
        rows: (growth.data ?? []).map((row) => ({
          id: row.id,
          measuredOn: row.measured_on,
          weightG: row.weight_g,
          lengthCm: row.length_cm,
          headCm: row.head_cm,
          createdBy: row.created_by,
          createdAt: row.created_at,
        })),
      },
      recipients: userIds
        .filter((id) => withSubscription.has(id))
        .map((userId) => {
          const row = prefs.data.find((p) => p.user_id === userId);
          return {
            userId,
            prefs: row
              ? {
                  feed_reminder: row.feed_reminder,
                  wake_window: row.wake_window,
                  vaccine: row.vaccine,
                  snooze_until: row.snooze_until,
                  medicine: row.medicine,
                  timer_alert: row.timer_alert,
                  quiet_enabled: row.quiet_enabled,
                  quiet_start_min: row.quiet_start_min,
                  quiet_end_min: row.quiet_end_min,
                  hold_feed_while_asleep: row.hold_feed_while_asleep,
                  growth_alert: row.growth_alert,
                  growth_measure: row.growth_measure,
                }
              : null,
          };
        }),
    });
  }
  return states;
}

export function supabaseDispatchDeps(): DispatchDeps {
  // Created on first use, so a wrong secret gets its 401 without touching Supabase.
  let client: ReturnType<typeof supabaseServiceRole> | null = null;
  const db = () => (client ??= supabaseServiceRole());
  return {
    cronSecret: () => pushEnv().CRON_SECRET,
    loadState,
    async claim(item) {
      const { data, error } = await db()
        .from("notification_log")
        .upsert(
          { user_id: item.userId, kind: item.kind, ref_key: item.refKey },
          { onConflict: "user_id,kind,ref_key", ignoreDuplicates: true },
        )
        .select("id");
      if (error) throw error;
      return data.length > 0;
    },
    async release(item) {
      const { error } = await db()
        .from("notification_log")
        .delete()
        .eq("user_id", item.userId)
        .eq("kind", item.kind)
        .eq("ref_key", item.refKey);
      if (error) throw error;
    },
    async subscriptionsFor(userId) {
      const { data, error } = await db()
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .eq("user_id", userId);
      if (error) throw error;
      return data;
    },
    async send(subscription, item) {
      const env = pushEnv();
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify({
            title: item.title,
            body: item.body,
            tag: item.tag,
            url: item.url,
          }),
          {
            // Vaccine reminders are only selected 08:00–08:59, so the push
            // service keeps them until the evening for a phone that is offline.
            TTL: item.kind === "vaccine" ? VACCINE_TTL_S : 3600,
            urgency: item.kind === "vaccine" ? "normal" : "high",
            vapidDetails: {
              subject: env.VAPID_SUBJECT,
              publicKey: env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
              privateKey: env.VAPID_PRIVATE_KEY,
            },
          },
        );
        return { ok: true };
      } catch (error) {
        if (error instanceof webpush.WebPushError)
          return { ok: false, statusCode: error.statusCode };
        // Not an answer from the push service (bad VAPID key, network): log why.
        console.error(
          "web-push failed before reaching the push service",
          error,
        );
        return { ok: false, statusCode: null };
      }
    },
    async deleteSubscription(id) {
      const { error } = await db()
        .from("push_subscriptions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    async markSuccess(id, at) {
      const { error } = await db()
        .from("push_subscriptions")
        .update({ last_success_at: at.toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
  };
}
