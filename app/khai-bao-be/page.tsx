"use client";

import { AuthGate } from "@/components/AuthGate";
import { BabyForm } from "@/components/baby/BabyForm";

export default function Page() {
  return (
    <AuthGate need="family">
      {({ ctx }) => (
        <main className="mx-auto flex max-w-md flex-col gap-4 p-6">
          <h1 className="text-2xl font-semibold">Khai báo bé</h1>
          {ctx?.member.role === "owner" ? (
            <BabyForm familyId={ctx.family.id} />
          ) : (
            <p className="text-neutral-600">
              Chờ ba/mẹ của bé khai báo thông tin bé.
            </p>
          )}
        </main>
      )}
    </AuthGate>
  );
}
