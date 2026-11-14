"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import {
  parseThemePref,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ThemePref,
} from "@/lib/theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function readPref(): ThemePref {
  if (typeof window === "undefined") return "system";
  try {
    return parseThemePref(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "system";
  }
}

function applyTheme(pref: ThemePref): void {
  document.documentElement.dataset.theme = resolveTheme(
    pref,
    window.matchMedia(DARK_QUERY).matches,
  );
}

export function useSystemThemeSync(): void {
  // Dev Strict Mode remounts <html> and clears the attribute the inline script set.
  useLayoutEffect(() => applyTheme(readPref()), []);
  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);
    const onChange = () => applyTheme(readPref());
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
}

export function useThemePref(): [ThemePref, (next: ThemePref) => void] {
  const [pref, setPref] = useState<ThemePref>(readPref);
  function choose(next: ThemePref) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private mode: the choice still applies until the app is closed.
    }
    applyTheme(next);
    setPref(next);
  }
  return [pref, choose];
}
