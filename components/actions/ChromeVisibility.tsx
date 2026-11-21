"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// Spec 2026-11-19 §6: a page can hide the tab bar and "+" while it shows a bar
// of its own. AuthGate owns the flag; ActionChrome reads it.
type Value = { hidden: boolean; setHidden: (hidden: boolean) => void };

const ChromeVisibility = createContext<Value>({
  hidden: false,
  setHidden: () => {},
});

export function ChromeVisibilityProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [hidden, setHidden] = useState(false);
  const value = useMemo(() => ({ hidden, setHidden }), [hidden]);
  return (
    <ChromeVisibility.Provider value={value}>
      {children}
    </ChromeVisibility.Provider>
  );
}

export function useChromeHidden(): boolean {
  return useContext(ChromeVisibility).hidden;
}

// The effect behind useHideChrome: raise the flag, lower it on cleanup.
export function holdChromeHidden(
  hide: boolean,
  setHidden: (hidden: boolean) => void,
): (() => void) | undefined {
  if (!hide) return undefined;
  setHidden(true);
  return () => setHidden(false);
}

// Hides the chrome while `hide` is true and the page is mounted. A layout
// effect: the flag is up before the first paint, so the tab bar never shows
// over the page's own bar. The flag is one boolean, for one page at a time.
export function useHideChrome(hide: boolean) {
  const { setHidden } = useContext(ChromeVisibility);
  useLayoutEffect(() => holdChromeHidden(hide, setHidden), [hide, setHidden]);
}
