import { supabasePushSubscriptionDeps } from "@/lib/server/pushSubscriptionDeps";
import { handleUnsubscribe } from "@/lib/server/pushSubscriptions";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return handleUnsubscribe(request, supabasePushSubscriptionDeps());
}
