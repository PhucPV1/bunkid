import {
  selectDueNotifications,
  type BabyDispatchState,
  type DueNotification,
} from "@/lib/rules/pushSelection";
import { bearerToken } from "./pushSubscriptions";
import { secretsMatch } from "./secret";

export type StoredSubscription = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type SendResult =
  { ok: true } | { ok: false; statusCode: number | null };

export type DispatchDeps = {
  cronSecret(): string;
  loadState(now: Date): Promise<BabyDispatchState[]>;
  // Inserts into notification_log; false when (user, kind, ref_key) was already sent.
  claim(item: DueNotification): Promise<boolean>;
  // Deletes the notification_log row again, so a later cron run retries the item.
  release(item: DueNotification): Promise<void>;
  subscriptionsFor(userId: string): Promise<StoredSubscription[]>;
  send(
    subscription: StoredSubscription,
    item: DueNotification,
  ): Promise<SendResult>;
  deleteSubscription(id: string): Promise<void>;
  markSuccess(id: string, at: Date): Promise<void>;
};

export type DispatchResult = { selected: number; sent: number; failed: number };

// The push service was unreachable or overloaded (or never answered): the same
// send can succeed a minute later. Any other status is final for this message.
const isTemporary = (statusCode: number | null) =>
  statusCode === null || statusCode === 429 || statusCode >= 500;

export async function runDispatch(
  deps: DispatchDeps,
  now: Date,
): Promise<DispatchResult> {
  const items = selectDueNotifications(await deps.loadState(now), now);
  const result: DispatchResult = { selected: items.length, sent: 0, failed: 0 };
  for (const item of items) {
    // Claim first: a second cron run in the same minute finds the log row and stops.
    if (!(await deps.claim(item))) continue;
    let delivered = false;
    let temporary = false;
    try {
      for (const subscription of await deps.subscriptionsFor(item.userId)) {
        const outcome = await deps.send(subscription, item);
        if (outcome.ok) {
          delivered = true;
          result.sent += 1;
          await deps.markSuccess(subscription.id, now);
        } else {
          result.failed += 1;
          if (isTemporary(outcome.statusCode)) temporary = true;
          if (outcome.statusCode === 404 || outcome.statusCode === 410)
            await deps.deleteSubscription(subscription.id);
          else
            console.error(
              "push send failed",
              subscription.id,
              outcome.statusCode,
            );
        }
      }
    } catch (error) {
      // A database hiccup on one item must not stop the reminders after it.
      console.error("push dispatch item failed", item.refKey, error);
      temporary = true;
    }
    // Nobody got it and the failure may pass: give the claim back so the next
    // run tries again, instead of losing the reminder for good.
    if (!delivered && temporary) await deps.release(item);
  }
  return result;
}

export async function handleDispatch(
  request: Request,
  deps: DispatchDeps,
  now: Date = new Date(),
): Promise<Response> {
  let secret: string;
  try {
    secret = deps.cronSecret();
  } catch (error) {
    console.error("push dispatch is not configured", error);
    return Response.json({ error: "not_configured" }, { status: 500 });
  }
  if (!secretsMatch(bearerToken(request.headers.get("authorization")), secret))
    return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    return Response.json(await runDispatch(deps, now));
  } catch (error) {
    console.error("push dispatch failed", error);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
