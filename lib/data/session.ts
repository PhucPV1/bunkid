"use client";

import type { Session } from "@supabase/supabase-js";
import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
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

type SessionState = { session: Session | null; loading: boolean };

const SessionContext = createContext<SessionState | null>(null);

// One sign-in state for the whole app, held above the pages (in Providers). A
// page that kept its own copy started from "loading" on every navigation, so
// each tab switch flashed the skeleton before showing data it already had.
export function SessionProvider({ children }: { children: ReactNode }) {
  return createElement(SessionContext, { value: useSessionState() }, children);
}

export function useSession(): SessionState {
  const state = useContext(SessionContext);
  if (!state) throw new Error("useSession cần SessionProvider bao ngoài");
  return state;
}

function useSessionState(): SessionState {
  const [state, setState] = useState<SessionState>({
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
