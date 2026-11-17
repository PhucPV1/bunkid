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

// The session the UI treats as signed in. supabase-js reports no session while
// an expired token cannot be refreshed: offline, and also on Wi-Fi without
// internet, where navigator.onLine is still true. It only deletes the saved
// session when the server refused the refresh token or on sign-out, so a
// session still in storage stands in until then and cached data stays viewable.
// RLS still guards every real request.
export function effectiveSession(
  live: Session | null,
  saved: Session | null,
  event?: string,
): Session | null {
  if (live) return live;
  return event === "SIGNED_OUT" ? null : saved;
}
