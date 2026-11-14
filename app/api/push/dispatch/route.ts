import { handleDispatch } from "@/lib/server/dispatch";
import { supabaseDispatchDeps } from "@/lib/server/dispatchDeps";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return handleDispatch(request, supabaseDispatchDeps());
}
