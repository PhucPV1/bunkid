"use client";

import { AuthGate } from "@/components/AuthGate";
import { HoldingScreen } from "@/components/holding/HoldingScreen";
import { ageDays } from "@/lib/rules/time";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ ctx }) =>
        ctx?.baby ? (
          <HoldingScreen ageDays={ageDays(ctx.baby.dob, new Date())} />
        ) : null
      }
    </AuthGate>
  );
}
