"use client";

import { AuthGate } from "@/components/AuthGate";
import { LoginScreen } from "@/components/auth/LoginScreen";

export default function Page() {
  return <AuthGate need="anonymous">{() => <LoginScreen />}</AuthGate>;
}
