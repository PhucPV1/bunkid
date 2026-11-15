import { describe, expect, it } from "vitest";
import {
  DEFAULT_NIGHT_SCHEDULE,
  resolveActiveTheme,
  type NightSchedule,
  type ThemePref,
} from "@/lib/rules/theme";
import {
  NIGHT_OVERRIDE_KEY,
  NIGHT_SCHEDULE_KEY,
  parseThemePref,
  readThemeState,
  resolveTheme,
  THEME_COLORS,
  THEME_INIT_SCRIPT,
  THEME_OPTIONS,
  THEME_STORAGE_KEY,
} from "./theme";

const vn = (hm: string, day = 14) =>
  new Date(
    Date.UTC(2026, 10, day, Number(hm.slice(0, 2)) - 7, Number(hm.slice(3))),
  );

function runInitScript(
  store: Record<string, string>,
  prefersDark: boolean,
  now: Date,
): string {
  const root = { dataset: {} as Record<string, string> };
  const fakeDate = { now: () => now.getTime(), parse: Date.parse };
  new Function("window", "document", "localStorage", "Date", THEME_INIT_SCRIPT)(
    { matchMedia: () => ({ matches: prefersDark }) },
    { documentElement: root },
    { getItem: (key: string) => store[key] ?? null },
    fakeDate,
  );
  return root.dataset.theme;
}

describe("theme storage", () => {
  it("parseThemePref keeps light and dark, everything else is system", () => {
    expect(parseThemePref("light")).toBe("light");
    expect(parseThemePref("dark")).toBe("dark");
    expect(parseThemePref("night")).toBe("system");
    expect(parseThemePref(null)).toBe("system");
    expect(parseThemePref("blue")).toBe("system");
  });

  it("resolveTheme follows the device only for system", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
  });

  it("offers Sáng, Tối, Tự động", () => {
    expect(THEME_OPTIONS).toEqual([
      { value: "light", label: "Sáng" },
      { value: "dark", label: "Tối" },
      { value: "system", label: "Tự động" },
    ]);
  });

  it("status bar colours match each theme's page colour", () => {
    expect(THEME_COLORS).toEqual({
      light: "#FBF3F0",
      rose: "#E9DBDB",
      peach: "#EFDCCD",
      lavender: "#E3DDE9",
      sea: "#DDE3E8",
      dark: "#0F0B12",
      night: "#0A0705",
    });
  });

  it("readThemeState migrates the old stored night choice to an override", () => {
    const store: Record<string, string> = { [THEME_STORAGE_KEY]: "night" };
    const state = readThemeState((k) => store[k] ?? null, vn("12:00"));
    expect(state).toEqual({
      pref: "system",
      schedule: DEFAULT_NIGHT_SCHEDULE,
      override: { on: true, until: vn("21:00").toISOString() },
      migrated: true,
    });
  });

  it("readThemeState reads the three keys", () => {
    const schedule: NightSchedule = {
      enabled: false,
      start: "22:00",
      end: "06:00",
    };
    const override = { on: false, until: vn("23:00").toISOString() };
    const store: Record<string, string> = {
      [THEME_STORAGE_KEY]: "dark",
      [NIGHT_SCHEDULE_KEY]: JSON.stringify(schedule),
      [NIGHT_OVERRIDE_KEY]: JSON.stringify(override),
    };
    expect(readThemeState((k) => store[k] ?? null, vn("12:00"))).toEqual({
      pref: "dark",
      schedule,
      override,
      migrated: false,
    });
  });
});

describe("THEME_INIT_SCRIPT matches resolveActiveTheme before React loads", () => {
  const cases: {
    name: string;
    store: Record<string, string>;
    dark: boolean;
    now: Date;
  }[] = [
    { name: "nothing stored, noon", store: {}, dark: false, now: vn("12:00") },
    { name: "nothing stored, 20:59", store: {}, dark: false, now: vn("20:59") },
    { name: "nothing stored, 21:00", store: {}, dark: false, now: vn("21:00") },
    {
      name: "nothing stored, 05:59",
      store: {},
      dark: true,
      now: vn("05:59", 15),
    },
    {
      name: "nothing stored, 06:00 dark device",
      store: {},
      dark: true,
      now: vn("06:00", 15),
    },
    {
      name: "dark chosen, noon",
      store: { [THEME_STORAGE_KEY]: "dark" },
      dark: false,
      now: vn("12:00"),
    },
    {
      name: "schedule off at night",
      store: {
        [THEME_STORAGE_KEY]: "light",
        [NIGHT_SCHEDULE_KEY]: JSON.stringify({
          enabled: false,
          start: "21:00",
          end: "06:00",
        }),
      },
      dark: false,
      now: vn("23:00"),
    },
    {
      name: "late schedule",
      store: {
        [NIGHT_SCHEDULE_KEY]: JSON.stringify({
          enabled: true,
          start: "22:30",
          end: "05:30",
        }),
      },
      dark: false,
      now: vn("22:00"),
    },
    {
      name: "override on at noon",
      store: {
        [NIGHT_OVERRIDE_KEY]: JSON.stringify({
          on: true,
          until: vn("21:00").toISOString(),
        }),
      },
      dark: false,
      now: vn("12:00"),
    },
    {
      name: "override off at night",
      store: {
        [NIGHT_OVERRIDE_KEY]: JSON.stringify({
          on: false,
          until: vn("06:00", 15).toISOString(),
        }),
      },
      dark: true,
      now: vn("23:00"),
    },
    {
      name: "expired override",
      store: {
        [NIGHT_OVERRIDE_KEY]: JSON.stringify({
          on: true,
          until: vn("11:00").toISOString(),
        }),
      },
      dark: false,
      now: vn("12:00"),
    },
  ];

  it.each(cases)("$name", ({ store, dark, now }) => {
    const state = readThemeState((k) => store[k] ?? null, now);
    const expected = resolveActiveTheme({ ...state, prefersDark: dark, now });
    expect(runInitScript(store, dark, now)).toBe(expected);
  });

  it("an old stored night choice paints night on the first frame", () => {
    expect(
      runInitScript({ [THEME_STORAGE_KEY]: "night" }, false, vn("12:00")),
    ).toBe("night");
  });

  it("falls back to light when storage throws", () => {
    const root = { dataset: {} as Record<string, string> };
    new Function(
      "window",
      "document",
      "localStorage",
      "Date",
      THEME_INIT_SCRIPT,
    )(
      { matchMedia: () => ({ matches: false }) },
      { documentElement: root },
      {
        getItem: () => {
          throw new Error("blocked");
        },
      },
      { now: () => vn("12:00").getTime(), parse: Date.parse },
    );
    expect(root.dataset.theme).toBe("light");
  });
});

// Type-level check that ThemePref is re-exported unchanged.
const _pref: ThemePref = "system";
void _pref;
