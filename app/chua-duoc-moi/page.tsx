"use client";

import { AuthGate } from "@/components/AuthGate";
import { NotInvited } from "@/components/auth/NotInvited";

export default function Page() {
  return (
    <AuthGate need="no-family">
      {({ session }) => <NotInvited email={session?.user.email ?? ""} />}
    </AuthGate>
  );
}
