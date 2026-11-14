"use client";

import { useSyncExternalStore } from "react";
import { onlineStore } from "@/lib/data/onlineStatus";

export function useOnline(): boolean {
  return useSyncExternalStore(
    onlineStore.subscribe,
    onlineStore.getSnapshot,
    onlineStore.getServerSnapshot,
  );
}
