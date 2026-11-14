"use client";

import { useEffect, useState } from "react";
import {
  GUIDES,
  OfflineView,
  type Guide,
} from "@/components/offline/OfflineView";

export default function Page() {
  const [cached, setCached] = useState<Guide[]>([]);

  useEffect(() => {
    if (!("caches" in window)) return;
    void Promise.all(
      GUIDES.map(async (guide) =>
        (await caches.match(guide.href)) ? guide : null,
      ),
    ).then((found) => setCached(found.filter((g): g is Guide => g !== null)));
  }, []);

  return (
    <OfflineView cached={cached} onRetry={() => window.location.reload()} />
  );
}
