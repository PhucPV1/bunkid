"use client";

import { AuthGate } from "@/components/AuthGate";
import { MusicScreen } from "@/components/music/MusicScreen";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ session, ctx }) =>
        ctx && session ? (
          <MusicScreen
            familyId={ctx.family.id}
            userId={session.user.id}
            isOwner={ctx.member.role === "owner"}
          />
        ) : null
      }
    </AuthGate>
  );
}
