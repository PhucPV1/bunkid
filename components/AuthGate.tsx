"use client";

import type { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ActionChrome } from "@/components/actions/ActionChrome";
import { QuickActionsProvider } from "@/components/actions/QuickActions";
import { TabBar } from "@/components/nav/TabBar";
import { SyncBar } from "@/components/sync/SyncBar";
import { useFamilyContext, type FamilyContext } from "@/lib/data/family";
import { classifyLoadError, LOAD_ERROR_TEXT } from "@/lib/data/loadError";
import { useSession } from "@/lib/data/session";
import { gateRedirect, resolveLanding, type GateNeed } from "@/lib/routing";

export type GateState = { session: Session | null; ctx: FamilyContext };

export function AuthGate({
  need,
  keep = false,
  children,
}: {
  need: GateNeed;
  // Stay on this page even when the landing page changes (onboarding step 2).
  keep?: boolean;
  children: (state: GateState) => ReactNode;
}) {
  const router = useRouter();
  const { session, loading } = useSession();
  const family = useFamilyContext(session?.user.id);
  const ready = !loading && (!session || family.data !== undefined);
  const landing = ready
    ? resolveLanding({
        hasSession: Boolean(session),
        hasFamily: Boolean(family.data),
        hasBaby: Boolean(family.data?.baby),
      })
    : null;
  const redirect = landing && !keep ? gateRedirect(need, landing) : null;

  useEffect(() => {
    if (redirect) router.replace(redirect);
  }, [redirect, router]);

  if (session && family.isError && !family.data) {
    return (
      <main className="p-6 text-center">
        <p className="mb-4">
          {
            LOAD_ERROR_TEXT[
              classifyLoadError(
                family.error,
                typeof navigator === "undefined" ? true : navigator.onLine,
              )
            ]
          }
        </p>
        <button
          type="button"
          className="min-h-11 rounded-xl bg-accent px-4 text-on-accent"
          onClick={() => family.refetch()}
        >
          Thử lại
        </button>
      </main>
    );
  }
  if (!ready || redirect)
    return <main className="p-6 text-center text-muted">Đang tải…</main>;
  const content = children({ session, ctx: family.data ?? null });
  if (need !== "baby") return <>{content}</>;
  const baby = family.data?.baby;
  const member = family.data?.member;
  if (!session || !baby || !member)
    return (
      <>
        <div className="pb-[120px]">{content}</div>
        <TabBar />
      </>
    );
  return (
    <QuickActionsProvider baby={baby} member={member} userId={session.user.id}>
      <SyncBar userId={session.user.id} />
      <div className="pb-[120px]">{content}</div>
      <ActionChrome babyName={baby.name} />
    </QuickActionsProvider>
  );
}
