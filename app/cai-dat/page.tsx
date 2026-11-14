"use client";

import { AuthGate } from "@/components/AuthGate";
import { SettingsScreen } from "@/components/settings/SettingsScreen";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ session, ctx }) =>
        ctx?.baby && session ? (
          <SettingsScreen
            member={ctx.member}
            baby={ctx.baby}
            email={session.user.email ?? ""}
            userId={session.user.id}
          />
        ) : null
      }
    </AuthGate>
  );
}
