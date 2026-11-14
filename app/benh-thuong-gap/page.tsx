"use client";

import { AuthGate } from "@/components/AuthGate";
import { ConditionsScreen } from "@/components/conditions/ConditionsScreen";

export default function Page() {
  return <AuthGate need="baby">{() => <ConditionsScreen />}</AuthGate>;
}
