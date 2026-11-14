"use client";

import { useEffect, useState } from "react";
import { droppedWrites, takeRecentDrop } from "@/lib/data/outboxEvents";
import { useOutboxEntries } from "@/lib/hooks/useOutboxEntries";

const NOTICE_MS = 6000;

export function SyncBar({ userId }: { userId: string }) {
  const count = useOutboxEntries(userId).length;
  const [dropped, setDropped] = useState<string | null>(null);

  useEffect(() => {
    setDropped(takeRecentDrop());
    return droppedWrites.listen((reason) => {
      takeRecentDrop();
      setDropped(reason);
    });
  }, []);
  useEffect(() => {
    if (!dropped) return;
    const timer = window.setTimeout(() => setDropped(null), NOTICE_MS);
    return () => window.clearTimeout(timer);
  }, [dropped]);

  if (count === 0 && !dropped) return null;
  return (
    <div className="mx-auto flex max-w-md flex-col gap-2 px-4 pt-4">
      {count > 0 && (
        <p
          role="status"
          className="self-start rounded-full bg-warn-soft px-3 py-1 text-sm text-warn-ink"
        >
          ⏳ {count} mục chờ đồng bộ
        </p>
      )}
      {dropped && (
        <p
          role="alert"
          className="rounded-xl bg-danger-soft p-3 text-danger-ink"
        >
          Không lưu được: {dropped}.
        </p>
      )}
    </div>
  );
}
