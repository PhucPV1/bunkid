"use client";

import { AuthGate } from "@/components/AuthGate";
import { GrowthScreen } from "@/components/growth/GrowthScreen";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ session, ctx }) =>
        ctx?.baby && session ? (
          <GrowthScreen
            baby={ctx.baby}
            userId={session.user.id}
            isOwner={ctx.member.role === "owner"}
          />
        ) : null
      }
    </AuthGate>
  );
}
