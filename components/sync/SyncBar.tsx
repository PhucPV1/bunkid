"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { droppedWrites, takeRecentDrop } from "@/lib/data/outboxEvents";
import { useOutboxEntries } from "@/lib/hooks/useOutboxEntries";

const NOTICE_MS = 6000;

export function SyncBarView({
  count,
  dropped,
}: {
  count: number;
  dropped: string | null;
}) {
  if (count === 0 && !dropped) return null;
  return (
    <div className="flex flex-col gap-2 print:hidden">
      {count > 0 && (
        <p
          role="status"
          className="glass inline-flex min-h-8 items-center gap-1.5 self-start rounded-full px-3 text-[13px] font-medium text-ink"
        >
          <Icon name="clock" size={14} className="text-muted" />
          <span>{count} mục chờ đồng bộ</span>
        </p>
      )}
      {dropped && (
        <p
          role="alert"
          className="rounded-[16px] bg-danger-soft p-3 text-[15px] text-danger-ink"
        >
          Không lưu được: {dropped}.
        </p>
      )}
    </div>
  );
}

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

  return <SyncBarView count={count} dropped={dropped} />;
}
