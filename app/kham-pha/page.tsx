"use client";

import { AuthGate } from "@/components/AuthGate";
import { ExploreScreen } from "@/components/explore/ExploreScreen";

export default function Page() {
  return <AuthGate need="baby">{() => <ExploreScreen />}</AuthGate>;
}
