"use client";

import { AuthGate } from "@/components/AuthGate";
import { FeedIntervalSection } from "@/components/settings/FeedIntervalSection";
import { SettingsSubpage } from "@/components/settings/SettingsSubpage";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ ctx }) =>
        ctx?.baby ? (
          <SettingsSubpage title="Khoảng cách cữ bú">
            <FeedIntervalSection
              baby={ctx.baby}
              isOwner={ctx.member.role === "owner"}
            />
          </SettingsSubpage>
        ) : null
      }
    </AuthGate>
  );
}
