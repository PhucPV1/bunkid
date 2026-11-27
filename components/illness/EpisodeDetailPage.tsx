"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthGate, GateLoading } from "@/components/AuthGate";
import { EpisodeScreen } from "./EpisodeScreen";

function Detail() {
  const id = useSearchParams().get("id");
  return (
    <AuthGate need="baby">
      {({ session, ctx }) =>
        ctx?.baby && session ? (
          <EpisodeScreen
            baby={ctx.baby}
            userId={session.user.id}
            isOwner={ctx.member.role === "owner"}
            id={id}
          />
        ) : null
      }
    </AuthGate>
  );
}

// Spec 2026-11-26 §6.1: /dot-om/chi-tiet?id={uuid}. The id is a query
// parameter so the page is one static shell that also opens offline. Reading
// the address in a prerendered page needs a Suspense boundary
// (node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md):
// the static HTML holds the fallback, and the page itself renders in the
// browser.
export function EpisodeDetailPage() {
  return (
    <Suspense fallback={<GateLoading />}>
      <Detail />
    </Suspense>
  );
}
