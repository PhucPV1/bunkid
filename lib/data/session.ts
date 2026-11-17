"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { publicEnv } from "@/lib/env";
import { supabase } from "@/lib/supabase/client";
import {
  authStorageKey,
  effectiveSession,
  parseStoredSession,
} from "./storedSession";

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
    // Show the saved sign-in at once: with an expired token and a network that
    // does not answer, getSession() below only settles after ~30 s of retries.
    const saved = storedSession();
    if (saved) setState({ session: saved, loading: false });
    // getSession() waits for supabase-js to finish the PKCE code exchange on /auth/callback.
    sb.auth.getSession().then(({ data }) =>
      setState({
        session: effectiveSession(data.session, storedSession()),
        loading: false,
      }),
    );
    const { data } = sb.auth.onAuthStateChange((event, session) =>
      setState({
        session: effectiveSession(session, storedSession(), event),
        loading: false,
      }),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  return state;
}
