"use client";

import { AuthGate } from "@/components/AuthGate";
import { MilestonesScreen } from "@/components/milestones/MilestonesScreen";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ session, ctx }) =>
        ctx?.baby && session ? (
          <MilestonesScreen
            baby={ctx.baby}
            userId={session.user.id}
            isOwner={ctx.member.role === "owner"}
          />
        ) : null
      }
    </AuthGate>
  );
}
