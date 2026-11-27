"use client";

import { useEffect, useState } from "react";
import {
  deviceStore,
  readStoredTime,
  writeStoredTime,
} from "@/lib/data/storedTime";

// A time kept on this device under `key` (lib/data/storedTime.ts).
//   at    undefined until the storage has been read (the first render, and
//         the render right after `key` changed), then the time in ms, or null
//         when none is kept. With `key` null there is nothing to keep: null.
//   mark  keeps `now` under the key and reports it at once.
export function useStoredTime(key: string | null): {
  at: number | null | undefined;
  mark: (now: Date) => void;
} {
  const [read, setRead] = useState<{
    key: string | null;
    at: number | null;
  } | null>(null);

  useEffect(() => {
    setRead({
      key,
      at: key === null ? null : readStoredTime(deviceStore(), key),
    });
  }, [key]);

  function mark(now: Date) {
    if (key === null) return;
    writeStoredTime(deviceStore(), key, now);
    setRead({ key, at: now.getTime() });
  }

  // A value read for another key is not this key's.
  return { at: read && read.key === key ? read.at : undefined, mark };
}
