"use client";

import { AuthGate } from "@/components/AuthGate";
import { HomeScreen } from "@/components/home/HomeScreen";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ ctx, session }) =>
        ctx?.baby && session ? (
          <HomeScreen
            baby={ctx.baby}
            member={ctx.member}
            userId={session.user.id}
          />
        ) : null
      }
    </AuthGate>
  );
}
