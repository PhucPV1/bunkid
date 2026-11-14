"use client";

import { AuthGate } from "@/components/AuthGate";
import { MenuScreen } from "@/components/nav/MenuScreen";
import { TOOL_ITEMS } from "@/lib/nav";

export default function Page() {
  return (
    <AuthGate need="baby">
      {() => <MenuScreen title="Tiện ích" items={TOOL_ITEMS} />}
    </AuthGate>
  );
}
