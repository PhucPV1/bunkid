"use client";

import { AuthGate } from "@/components/AuthGate";
import { HistoryScreen } from "@/components/history/HistoryScreen";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ ctx, session }) =>
        ctx?.baby && session ? (
          <HistoryScreen
            baby={ctx.baby}
            member={ctx.member}
            userId={session.user.id}
          />
        ) : null
      }
    </AuthGate>
  );
}
