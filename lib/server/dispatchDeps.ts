import webpush from "web-push";
import type { BabyDispatchState } from "@/lib/rules/pushSelection";
import { parseChoices, toDoseRecords } from "@/lib/rules/vaccineForm";
import type { DispatchDeps } from "./dispatch";
import { pushEnv } from "./pushEnv";
import { supabaseServiceRole } from "./supabaseServer";

const TWELVE_HOURS_MS = 12 * 3_600_000;

async function loadState(now: Date): Promise<BabyDispatchState[]> {
  const db = supabaseServiceRole();
  const { data: babies, error } = await db
    .from("babies")
    .select("id, family_id, feed_interval_min, dob, vaccine_choices");
  if (error) throw error;

  const states: BabyDispatchState[] = [];
  for (const baby of babies) {
    const since = new Date(now.getTime() - TWELVE_HOURS_MS).toISOString();
    const [feeds, sleeps, running, members, doses] = await Promise.all([
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
      // Running timers: at most one per type (unique index), so two rows at most.
      db
        .from("logs")
        .select("type")
        .eq("baby_id", baby.id)
        .in("type", ["breast", "sleep"])
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
    ]);
    for (const result of [feeds, sleeps, running, members, doses])
      if (result.error) throw result.error;

    const userIds = (members.data ?? []).flatMap((m) =>
      m.user_id ? [m.user_id] : [],
    );
    const [subscribed, prefs] = await Promise.all([
      db.from("push_subscriptions").select("user_id").in("user_id", userIds),
      db
        .from("notification_prefs")
        .select("user_id, feed_reminder, wake_window, vaccine, snooze_until")
        .in("user_id", userIds),
    ]);
    if (subscribed.error) throw subscribed.error;
    if (prefs.error) throw prefs.error;
    const withSubscription = new Set(subscribed.data.map((s) => s.user_id));
    const last = feeds.data?.[0];
    const lastSleep = sleeps.data?.[0];
    const runningTypes = new Set((running.data ?? []).map((r) => r.type));

    states.push({
      babyId: baby.id,
      feedIntervalMin: baby.feed_interval_min,
      lastFeed: last ? { id: last.id, startedAt: last.started_at } : null,
      breastRunning: runningTypes.has("breast"),
      wake: {
        dob: baby.dob,
        lastSleep: lastSleep?.ended_at
          ? { id: lastSleep.id, endedAt: lastSleep.ended_at }
          : null,
        sleepRunning: runningTypes.has("sleep"),
      },
      vaccine: {
        dob: baby.dob,
        choices: parseChoices(baby.vaccine_choices),
        records: toDoseRecords(doses.data ?? []),
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
            TTL: 3600,
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
