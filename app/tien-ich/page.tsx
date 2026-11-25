"use client";

import { AuthGate } from "@/components/AuthGate";
import { ToolsScreen } from "@/components/tools/ToolsScreen";

export default function Page() {
  return <AuthGate need="baby">{() => <ToolsScreen />}</AuthGate>;
}
