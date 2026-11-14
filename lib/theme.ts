export type ThemePref = "light" | "dark" | "night" | "system";
export type Theme = "light" | "dark" | "night";

export const THEME_STORAGE_KEY = "be-yeu-theme";

export const THEME_OPTIONS: { value: ThemePref; label: string }[] = [
  { value: "light", label: "Sáng" },
  { value: "dark", label: "Tối" },
  { value: "night", label: "Ban đêm" },
  { value: "system", label: "Theo hệ thống" },
];

export function parseThemePref(raw: string | null): ThemePref {
  return raw === "light" || raw === "dark" || raw === "night" ? raw : "system";
}

export function resolveTheme(pref: ThemePref, prefersDark: boolean): Theme {
  if (pref !== "system") return pref;
  return prefersDark ? "dark" : "light";
}

// Runs inline in <head> before the first paint, so it cannot import anything.
export const THEME_INIT_SCRIPT = `(function(){var t="light";try{var p=localStorage.getItem("${THEME_STORAGE_KEY}");if(p==="light"||p==="dark"||p==="night")t=p;else if(window.matchMedia("(prefers-color-scheme: dark)").matches)t="dark";}catch(e){}document.documentElement.dataset.theme=t;})();`;
