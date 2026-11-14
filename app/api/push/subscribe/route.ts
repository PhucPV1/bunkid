import { supabasePushSubscriptionDeps } from "@/lib/server/pushSubscriptionDeps";
import { handleSubscribe } from "@/lib/server/pushSubscriptions";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return handleSubscribe(request, supabasePushSubscriptionDeps());
}
