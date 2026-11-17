"use client";

import { supabase } from "@/lib/supabase/client";
import {
  pushSupport,
  subscriptionBody,
  urlBase64ToUint8Array,
  type PushSupport,
} from "./support";

export type DeviceState =
  PushSupport | "not-configured" | "denied" | "on" | "off";

// Inlined at build time; empty when the VAPID key is not set on Vercel.
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function environment() {
  return {
    standalone:
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
    isIOS: /iPhone|iPad|iPod/.test(navigator.userAgent),
    hasServiceWorker: "serviceWorker" in navigator,
    hasPushManager: "PushManager" in window,
    hasNotification: "Notification" in window,
  };
}

async function accessToken(): Promise<string> {
  const { data } = await supabase().auth.getSession();
  if (!data.session) throw new Error("Bạn cần đăng nhập lại.");
  return data.session.access_token;
}

async function post(path: string, body: unknown): Promise<void> {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${await accessToken()}`,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Máy chủ trả lỗi ${response.status}.`);
}

async function saveSubscription(subscription: PushSubscription): Promise<void> {
  const body = subscriptionBody(subscription.toJSON());
  if (!body) throw new Error("Trình duyệt không trả khóa thông báo.");
  await post("/api/push/subscribe", body);
}

// `ready` never settles when the service worker failed to register.
function registration(): Promise<ServiceWorkerRegistration> {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Service worker chưa sẵn sàng. Mở lại app.")),
        5000,
      ),
    ),
  ]);
}

async function currentSubscription(): Promise<PushSubscription | null> {
  return (await registration()).pushManager.getSubscription();
}

export async function deviceState(): Promise<DeviceState> {
  const support = pushSupport(environment());
  if (support !== "ok") return support;
  if (!VAPID_PUBLIC_KEY || process.env.NODE_ENV !== "production")
    return "not-configured";
  if (Notification.permission === "denied") return "denied";
  if (Notification.permission !== "granted") return "off";
  return (await currentSubscription()) ? "on" : "off";
}

// Must run from a tap: iOS only shows the permission prompt for a user gesture.
export async function enablePush(): Promise<DeviceState> {
  const permission = await Notification.requestPermission();
  if (permission === "denied") return "denied";
  if (permission !== "granted") return "off";
  const sw = await registration();
  const subscription =
    (await sw.pushManager.getSubscription()) ??
    (await sw.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }));
  await saveSubscription(subscription);
  return "on";
}

export async function disablePush(): Promise<DeviceState> {
  const subscription = await currentSubscription();
  if (subscription) {
    await post("/api/push/unsubscribe", { endpoint: subscription.endpoint });
    await subscription.unsubscribe();
  }
  return "off";
}

// Sign-out: this device must stop showing the baby's reminders. The server row
// is removed when the network allows; the local unsubscribe always runs, so a
// row that could not be removed is deleted by the dispatcher on its next send
// (the push service answers 410 for it).
export async function forgetPushOnThisDevice(): Promise<void> {
  if (pushSupport(environment()) !== "ok") return;
  // No service worker in development, and no subscription without permission:
  // skip the 5 s wait for a registration that will not come.
  if (process.env.NODE_ENV !== "production") return;
  if (Notification.permission !== "granted") return;
  const subscription = await currentSubscription();
  if (!subscription) return;
  try {
    await post("/api/push/unsubscribe", { endpoint: subscription.endpoint });
  } finally {
    await subscription.unsubscribe();
  }
}

// Spec §8.1: on every launch with permission, re-send the subscription so a
// rotated endpoint or a different signed-in user is picked up.
export async function refreshPushSubscription(): Promise<void> {
  if ((await deviceState()) !== "on") return;
  const subscription = await currentSubscription();
  if (subscription) await saveSubscription(subscription);
}
