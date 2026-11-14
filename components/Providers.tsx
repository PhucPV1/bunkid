"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { useServiceWorker } from "@/lib/hooks/useServiceWorker";
import { useSystemThemeSync } from "@/lib/hooks/useTheme";

export function Providers({ children }: { children: ReactNode }) {
  useSystemThemeSync();
  useServiceWorker();
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: true } },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
