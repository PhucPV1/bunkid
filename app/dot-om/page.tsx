"use client";

import { AuthGate } from "@/components/AuthGate";
import { EpisodeListScreen } from "@/components/illness/EpisodeListScreen";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ session, ctx }) =>
        ctx?.baby && session ? (
          <EpisodeListScreen baby={ctx.baby} userId={session.user.id} />
        ) : null
      }
    </AuthGate>
  );
}
