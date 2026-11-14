"use client";

import { AuthGate } from "@/components/AuthGate";
import { SettingsScreen } from "@/components/settings/SettingsScreen";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ session, ctx }) =>
        ctx ? (
          <SettingsScreen
            member={ctx.member}
            email={session?.user.email ?? ""}
          />
        ) : null
      }
    </AuthGate>
  );
}
