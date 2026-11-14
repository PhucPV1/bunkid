"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { BabyForm } from "@/components/baby/BabyForm";
import { OnlineOnly } from "@/components/OnlineOnly";
import { Glass } from "@/components/ui/Glass";
import { PageHeader } from "@/components/ui/PageHeader";
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
      {({ session, ctx }) => (
        <main className="mx-auto flex max-w-md flex-col gap-[18px] px-4 pt-2 pb-4">
          <PageHeader title={created ? "Lịch tiêm của bé" : "Khai báo bé"} />
          {created && session ? (
            <VaccineSetup
              baby={created}
              userId={session.user.id}
              records={[]}
              initialChoices={{}}
              onDone={finish}
              onLater={finish}
            />
          ) : ctx?.member.role === "owner" ? (
            <Glass className="p-4">
              <OnlineOnly>
                <BabyForm familyId={ctx.family.id} onCreated={setCreated} />
              </OnlineOnly>
            </Glass>
          ) : (
            <Glass className="p-4 text-base text-muted">
              Chờ ba/mẹ của bé khai báo thông tin bé.
            </Glass>
          )}
        </main>
      )}
    </AuthGate>
  );
}
