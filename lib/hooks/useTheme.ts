"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import {
  DEFAULT_NIGHT_SCHEDULE,
  resolveActiveTheme,
  toggleNightOverride,
  type NightSchedule,
} from "@/lib/rules/theme";
import {
  NIGHT_OVERRIDE_KEY,
  NIGHT_SCHEDULE_KEY,
  readThemeState,
  THEME_COLORS,
  THEME_STORAGE_KEY,
  type ThemePref,
} from "@/lib/theme";
import type { ThemeName } from "@/lib/ui/tokens";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function storageGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private mode: the choice still applies until the app is closed.
  }
}

function storageRemove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Private mode: nothing was stored.
  }
}

export function applyTheme(): ThemeName {
  const now = new Date();
  const state = readThemeState(storageGet, now);
  if (state.migrated) {
    storageSet(THEME_STORAGE_KEY, state.pref);
    storageSet(NIGHT_OVERRIDE_KEY, JSON.stringify(state.override));
  }
  const theme = resolveActiveTheme({
    pref: state.pref,
    prefersDark: window.matchMedia(DARK_QUERY).matches,
    schedule: state.schedule,
    override: state.override,
    now,
  });
  document.documentElement.dataset.theme = theme;
  for (const meta of document.querySelectorAll('meta[name="theme-color"]'))
    meta.setAttribute("content", THEME_COLORS[theme]);
  return theme;
}

export function useSystemThemeSync(): void {
  // Dev Strict Mode remounts <html> and clears the attribute the inline script set.
  useLayoutEffect(() => {
    applyTheme();
  }, []);
  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);
    const onChange = () => {
      applyTheme();
    };
    media.addEventListener("change", onChange);
    window.addEventListener("storage", onChange);
    // The night schedule switches on its own while the app stays open.
    const timer = window.setInterval(onChange, 60_000);
    return () => {
      media.removeEventListener("change", onChange);
      window.removeEventListener("storage", onChange);
      window.clearInterval(timer);
    };
  }, []);
}

export function useThemePref(): [ThemePref, (next: ThemePref) => void] {
  const [pref, setPref] = useState<ThemePref>(() =>
    typeof window === "undefined"
      ? "system"
      : readThemeState(storageGet, new Date()).pref,
  );
  function choose(next: ThemePref) {
    storageSet(THEME_STORAGE_KEY, next);
    // A deliberate choice in Cài đặt ends any temporary night on/off.
    storageRemove(NIGHT_OVERRIDE_KEY);
    applyTheme();
    setPref(next);
  }
  return [pref, choose];
}

export function useNightSchedule(): [
  NightSchedule,
  (next: NightSchedule) => void,
] {
  const [schedule, setSchedule] = useState<NightSchedule>(() =>
    typeof window === "undefined"
      ? DEFAULT_NIGHT_SCHEDULE
      : readThemeState(storageGet, new Date()).schedule,
  );
  function save(next: NightSchedule) {
    storageSet(NIGHT_SCHEDULE_KEY, JSON.stringify(next));
    storageRemove(NIGHT_OVERRIDE_KEY);
    applyTheme();
    setSchedule(next);
  }
  return [schedule, save];
}

function currentTheme(): ThemeName {
  const value = document.documentElement.dataset.theme;
  return value === "dark" || value === "night" ? value : "light";
}

// Spec §6.6: the moon button turns Ban đêm on/off until the next schedule boundary.
export function useNightMode(): { night: boolean; toggle: () => void } {
  const [night, setNight] = useState(false);
  useEffect(() => {
    const sync = () => setNight(currentTheme() === "night");
    sync();
    // applyTheme() (schedule tick, system change, settings) rewrites data-theme; follow it.
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);
  function toggle() {
    const now = new Date();
    const { schedule } = readThemeState(storageGet, now);
    storageSet(
      NIGHT_OVERRIDE_KEY,
      JSON.stringify(toggleNightOverride(currentTheme(), schedule, now)),
    );
    applyTheme();
  }
  return { night, toggle };
}
