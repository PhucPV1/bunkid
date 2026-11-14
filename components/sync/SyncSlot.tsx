"use client";

import { createContext, useContext, type ReactNode } from "react";
import { SyncBar } from "./SyncBar";

// Spec §7.1 step 3: AuthGate owns the outbox user; each page header shows the line under itself.
const SyncUser = createContext<string | null>(null);

export function SyncBarProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  return <SyncUser.Provider value={userId}>{children}</SyncUser.Provider>;
}

export function SyncBarSlot() {
  const userId = useContext(SyncUser);
  return userId ? <SyncBar userId={userId} /> : null;
}
