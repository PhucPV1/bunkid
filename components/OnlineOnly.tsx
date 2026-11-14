"use client";

import type { ReactNode } from "react";
import { useOnline } from "@/lib/hooks/useOnline";

// Spec §9: writes that skip the outbox need the network. A disabled fieldset
// turns off every button, input and select inside it at once.
export function OnlineOnly({ children }: { children: ReactNode }) {
  const online = useOnline();
  return (
    <fieldset
      disabled={!online}
      className="flex min-w-0 flex-col gap-6 [&_:is(input,select,textarea):disabled]:opacity-50"
    >
      {!online && (
        <p role="status" className="rounded-xl bg-warn-soft p-3 text-warn-ink">
          Cần kết nối mạng để thay đổi các mục dưới đây.
        </p>
      )}
      {children}
    </fieldset>
  );
}
