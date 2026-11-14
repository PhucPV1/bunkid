"use client";

import { AuthGate } from "@/components/AuthGate";
import { TriageScreen } from "@/components/triage/TriageScreen";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ ctx }) => (ctx?.baby ? <TriageScreen baby={ctx.baby} /> : null)}
    </AuthGate>
  );
}
