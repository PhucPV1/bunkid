"use client";

import type { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useFamilyContext, type FamilyContext } from "@/lib/data/family";
import { useSession } from "@/lib/data/session";
import { gateRedirect, resolveLanding, type GateNeed } from "@/lib/routing";

export type GateState = { session: Session | null; ctx: FamilyContext };

export function AuthGate({
  need,
  children,
}: {
  need: GateNeed;
  children: (state: GateState) => ReactNode;
}) {
  const router = useRouter();
  const { session, loading } = useSession();
  const family = useFamilyContext(session?.user.id);
  const ready = !loading && (!session || family.isSuccess);
  const landing = ready
    ? resolveLanding({
        hasSession: Boolean(session),
        hasFamily: Boolean(family.data),
        hasBaby: Boolean(family.data?.baby),
      })
    : null;
  const redirect = landing ? gateRedirect(need, landing) : null;

  useEffect(() => {
    if (redirect) router.replace(redirect);
  }, [redirect, router]);

  if (session && family.isError) {
    return (
      <main className="p-6 text-center">
        <p className="mb-4">Không tải được dữ liệu gia đình.</p>
        <button
          type="button"
          className="min-h-11 rounded-xl bg-pink-500 px-4 text-white"
          onClick={() => family.refetch()}
        >
          Thử lại
        </button>
      </main>
    );
  }
  if (!ready || redirect)
    return <main className="p-6 text-center text-neutral-500">Đang tải…</main>;
  return <>{children({ session, ctx: family.data ?? null })}</>;
}
