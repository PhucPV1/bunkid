import { describe, expect, it } from "vitest";
import {
  parseThemePref,
  resolveTheme,
  THEME_INIT_SCRIPT,
  THEME_STORAGE_KEY,
} from "./theme";

function runInitScript(stored: string | null, prefersDark: boolean): string {
  const root = { dataset: {} as Record<string, string> };
  const window = {
    matchMedia: () => ({ matches: prefersDark }),
  };
  const localStorage = {
    getItem: (key: string) => (key === THEME_STORAGE_KEY ? stored : null),
  };
  new Function("window", "document", "localStorage", THEME_INIT_SCRIPT)(
    window,
    { documentElement: root },
    localStorage,
  );
  return root.dataset.theme;
}

describe("theme", () => {
  it("parseThemePref falls back to system for unknown values", () => {
    expect(parseThemePref("night")).toBe("night");
    expect(parseThemePref(null)).toBe("system");
    expect(parseThemePref("blue")).toBe("system");
  });

  it("resolveTheme follows the device only for system", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("night", false)).toBe("night");
    expect(resolveTheme("light", true)).toBe("light");
  });

  it("THEME_INIT_SCRIPT applies the same rules before React loads", () => {
    expect(runInitScript("night", false)).toBe("night");
    expect(runInitScript(null, true)).toBe("dark");
    expect(runInitScript("system", false)).toBe("light");
    expect(runInitScript("blue", true)).toBe("dark");
  });

  it("THEME_INIT_SCRIPT falls back to light when storage throws", () => {
    const root = { dataset: {} as Record<string, string> };
    const localStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
    };
    new Function("window", "document", "localStorage", THEME_INIT_SCRIPT)(
      {},
      { documentElement: root },
      localStorage,
    );
    expect(root.dataset.theme).toBe("light");
  });
});
