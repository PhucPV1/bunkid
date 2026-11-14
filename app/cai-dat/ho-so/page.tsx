"use client";

import { AuthGate } from "@/components/AuthGate";
import { BabyProfileSection } from "@/components/settings/BabyProfileSection";
import { SettingsSubpage } from "@/components/settings/SettingsSubpage";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ ctx }) =>
        ctx?.baby ? (
          <SettingsSubpage title="Hồ sơ bé">
            <BabyProfileSection
              baby={ctx.baby}
              isOwner={ctx.member.role === "owner"}
            />
          </SettingsSubpage>
        ) : null
      }
    </AuthGate>
  );
}
