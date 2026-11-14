"use client";

import { AuthGate } from "@/components/AuthGate";
import { MembersSection } from "@/components/settings/MembersSection";
import { SettingsSubpage } from "@/components/settings/SettingsSubpage";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ ctx }) =>
        ctx?.baby ? (
          <SettingsSubpage title="Thành viên">
            <MembersSection me={ctx.member} />
          </SettingsSubpage>
        ) : null
      }
    </AuthGate>
  );
}
