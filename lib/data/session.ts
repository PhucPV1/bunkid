"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

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
    // getSession() waits for supabase-js to finish the PKCE code exchange on /auth/callback.
    sb.auth
      .getSession()
      .then(({ data }) => setState({ session: data.session, loading: false }));
    const { data } = sb.auth.onAuthStateChange((_event, session) =>
      setState({ session, loading: false }),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  return state;
}
