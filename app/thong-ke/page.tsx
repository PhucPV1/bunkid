"use client";

import { AuthGate } from "@/components/AuthGate";
import { StatsScreen } from "@/components/stats/StatsScreen";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ ctx }) => (ctx?.baby ? <StatsScreen baby={ctx.baby} /> : null)}
    </AuthGate>
  );
}
