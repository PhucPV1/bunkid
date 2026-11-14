"use client";

import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useState, type ReactNode } from "react";
import { OutboxSync } from "@/components/sync/OutboxSync";
import { Backdrop } from "@/components/ui/Backdrop";
import { ToastProvider } from "@/components/ui/Toast";
import { trackBrowserOnline } from "@/lib/data/onlineStatus";
import { createDexiePersister, PERSIST_MAX_AGE_MS } from "@/lib/data/persister";
import { usePushRefresh } from "@/lib/hooks/usePushRefresh";
import { useServiceWorker } from "@/lib/hooks/useServiceWorker";
import { useSystemThemeSync } from "@/lib/hooks/useTheme";

// Bump when a cached query's data shape changes, so old saved data is dropped.
const PERSIST_BUSTER = "1";

export function Providers({ children }: { children: ReactNode }) {
  useSystemThemeSync();
  useServiceWorker();
  usePushRefresh();
  const [client] = useState(() => {
    if (typeof window !== "undefined") trackBrowserOnline(navigator, window);
    return new QueryClient({
      defaultOptions: {
        queries: {
          retry: 1,
          refetchOnWindowFocus: true,
          gcTime: PERSIST_MAX_AGE_MS,
        },
      },
    });
  });
  const [persister] = useState(() => createDexiePersister());
  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister,
        maxAge: PERSIST_MAX_AGE_MS,
        buster: PERSIST_BUSTER,
        dehydrateOptions: {
          // Keep queries whose last refetch failed offline, as long as they hold data.
          shouldDehydrateQuery: (query) => query.state.data !== undefined,
          // Paused writes cannot resume after a reload (no mutation defaults).
          shouldDehydrateMutation: () => false,
        },
      }}
    >
      <Backdrop />
      <OutboxSync />
      <ToastProvider>{children}</ToastProvider>
    </PersistQueryClientProvider>
  );
}
