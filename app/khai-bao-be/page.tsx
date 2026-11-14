"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { BabyForm } from "@/components/baby/BabyForm";
import { OnlineOnly } from "@/components/OnlineOnly";
import { VaccineSetup } from "@/components/vaccines/VaccineSetup";
import type { Baby } from "@/lib/supabase/rows";

export default function Page() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [created, setCreated] = useState<Baby | null>(null);

  // Home must already see the new baby, or its gate sends us back here.
  async function finish() {
    await queryClient.refetchQueries({ queryKey: ["family-context"] });
    router.replace("/");
  }
  return (
    <AuthGate need="family" keep={created !== null}>
      {({ ctx }) => (
        <main className="mx-auto flex max-w-md flex-col gap-4 p-6">
          <h1 className="text-2xl font-semibold">
            {created ? "Lịch tiêm của bé" : "Khai báo bé"}
          </h1>
          {created ? (
            <VaccineSetup
              baby={created}
              records={[]}
              initialChoices={{}}
              onDone={finish}
              onLater={finish}
            />
          ) : ctx?.member.role === "owner" ? (
            <OnlineOnly>
              <BabyForm familyId={ctx.family.id} onCreated={setCreated} />
            </OnlineOnly>
          ) : (
            <p className="text-muted">
              Chờ ba/mẹ của bé khai báo thông tin bé.
            </p>
          )}
        </main>
      )}
    </AuthGate>
  );
}
