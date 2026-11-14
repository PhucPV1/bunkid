"use client";

import { AuthGate } from "@/components/AuthGate";
import { HistoryScreen } from "@/components/history/HistoryScreen";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ ctx }) =>
        ctx?.baby ? <HistoryScreen baby={ctx.baby} member={ctx.member} /> : null
      }
    </AuthGate>
  );
}
