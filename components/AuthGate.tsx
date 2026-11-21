"use client";

import type { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ActionChrome } from "@/components/actions/ActionChrome";
import { ChromeVisibilityProvider } from "@/components/actions/ChromeVisibility";
import { QuickActionsProvider } from "@/components/actions/QuickActions";
import { HomeSkeleton } from "@/components/home/HomeSkeleton";
import { TabBar } from "@/components/nav/TabBar";
import { SyncBarProvider } from "@/components/sync/SyncSlot";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { useFamilyContext, type FamilyContext } from "@/lib/data/family";
import { classifyLoadError, LOAD_ERROR_TEXT } from "@/lib/data/loadError";
import { useSession } from "@/lib/data/session";
import { gateRedirect, resolveLanding, type GateNeed } from "@/lib/routing";

export type GateState = { session: Session | null; ctx: FamilyContext };

// Spec §10: the gate waits with the home page's shapes under a header-sized
// bar, with the home page's 14 px gap.
export function GateLoading() {
  return (
    <main
      aria-busy="true"
      className="mx-auto flex max-w-md flex-col gap-3.5 p-4"
    >
      <Skeleton className="h-11 w-48 rounded-full" />
      <HomeSkeleton />
    </main>
  );
}

export function GateError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <ErrorCard message={message} onRetry={onRetry} />
    </main>
  );
}

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

  if (session && family.isError && !family.data)
    return (
      <GateError
        message={
          LOAD_ERROR_TEXT[
            classifyLoadError(
              family.error,
              typeof navigator === "undefined" ? true : navigator.onLine,
            )
          ]
        }
        onRetry={() => void family.refetch()}
      />
    );
  if (!ready || redirect) return <GateLoading />;
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
      <ChromeVisibilityProvider>
        <SyncBarProvider userId={session.user.id}>
          <div className="pb-[120px]">{content}</div>
        </SyncBarProvider>
        <ActionChrome babyName={baby.name} />
      </ChromeVisibilityProvider>
    </QuickActionsProvider>
  );
}
