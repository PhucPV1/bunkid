import { z } from "zod";

const SubscribeBody = z.object({
  endpoint: z.url().startsWith("https://").max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(256),
    auth: z.string().min(1).max(256),
  }),
});
const UnsubscribeBody = z.object({ endpoint: z.string().min(1).max(2048) });

export type SubscriptionRow = {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
};

export type PushSubscriptionDeps = {
  userIdForToken(token: string): Promise<string | null>;
  upsertSubscription(row: SubscriptionRow): Promise<void>;
  deleteOwnSubscription(token: string, endpoint: string): Promise<void>;
};

export function bearerToken(header: string | null): string | null {
  const match = /^Bearer (\S+)$/.exec(header ?? "");
  return match ? match[1] : null;
}

const json = (status: number, body: Record<string, unknown>) =>
  Response.json(body, { status });

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function authenticate(
  request: Request,
  deps: PushSubscriptionDeps,
): Promise<{ token: string; userId: string } | null> {
  const token = bearerToken(request.headers.get("authorization"));
  if (!token) return null;
  const userId = await deps.userIdForToken(token);
  return userId ? { token, userId } : null;
}

export async function handleSubscribe(
  request: Request,
  deps: PushSubscriptionDeps,
): Promise<Response> {
  try {
    const auth = await authenticate(request, deps);
    if (!auth) return json(401, { error: "unauthorized" });
    const body = SubscribeBody.safeParse(await readJson(request));
    if (!body.success) return json(400, { error: "invalid_body" });
    // Upsert by endpoint and always take the caller as owner: a phone that
    // changes user moves its subscription to the new user (spec §8.1).
    await deps.upsertSubscription({
      user_id: auth.userId,
      endpoint: body.data.endpoint,
      p256dh: body.data.keys.p256dh,
      auth: body.data.keys.auth,
      user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
    });
    return json(200, { ok: true });
  } catch (error) {
    console.error("push subscribe failed", error);
    return json(500, { error: "server_error" });
  }
}

export async function handleUnsubscribe(
  request: Request,
  deps: PushSubscriptionDeps,
): Promise<Response> {
  try {
    const auth = await authenticate(request, deps);
    if (!auth) return json(401, { error: "unauthorized" });
    const body = UnsubscribeBody.safeParse(await readJson(request));
    if (!body.success) return json(400, { error: "invalid_body" });
    await deps.deleteOwnSubscription(auth.token, body.data.endpoint);
    return json(200, { ok: true });
  } catch (error) {
    console.error("push unsubscribe failed", error);
    return json(500, { error: "server_error" });
  }
}
