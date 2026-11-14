"use client";

import { useEffect, useState } from "react";
import {
  browserOpenDeps,
  OPEN_MODE_KEY,
  openYouTube,
  parseOpenMode,
  webUrl,
  type OpenMode,
} from "@/lib/rules/youtube";

// Opens a YouTube path the way this device was set to (kept in localStorage).
export function useYouTubeOpener() {
  const [mode, setModeState] = useState<OpenMode>("app");

  useEffect(() => {
    try {
      setModeState(parseOpenMode(window.localStorage.getItem(OPEN_MODE_KEY)));
    } catch {
      // Private mode or blocked storage: keep the default.
    }
  }, []);

  function setMode(next: OpenMode) {
    setModeState(next);
    try {
      window.localStorage.setItem(OPEN_MODE_KEY, next);
    } catch {
      // Not saved; still used for this visit.
    }
  }

  function open(path: string) {
    if (mode === "web") window.open(webUrl(path), "_blank", "noopener");
    else openYouTube(path, browserOpenDeps());
  }

  return { mode, setMode, open };
}
