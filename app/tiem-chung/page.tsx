"use client";

import { AuthGate } from "@/components/AuthGate";
import { VaccineScreen } from "@/components/vaccines/VaccineScreen";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ ctx }) =>
        ctx?.baby ? (
          <VaccineScreen
            baby={ctx.baby}
            isOwner={ctx.member.role === "owner"}
          />
        ) : null
      }
    </AuthGate>
  );
}
