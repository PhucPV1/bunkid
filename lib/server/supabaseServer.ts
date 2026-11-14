import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";
import { serverEnv } from "./env";

const NO_SESSION = { persistSession: false, autoRefreshToken: false };

// Bypasses RLS. Only API routes use it, and only for the rows spec §3.1 allows.
export function supabaseServiceRole(): SupabaseClient<Database> {
  return createClient<Database>(
    publicEnv().NEXT_PUBLIC_SUPABASE_URL,
    serverEnv().SUPABASE_SERVICE_ROLE_KEY,
    { auth: NO_SESSION },
  );
}

// Acts as the signed-in user, so RLS applies.
export function supabaseForUser(accessToken: string): SupabaseClient<Database> {
  const env = publicEnv();
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: NO_SESSION,
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    },
  );
}
