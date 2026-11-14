"use client";

import { AuthGate } from "@/components/AuthGate";
import { EmergencyScreen } from "@/components/emergency/EmergencyScreen";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ ctx }) =>
        ctx?.baby ? (
          <EmergencyScreen
            baby={ctx.baby}
            isOwner={ctx.member.role === "owner"}
          />
        ) : null
      }
    </AuthGate>
  );
}
