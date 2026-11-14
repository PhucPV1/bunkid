"use client";

import { AuthGate } from "@/components/AuthGate";
import { ReportScreen } from "@/components/report/ReportScreen";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ ctx }) => (ctx?.baby ? <ReportScreen baby={ctx.baby} /> : null)}
    </AuthGate>
  );
}
