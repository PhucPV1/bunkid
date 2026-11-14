"use client";

import { useEffect } from "react";

export function useServiceWorker(): void {
  useEffect(() => {
    // public/sw.js only exists after `bun run build` (prebuild), so dev skips it.
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
      console.error("Service worker registration failed", error);
    });
  }, []);
}
