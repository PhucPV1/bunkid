"use client";

import { AuthGate } from "@/components/AuthGate";
import { MenuScreen } from "@/components/nav/MenuScreen";
import { GUIDE_ITEMS } from "@/lib/nav";

export default function Page() {
  return (
    <AuthGate need="baby">
      {() => <MenuScreen title="Cẩm nang" items={GUIDE_ITEMS} />}
    </AuthGate>
  );
}
