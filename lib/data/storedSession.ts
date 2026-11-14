import type { Session } from "@supabase/supabase-js";

// Same key supabase-js uses by default (sb-<first part of the host>-auth-token).
export function authStorageKey(supabaseUrl: string): string {
  return `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`;
}

export function parseStoredSession(raw: string | null): Session | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (
      typeof value === "object" &&
      value !== null &&
      "access_token" in value &&
      typeof value.access_token === "string" &&
      "user" in value &&
      typeof value.user === "object" &&
      value.user !== null &&
      "id" in value.user &&
      typeof value.user.id === "string"
    )
      return value as Session;
    return null;
  } catch {
    return null;
  }
}
