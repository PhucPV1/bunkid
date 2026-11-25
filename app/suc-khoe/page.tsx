"use client";

import { AuthGate } from "@/components/AuthGate";
import { HealthScreen } from "@/components/health/HealthScreen";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ ctx }) => (ctx?.baby ? <HealthScreen baby={ctx.baby} /> : null)}
    </AuthGate>
  );
}
