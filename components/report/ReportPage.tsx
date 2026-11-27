"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthGate, GateLoading } from "@/components/AuthGate";
import { ReportScreen } from "./ReportScreen";

function Report() {
  const dot = useSearchParams().get("dot");
  return (
    <AuthGate need="baby">
      {({ ctx }) =>
        ctx?.baby ? <ReportScreen baby={ctx.baby} dot={dot} /> : null
      }
    </AuthGate>
  );
}

// Spec 2026-11-26 §9: /bao-cao?dot={id} opens the report on that episode.
// The id is a query parameter so the page stays one static shell that also
// opens offline. Reading the address in a prerendered page needs a Suspense
// boundary
// (node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md):
// the static HTML holds the fallback, and the page itself renders in the
// browser.
export function ReportPage() {
  return (
    <Suspense fallback={<GateLoading />}>
      <Report />
    </Suspense>
  );
}
