export type PushSupport = "ok" | "needs-install" | "unsupported";

export type PushEnvironment = {
  standalone: boolean;
  isIOS: boolean;
  hasServiceWorker: boolean;
  hasPushManager: boolean;
  hasNotification: boolean;
};

// iPhone Safari only offers Web Push to an app opened from the Home Screen.
export function pushSupport(env: PushEnvironment): PushSupport {
  if (env.isIOS && !env.standalone) return "needs-install";
  if (!env.hasServiceWorker || !env.hasPushManager || !env.hasNotification)
    return "unsupported";
  return "ok";
}

export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function subscriptionBody(json: {
  endpoint?: string;
  keys?: Record<string, string>;
}): { endpoint: string; keys: { p256dh: string; auth: string } } | null {
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!json.endpoint || !p256dh || !auth) return null;
  return { endpoint: json.endpoint, keys: { p256dh, auth } };
}
