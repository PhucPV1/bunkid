"use client";

import { AuthGate } from "@/components/AuthGate";
import { HeightScreen } from "@/components/height/HeightScreen";

export default function Page() {
  return (
    <AuthGate need="baby">
      {({ session, ctx }) =>
        ctx?.baby && session ? (
          <HeightScreen baby={ctx.baby} isOwner={ctx.member.role === "owner"} />
        ) : null
      }
    </AuthGate>
  );
}
