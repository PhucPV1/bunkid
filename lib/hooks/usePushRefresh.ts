"use client";

import { useEffect } from "react";
import { refreshPushSubscription } from "@/lib/push/browser";

export function usePushRefresh(): void {
  useEffect(() => {
    // Push needs the service worker, which only exists in production builds.
    if (process.env.NODE_ENV !== "production") return;
    refreshPushSubscription().catch((error: unknown) => {
      console.warn("Không làm mới được đăng ký thông báo", error);
    });
  }, []);
}
