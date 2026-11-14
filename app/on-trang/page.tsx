"use client";

import { AuthGate } from "@/components/AuthGate";
import { NoiseScreen } from "@/components/noise/NoiseScreen";

export default function Page() {
  return <AuthGate need="baby">{() => <NoiseScreen />}</AuthGate>;
}
