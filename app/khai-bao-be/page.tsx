"use client";

import { AuthGate } from "@/components/AuthGate";
import { BabyForm } from "@/components/baby/BabyForm";
import { OnlineOnly } from "@/components/OnlineOnly";

export default function Page() {
  return (
    <AuthGate need="family">
      {({ ctx }) => (
        <main className="mx-auto flex max-w-md flex-col gap-4 p-6">
          <h1 className="text-2xl font-semibold">Khai báo bé</h1>
          {ctx?.member.role === "owner" ? (
            <OnlineOnly>
              <BabyForm familyId={ctx.family.id} />
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
