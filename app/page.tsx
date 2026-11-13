"use client";

import { AuthGate } from "@/components/AuthGate";

export default function Page() {
  return (
    <AuthGate need="baby">
      {() => <main className="p-6 text-2xl font-semibold">Bé Yêu</main>}
    </AuthGate>
  );
}
