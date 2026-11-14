"use client";

import { AuthGate } from "@/components/AuthGate";
import { SettingsScreen } from "@/components/settings/SettingsScreen";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ session, ctx }) =>
        ctx?.baby ? (
          <SettingsScreen
            member={ctx.member}
            baby={ctx.baby}
            email={session?.user.email ?? ""}
          />
        ) : null
      }
    </AuthGate>
  );
}
