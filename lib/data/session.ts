"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { publicEnv } from "@/lib/env";
import { supabase } from "@/lib/supabase/client";
import { authStorageKey, parseStoredSession } from "./storedSession";

function storedSession(): Session | null {
  try {
    return parseStoredSession(
      window.localStorage.getItem(
        authStorageKey(publicEnv().NEXT_PUBLIC_SUPABASE_URL),
      ),
    );
  } catch {
    return null;
  }
}

export function useSession(): { session: Session | null; loading: boolean } {
  const [state, setState] = useState<{
    session: Session | null;
    loading: boolean;
  }>({
    session: null,
    loading: true,
  });

  useEffect(() => {
    const sb = supabase();
    // Offline, an expired access token cannot be refreshed and supabase-js
    // reports no session after ~25 s of retries. Keep the saved sign-in so
    // cached data stays viewable; RLS still guards every real request.
    const offlineFallback = () => (navigator.onLine ? null : storedSession());
    const saved = offlineFallback();
    if (saved) setState({ session: saved, loading: false });
    // getSession() waits for supabase-js to finish the PKCE code exchange on /auth/callback.
    sb.auth.getSession().then(({ data }) =>
      setState({
        session: data.session ?? offlineFallback(),
        loading: false,
      }),
    );
    const { data } = sb.auth.onAuthStateChange((event, session) =>
      setState({
        session: session ?? (event === "SIGNED_OUT" ? null : offlineFallback()),
        loading: false,
      }),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  return state;
}
